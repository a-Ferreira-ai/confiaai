# Routes between stops using GTFS bus trips, synthetic metro schedules, and single-transfer paths.
# Metro has no GTFS stop_times in the MVP — durations are estimated via Haversine + fixed dwell times.
class ConnectionRouter
  TRANSFER_RADIUS_KM = 2.0
  METRO_SPEED_KMH = 35.0
  STATION_DWELL_MINUTES = 5
  TRANSFER_MINUTES = 5

  def self.call(origin_stop:, destination_stop:, mode_filter: nil)
    new(origin_stop: origin_stop, destination_stop: destination_stop, mode_filter: mode_filter).call
  end

  def initialize(origin_stop:, destination_stop:, mode_filter: nil)
    @origin_stop = origin_stop
    @destination_stop = destination_stop
    @mode_filter = mode_filter.presence
  end

  def call
    return [] if origin_stop.id == destination_stop.id

    routes = []
    routes.concat(direct_bus_routes) if bus_allowed?
    routes.concat(direct_metro_routes) if metro_allowed?

    if transfer_allowed? && (routes.empty? || cross_mode?)
      routes.concat(transfer_routes)
    end

    routes.sort_by { |route| route[:total_minutes] }.each_with_index.map do |route, index|
      route.merge(route_index: index)
    end
  end

  private

  attr_reader :origin_stop, :destination_stop, :mode_filter

  def bus_allowed?
    mode_filter.nil? || mode_filter == "bus"
  end

  def metro_allowed?
    mode_filter.nil? || mode_filter == "metro"
  end

  def transfer_allowed?
    mode_filter.nil?
  end

  def cross_mode?
    origin_stop.mode != destination_stop.mode
  end

  def direct_bus_routes
    return [] unless origin_stop.bus? && destination_stop.bus?

    matching_trips.filter_map do |trip|
      origin_time = stop_time_for(trip, origin_stop)
      dest_time = stop_time_for(trip, destination_stop)
      next unless origin_time && dest_time
      next unless origin_time.stop_sequence < dest_time.stop_sequence

      duration = minutes_between(origin_time.scheduled_at, dest_time.scheduled_at)

      build_route(
        route_type: "direct",
        legs: [
          bus_leg(
            trip: trip,
            from_stop: origin_stop,
            to_stop: destination_stop,
            origin_stop_time: origin_time,
            destination_stop_time: dest_time,
            duration_minutes: duration
          )
        ]
      )
    end
  end

  def matching_trips
    Trip.includes(:line, :stop_times).joins(:line).where(lines: { mode: :bus }).select do |trip|
      stop_ids = trip.stop_times.map(&:stop_id)
      stop_ids.include?(origin_stop.id) && stop_ids.include?(destination_stop.id)
    end
  end

  def direct_metro_routes
    return [] unless origin_stop.metro? && destination_stop.metro?

    origin_index = metro_station_index(origin_stop)
    dest_index = metro_station_index(destination_stop)
    return [] if origin_index.nil? || dest_index.nil? || origin_index >= dest_index

    duration = metro_segment_minutes(origin_stop, destination_stop, stations_between: dest_index - origin_index - 1)

    build_route(
      route_type: "direct",
      legs: [
        metro_leg(
          from_stop: origin_stop,
          to_stop: destination_stop,
          duration_minutes: duration,
          intermediate_stops: dest_index - origin_index - 1
        )
      ]
    )
  end

  def transfer_routes
    routes = []

    if origin_stop.bus? && destination_stop.bus?
      routes.concat(bus_metro_bus_transfer)
    elsif origin_stop.bus? && destination_stop.metro?
      routes.concat(bus_to_metro_transfer(origin_stop, destination_stop))
    elsif origin_stop.metro? && destination_stop.bus?
      routes.concat(metro_to_bus_transfer(origin_stop, destination_stop))
    end

    routes
  end

  def bus_metro_bus_transfer
    origin_metro = nearest_metro_stop(origin_stop)
    dest_metro = nearest_metro_stop(destination_stop)
    return [] unless origin_metro && dest_metro

    origin_index = metro_station_index(origin_metro)
    dest_index = metro_station_index(dest_metro)
    return [] if origin_index.nil? || dest_index.nil?

    return [] if origin_index >= dest_index

    legs = []
    bus_to_metro = first_bus_leg_to(origin_stop, origin_metro)
    legs << bus_to_metro if bus_to_metro
    legs << transfer_leg(from_stop: origin_metro, to_stop: origin_metro)
    legs << metro_leg(
      from_stop: origin_metro,
      to_stop: dest_metro,
      duration_minutes: metro_segment_minutes(origin_metro, dest_metro, stations_between: dest_index - origin_index - 1),
      intermediate_stops: dest_index - origin_index - 1
    )
    legs << transfer_leg(from_stop: dest_metro, to_stop: dest_metro)
    bus_from_metro = first_bus_leg_from(dest_metro, destination_stop)
    legs << bus_from_metro if bus_from_metro

    return [] if legs.compact.size < 3

    [build_route(route_type: "transfer", legs: legs.compact)]
  end

  def bus_to_metro_transfer(from_bus, to_metro)
    nearest = nearest_metro_stop(from_bus)
    return [] unless nearest

    nearest_index = metro_station_index(nearest)
    dest_index = metro_station_index(to_metro)
    return [] if nearest_index.nil? || dest_index.nil? || nearest_index >= dest_index

    legs = []
    bus_leg_part = first_bus_leg_to(from_bus, nearest)
    legs << bus_leg_part if bus_leg_part
    legs << transfer_leg(from_stop: nearest, to_stop: nearest)
    legs << metro_leg(
      from_stop: nearest,
      to_stop: to_metro,
      duration_minutes: metro_segment_minutes(nearest, to_metro, stations_between: dest_index - nearest_index - 1),
      intermediate_stops: dest_index - nearest_index - 1
    )

    return [] if legs.compact.empty?

    [build_route(route_type: "transfer", legs: legs.compact)]
  end

  def metro_to_bus_transfer(from_metro, to_bus)
    nearest = nearest_metro_stop(to_bus)
    return [] unless nearest

    origin_index = metro_station_index(from_metro)
    nearest_index = metro_station_index(nearest)
    return [] if origin_index.nil? || nearest_index.nil? || origin_index >= nearest_index

    legs = [
      metro_leg(
        from_stop: from_metro,
        to_stop: nearest,
        duration_minutes: metro_segment_minutes(from_metro, nearest, stations_between: nearest_index - origin_index - 1),
        intermediate_stops: nearest_index - origin_index - 1
      ),
      transfer_leg(from_stop: nearest, to_stop: nearest)
    ]

    bus_leg_part = first_bus_leg_from(nearest, to_bus)
    legs << bus_leg_part if bus_leg_part

    return [] if legs.compact.size < 2

    [build_route(route_type: "transfer", legs: legs.compact)]
  end

  def first_bus_leg_to(from_stop, to_stop)
    matching_trips.each do |trip|
      origin_time = stop_time_for(trip, from_stop)
      dest_time = stop_time_for(trip, to_stop)
      next unless origin_time && dest_time
      next unless origin_time.stop_sequence < dest_time.stop_sequence

      return bus_leg(
        trip: trip,
        from_stop: from_stop,
        to_stop: to_stop,
        origin_stop_time: origin_time,
        destination_stop_time: dest_time,
        duration_minutes: minutes_between(origin_time.scheduled_at, dest_time.scheduled_at)
      )
    end

    nil
  end

  def first_bus_leg_from(from_stop, to_stop)
    first_bus_leg_to(from_stop, to_stop)
  end

  def bus_leg(trip:, from_stop:, to_stop:, origin_stop_time:, destination_stop_time:, duration_minutes:)
    {
      leg_type: "transit",
      mode: "bus",
      line_id: trip.line_id,
      line_name: trip.line.name,
      trip_id: trip.id,
      from_stop: from_stop,
      to_stop: to_stop,
      origin_stop_time: origin_stop_time,
      destination_stop_time: destination_stop_time,
      duration_minutes: duration_minutes,
      intermediate_stops: 0
    }
  end

  def metro_leg(from_stop:, to_stop:, duration_minutes:, intermediate_stops: 0)
    {
      leg_type: "transit",
      mode: "metro",
      line_id: nil,
      line_name: I18n.t("routing.metro_line_name"),
      trip_id: nil,
      from_stop: from_stop,
      to_stop: to_stop,
      origin_stop_time: nil,
      destination_stop_time: nil,
      duration_minutes: duration_minutes,
      intermediate_stops: intermediate_stops
    }
  end

  def transfer_leg(from_stop:, to_stop:)
    {
      leg_type: "transfer",
      mode: "transfer",
      line_id: nil,
      line_name: I18n.t("routing.transfer"),
      trip_id: nil,
      from_stop: from_stop,
      to_stop: to_stop,
      origin_stop_time: nil,
      destination_stop_time: nil,
      duration_minutes: TRANSFER_MINUTES,
      intermediate_stops: 0
    }
  end

  def build_route(route_type:, legs:)
    total = legs.sum { |leg| leg[:duration_minutes] }

    {
      route_type: route_type,
      total_minutes: total,
      legs: legs
    }
  end

  def nearest_metro_stop(stop)
    Geo::DistanceCalculator.nearest_stop(
      stop.latitude.to_f,
      stop.longitude.to_f,
      radius_km: TRANSFER_RADIUS_KM,
      scope: Stop.metro
    )
  end

  def metro_segment_minutes(from_stop, to_stop, stations_between:)
    distance_km = Geo::DistanceCalculator.distance_km(
      from_stop.latitude.to_f,
      from_stop.longitude.to_f,
      to_stop.latitude.to_f,
      to_stop.longitude.to_f
    )
    travel_minutes = (distance_km / METRO_SPEED_KMH * 60).ceil
    travel_minutes + (stations_between * STATION_DWELL_MINUTES)
  end

  def metro_station_index(stop)
    metro_station_index_map[stop.gtfs_id]
  end

  def metro_station_index_map
    @metro_station_index_map ||= metro_station_gtfs_ids.each_with_index.to_h
  end

  def metro_station_gtfs_ids
    @metro_station_gtfs_ids ||= begin
      path = Rails.root.join("data/metro_stations.yml")
      return [] unless path.exist?

      YAML.load_file(path).fetch("stations", []).map { |station| station["gtfs_id"] }
    end
  end

  def stop_time_for(trip, stop)
    trip.stop_times.find { |st| st.stop_id == stop.id }
  end

  def minutes_between(start_time, end_time)
    ((end_time - start_time) / 60).ceil
  end
end
