# Compares GTFS scheduled times (via arrival_events.scheduled_at) against
# observed arrivals (GPS + user reports). Thresholds are MVP defaults until SPEC.md exists.
class ReliabilityScore
  ON_TIME_THRESHOLD_SECONDS = 300
  HIGH_MEDIAN_DELAY_SECONDS = 300
  MEDIUM_MEDIAN_DELAY_SECONDS = 900
  HIGH_ON_TIME_PERCENT = 80.0
  MEDIUM_ON_TIME_PERCENT = 50.0
  DEFAULT_TIME_WINDOW = 7.days

  def self.call(line: nil, stop: nil, time_window: DEFAULT_TIME_WINDOW)
    new(line: line, stop: stop, time_window: time_window).call
  end

  def initialize(line: nil, stop: nil, time_window: DEFAULT_TIME_WINDOW)
    @line = line
    @stop = stop
    @time_window = time_window

    raise ArgumentError, "line or stop must be provided" if line.nil? && stop.nil?
  end

  def call
    events = scoped_events.to_a

    if events.empty?
      return build_result(
        level: "medium",
        label_key: "no_data",
        sample_size: 0,
        median_delay_seconds: nil,
        on_time_percent: nil
      )
    end

    delays = events.map { |event| event.delay_seconds.abs }
    median_delay = median(delays)
    on_time_percent = (delays.count { |delay| delay <= ON_TIME_THRESHOLD_SECONDS }.to_f / delays.size * 100).round(1)
    level = classify_level(median_delay, on_time_percent)

    build_result(
      level: level,
      label_key: level,
      sample_size: events.size,
      median_delay_seconds: median_delay,
      on_time_percent: on_time_percent
    )
  end

  private

  attr_reader :line, :stop, :time_window

  def scoped_events
    scope = ArrivalEvent.where("observed_at >= ?", time_window.ago)
    scope = scope.joins(trip: :line).where(trips: { line_id: line.id }) if line
    scope = scope.where(stop_id: stop.id) if stop
    scope
  end

  def median(values)
    sorted = values.sort
    mid = sorted.length / 2

    if sorted.length.odd?
      sorted[mid]
    else
      ((sorted[mid - 1] + sorted[mid]) / 2.0).round
    end
  end

  def classify_level(median_delay, on_time_percent)
    if median_delay <= HIGH_MEDIAN_DELAY_SECONDS || on_time_percent >= HIGH_ON_TIME_PERCENT
      "high"
    elsif median_delay <= MEDIUM_MEDIAN_DELAY_SECONDS || on_time_percent >= MEDIUM_ON_TIME_PERCENT
      "medium"
    else
      "low"
    end
  end

  def build_result(level:, label_key:, sample_size:, median_delay_seconds:, on_time_percent:)
    {
      level: level,
      label: I18n.t("reliability.level.#{label_key}"),
      sample_size: sample_size,
      median_delay_seconds: median_delay_seconds,
      on_time_percent: on_time_percent
    }
  end
end
