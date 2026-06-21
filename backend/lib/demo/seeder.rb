# frozen_string_literal: true

require_relative "../gtfs/importer"

module Demo
  class Seeder
    DEMO_TOKENS = [
      "00000000-0000-4000-8000-000000000001",
      "00000000-0000-4000-8000-000000000002",
      "00000000-0000-4000-8000-000000000003"
    ].freeze

    def self.call(reset: true)
      new(reset: reset).call
    end

    def initialize(reset: true)
      @reset = reset
    end

    def call
      import_base_data!
      clear_event_data! if reset

      counts = {}
      ActiveRecord::Base.transaction do
        counts[:arrival_events] = seed_arrival_events
        counts[:occupancy_readings] = seed_occupancy_readings
        counts[:stop_reports] = seed_stop_reports
        counts[:demand_searches] = seed_demand_searches
      end

      {
        lines: Line.count,
        stops: Stop.count,
        trips: Trip.count,
        stop_times: StopTime.count,
        **counts
      }
    end

    private

    attr_reader :reset

    def import_base_data!
      Gtfs::Importer.call(path: Rails.root.join("data/gtfs").to_s)
      import_metro_stations!
    end

    def import_metro_stations!
      path = Rails.root.join("data/metro_stations.yml")
      raise "Missing #{path}" unless path.exist?

      stations = YAML.load_file(path).fetch("stations")
      stations.each do |attrs|
        stop = Stop.find_or_initialize_by(gtfs_id: attrs["gtfs_id"])
        stop.assign_attributes(
          name: attrs["name"],
          latitude: attrs["latitude"],
          longitude: attrs["longitude"],
          mode: :metro
        )
        stop.save!
      end
    end

    def clear_event_data!
      ArrivalEvent.delete_all
      OccupancyReading.delete_all
      StopReport.delete_all
      DemandSearch.delete_all
    end

    def seed_arrival_events
      trip = Trip.find_by!(gtfs_id: "TRIP001")
      stop_times = StopTime.where(trip: trip).order(:stop_sequence).includes(:stop).to_a
      raise "Expected 2 stop_times for TRIP001" if stop_times.size < 2

      delays = [
        0, 60, 120, 180, 240, 300,
        0, 90, 150, 210, 270,
        450, 520, 600,
        0, 30, 180, 300, 420,
        0, 100, 200, 250
      ]

      sources = %i[gps user gps user gps]
      contexts = %i[gps geofence_arrival on_demand gps geofence_boarding]

      delays.each_with_index do |delay_seconds, index|
        stop_time = stop_times[index % stop_times.size]
        day_offset = index % 7
        observed_at = Time.current - day_offset.days - (index % 12).hours - (index % 45).minutes
        scheduled_at = stop_time.scheduled_at.change(
          year: observed_at.year,
          month: observed_at.month,
          day: observed_at.day
        )

        ArrivalEvent.create!(
          trip: trip,
          stop: stop_time.stop,
          scheduled_at: scheduled_at,
          observed_at: observed_at,
          delay_seconds: delay_seconds,
          source: sources[index % sources.size],
          context: contexts[index % contexts.size],
          device_token: DEMO_TOKENS[index % DEMO_TOKENS.size]
        )
      end

      delays.size
    end

    def seed_occupancy_readings
      trip = Trip.find_by!(gtfs_id: "TRIP001")
      stop_ceilandia = Stop.find_by!(gtfs_id: "STOP001")
      stop_taguatinga = Stop.find_by!(gtfs_id: "STOP002")
      stop_metro = Stop.find_by!(gtfs_id: "metro-ceilandia-centro")

      readings = [
        {
          trip: trip,
          stop: stop_ceilandia,
          recorded_at: 18.minutes.ago,
          source: :seat_sensor,
          free_seats: 2,
          context: :gps,
          device_token: DEMO_TOKENS[0]
        },
        {
          trip: trip,
          stop: stop_taguatinga,
          recorded_at: 22.minutes.ago,
          source: :turnstile,
          boarding_count: 8,
          context: :geofence_boarding,
          device_token: DEMO_TOKENS[1]
        },
        {
          trip: trip,
          stop: stop_ceilandia,
          recorded_at: 45.minutes.ago,
          source: :user_report,
          level: :moderate,
          context: :on_demand,
          device_token: DEMO_TOKENS[2]
        },
        {
          trip: trip,
          stop: stop_metro,
          recorded_at: 20.minutes.ago,
          source: :turnstile,
          boarding_count: 12,
          context: :geofence_arrival,
          device_token: DEMO_TOKENS[0]
        }
      ]

      readings.each { |attrs| OccupancyReading.create!(attrs) }
      readings.size
    end

    def seed_stop_reports
      stop_ceilandia = Stop.find_by!(gtfs_id: "STOP001")
      stop_taguatinga = Stop.find_by!(gtfs_id: "STOP002")
      stop_metro = Stop.find_by!(gtfs_id: "metro-ceilandia-centro")

      reports = [
        { stop: stop_ceilandia, category: :iluminacao, severity: 1, days_ago: 1, context: :geofence_arrival },
        { stop: stop_ceilandia, category: :infraestrutura, severity: 1, days_ago: 3, context: :on_demand },
        { stop: stop_ceilandia, category: :seguranca_geral, severity: 2, days_ago: 5, context: :geofence_arrival },
        { stop: stop_taguatinga, category: :iluminacao, severity: 3, days_ago: 2, context: :on_demand },
        { stop: stop_taguatinga, category: :seguranca_geral, severity: 3, days_ago: 4, context: :geofence_arrival },
        { stop: stop_metro, category: :infraestrutura, severity: 2, days_ago: 6, context: :on_demand },
        { stop: stop_metro, category: :iluminacao, severity: 1, days_ago: 1, context: :geofence_arrival }
      ]

      reports.each_with_index do |attrs, index|
        StopReport.create!(
          stop: attrs[:stop],
          category: attrs[:category],
          severity: attrs[:severity],
          context: attrs[:context],
          recorded_at: attrs[:days_ago].days.ago - index.hours,
          device_token: DEMO_TOKENS[index % DEMO_TOKENS.size]
        )
      end

      reports.size
    end

    def seed_demand_searches
      pairs = [
        { origin: "STOP001", destination: "STOP002", count: 8, mode_filter: nil },
        { origin: "STOP002", destination: "STOP001", count: 6, mode_filter: :bus },
        { origin: "metro-ceilandia-centro", destination: "metro-taguatinga-centro", count: 7, mode_filter: :metro },
        { origin: "metro-taguatinga-centro", destination: "metro-ceilandia-centro", count: 5, mode_filter: :metro },
        { origin: "STOP001", destination: "metro-taguatinga-centro", count: 3, mode_filter: nil },
        { origin: "metro-ceilandia-centro", destination: "STOP002", count: 2, mode_filter: nil }
      ]

      total = 0
      pairs.each do |pair|
        origin = Stop.find_by!(gtfs_id: pair[:origin])
        destination = Stop.find_by!(gtfs_id: pair[:destination])

        pair[:count].times do |index|
          DemandSearch.create!(
            origin_stop: origin,
            destination_stop: destination,
            mode_filter: pair[:mode_filter],
            searched_at: (index % 7).days.ago - (index % 10).hours
          )
          total += 1
        end
      end

      total
    end
  end
end
