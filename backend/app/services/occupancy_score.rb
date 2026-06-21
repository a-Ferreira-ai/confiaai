# Aggregates occupancy_readings for a stop (optionally scoped to a trip).
# Precedence: seat_sensor / turnstile over user_report when hardware readings exist
# in the time window. Thresholds and window are MVP defaults until SPEC.md exists.
class OccupancyScore
  DEFAULT_TIME_WINDOW = 30.minutes
  HARDWARE_SOURCES = %w[seat_sensor turnstile].freeze
  USER_SOURCE = "user_report"

  FREE_SEATS_THRESHOLD = 10
  MODERATE_SEATS_THRESHOLD = 3
  CROWDED_SEATS_THRESHOLD = 1

  def self.call(stop:, trip: nil, time_window: DEFAULT_TIME_WINDOW)
    new(stop: stop, trip: trip, time_window: time_window).call
  end

  def initialize(stop:, trip: nil, time_window: DEFAULT_TIME_WINDOW)
    @stop = stop
    @trip = trip
    @time_window = time_window

    raise ArgumentError, "stop must be provided" if stop.nil?
  end

  def call
    readings = scoped_readings.to_a

    if readings.empty?
      return build_result(
        level: "moderate",
        label_key: "no_data",
        sample_size: 0,
        source: nil,
        recorded_at: nil
      )
    end

    hardware_readings = readings.select { |reading| HARDWARE_SOURCES.include?(reading.source) }
    selected = hardware_readings.max_by(&:recorded_at) || readings.select { |r| r.source == USER_SOURCE }.max_by(&:recorded_at)

    if selected.nil?
      return build_result(
        level: "moderate",
        label_key: "no_data",
        sample_size: 0,
        source: nil,
        recorded_at: nil
      )
    end

    level = resolve_level(selected)

    build_result(
      level: level,
      label_key: level,
      sample_size: readings.size,
      source: selected.source,
      recorded_at: selected.recorded_at
    )
  end

  private

  attr_reader :stop, :trip, :time_window

  def scoped_readings
    scope = OccupancyReading.where(stop_id: stop.id).where("recorded_at >= ?", time_window.ago)
    scope = scope.where(trip_id: trip.id) if trip
    scope.order(recorded_at: :desc)
  end

  def resolve_level(reading)
    return reading.level if reading.level.present?

    derive_level_from_counts(reading.free_seats, reading.boarding_count)
  end

  def derive_level_from_counts(free_seats, boarding_count)
    if free_seats.present?
      return "free" if free_seats >= FREE_SEATS_THRESHOLD
      return "moderate" if free_seats >= MODERATE_SEATS_THRESHOLD
      return "crowded" if free_seats >= CROWDED_SEATS_THRESHOLD

      return "packed"
    end

    if boarding_count.present?
      return "free" if boarding_count <= 5
      return "moderate" if boarding_count <= 15
      return "crowded" if boarding_count <= 30

      return "packed"
    end

    "moderate"
  end

  def build_result(level:, label_key:, sample_size:, source:, recorded_at:)
    {
      level: level,
      label: I18n.t("occupancy.levels.#{label_key}"),
      sample_size: sample_size,
      source: source,
      source_label: source ? I18n.t("enums.occupancy_reading.source.#{source}") : nil,
      recorded_at: recorded_at
    }
  end
end
