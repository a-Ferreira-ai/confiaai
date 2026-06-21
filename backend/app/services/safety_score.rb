# Aggregates anonymous stop_reports for a stop. Thresholds are MVP defaults until SPEC.md exists.
class SafetyScore
  HIGH_SEVERITY_THRESHOLD = 1.5
  MEDIUM_SEVERITY_THRESHOLD = 2.5
  DEFAULT_TIME_WINDOW = 7.days

  def self.call(stop:, time_window: DEFAULT_TIME_WINDOW)
    new(stop: stop, time_window: time_window).call
  end

  def initialize(stop:, time_window: DEFAULT_TIME_WINDOW)
    @stop = stop
    @time_window = time_window

    raise ArgumentError, "stop must be provided" if stop.nil?
  end

  def call
    reports = scoped_reports.to_a

    if reports.empty?
      return build_result(
        level: "medium",
        label_key: "no_data",
        sample_size: 0,
        average_severity: nil
      )
    end

    average_severity = (reports.sum(&:severity).to_f / reports.size).round(2)
    level = classify_level(average_severity)

    build_result(
      level: level,
      label_key: level,
      sample_size: reports.size,
      average_severity: average_severity
    )
  end

  private

  attr_reader :stop, :time_window

  def scoped_reports
    StopReport.where(stop_id: stop.id).where("recorded_at >= ?", time_window.ago)
  end

  def classify_level(average_severity)
    if average_severity <= HIGH_SEVERITY_THRESHOLD
      "high"
    elsif average_severity <= MEDIUM_SEVERITY_THRESHOLD
      "medium"
    else
      "low"
    end
  end

  def build_result(level:, label_key:, sample_size:, average_severity:)
    {
      level: level,
      label: I18n.t("safety.level.#{label_key}"),
      sample_size: sample_size,
      average_severity: average_severity
    }
  end
end
