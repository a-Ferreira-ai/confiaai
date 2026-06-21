# frozen_string_literal: true

require "csv"

module Gtfs
  class Importer
    # Ceilândia ↔ Taguatinga demo corridor bounding box.
    MIN_LATITUDE = -16.05
    MAX_LATITUDE = -15.75
    MIN_LONGITUDE = -48.25
    MAX_LONGITUDE = -47.95

    def self.call(path:)
      new(path: path).call
    end

    def initialize(path:)
      @path = Pathname.new(path)
    end

    def call
      validate_path!

      ActiveRecord::Base.transaction do
        import_lines
        import_stops
        import_trips
        import_stop_times
      end

      summary
    end

    private

    attr_reader :path

    def validate_path!
      raise ArgumentError, "GTFS path not found: #{path}" unless path.directory?

      %w[routes.txt trips.txt stops.txt stop_times.txt].each do |filename|
        raise ArgumentError, "Missing #{filename} in #{path}" unless (path + filename).exist?
      end
    end

    def import_lines
      each_row("routes.txt") do |row|
        next unless in_bounding_box?(row)

        line = Line.find_or_initialize_by(gtfs_id: row["route_id"])
        line.assign_attributes(
          name: row["route_short_name"].presence || row["route_long_name"],
          mode: :bus,
          color: row["route_color"].presence
        )
        line.save!
        @line_ids ||= {}
        @line_ids[row["route_id"]] = line.id
      end
    end

    def import_stops
      each_row("stops.txt") do |row|
        next unless in_bounding_box?(row)

        stop = Stop.find_or_initialize_by(gtfs_id: row["stop_id"])
        stop.assign_attributes(
          name: row["stop_name"],
          latitude: row["stop_lat"],
          longitude: row["stop_lon"],
          mode: :bus
        )
        stop.save!
        @stop_ids ||= {}
        @stop_ids[row["stop_id"]] = stop.id
      end
    end

    def import_trips
      each_row("trips.txt") do |row|
        line_id = @line_ids[row["route_id"]]
        next unless line_id

        trip = Trip.find_or_initialize_by(gtfs_id: row["trip_id"])
        trip.assign_attributes(
          line_id: line_id,
          headsign: row["trip_headsign"],
          direction: row["direction_id"].to_i
        )
        trip.save!
        @trip_ids ||= {}
        @trip_ids[row["trip_id"]] = trip.id
      end
    end

    def import_stop_times
      each_row("stop_times.txt") do |row|
        trip_id = @trip_ids[row["trip_id"]]
        stop_id = @stop_ids[row["stop_id"]]
        next unless trip_id && stop_id

        scheduled_at = parse_gtfs_time(row["arrival_time"].presence || row["departure_time"])
        stop_sequence = row["stop_sequence"].to_i

        stop_time = StopTime.find_or_initialize_by(trip_id: trip_id, stop_sequence: stop_sequence)
        stop_time.assign_attributes(
          stop_id: stop_id,
          scheduled_at: scheduled_at
        )
        stop_time.save!
      end
    end

    def each_row(filename)
      CSV.foreach(path + filename, headers: true, liberal_parsing: true) do |row|
        yield row
      end
    end

    def in_bounding_box?(row)
      latitude = row["stop_lat"]&.to_f || row["latitude"]&.to_f
      longitude = row["stop_lon"]&.to_f || row["longitude"]&.to_f
      return true unless latitude && longitude && !latitude.zero? && !longitude.zero?

      latitude.between?(MIN_LATITUDE, MAX_LATITUDE) &&
        longitude.between?(MIN_LONGITUDE, MAX_LONGITUDE)
    end

    def parse_gtfs_time(time_string)
      hours, minutes, seconds = time_string.split(":").map(&:to_i)
      base_date = Date.new(2000, 1, 1)
      extra_days = hours / 24
      normalized_hours = hours % 24

      Time.zone.local(
        base_date.year,
        base_date.month,
        base_date.day + extra_days,
        normalized_hours,
        minutes,
        seconds
      )
    end

    def summary
      {
        lines: Line.count,
        stops: Stop.count,
        trips: Trip.count,
        stop_times: StopTime.count
      }
    end
  end
end
