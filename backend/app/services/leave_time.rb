# Computes when to leave given a route and desired arrival time, adding reliability buffers per leg.
class LeaveTime
  METRO_BUFFER_SECONDS = 120
  DEFAULT_BUS_BUFFER_SECONDS = 300
  RELIABILITY_RANK = { "high" => 0, "medium" => 1, "low" => 2, "no_data" => 1 }.freeze

  def self.call(route:, arrive_by:)
    new(route: route, arrive_by: arrive_by).call
  end

  def initialize(route:, arrive_by:)
    @route = route
    @arrive_by = arrive_by.in_time_zone
  end

  def call
    current_time = arrive_by
    total_buffer_seconds = 0
    reliability_levels = []
    scheduled_legs = route[:legs].reverse.map do |leg|
      buffer_seconds = buffer_for_leg(leg)
      total_buffer_seconds += buffer_seconds
      reliability_levels << reliability_for_leg(leg) if leg[:mode] == "bus"

      leg_end = current_time
      leg_start = leg_end - leg[:duration_minutes].minutes - buffer_seconds.seconds

      current_time = leg_start

      leg.merge(
        depart_at: leg_start,
        arrive_at: leg_end,
        buffer_seconds: buffer_seconds
      )
    end.reverse

    {
      leave_at: current_time,
      arrive_at: arrive_by,
      buffer_seconds: total_buffer_seconds,
      total_minutes: route[:total_minutes],
      reliability: aggregate_reliability(reliability_levels),
      legs: scheduled_legs
    }
  end

  private

  attr_reader :route, :arrive_by

  def buffer_for_leg(leg)
    case leg[:mode]
    when "bus"
      bus_buffer_seconds(leg)
    when "metro"
      METRO_BUFFER_SECONDS
    else
      0
    end
  end

  def bus_buffer_seconds(leg)
    line = Line.find_by(id: leg[:line_id])
    return DEFAULT_BUS_BUFFER_SECONDS unless line

    score = ReliabilityScore.call(line: line, stop: leg[:from_stop])
    score[:median_delay_seconds].presence || DEFAULT_BUS_BUFFER_SECONDS
  end

  def reliability_for_leg(leg)
    line = Line.find_by(id: leg[:line_id])
    return { level: "medium", label: I18n.t("reliability.level.no_data") } unless line

    ReliabilityScore.call(line: line, stop: leg[:from_stop])
  end

  def aggregate_reliability(levels)
    return { level: "medium", label: I18n.t("reliability.level.no_data") } if levels.empty?

    worst = levels.max_by { |score| RELIABILITY_RANK.fetch(score[:level], 1) }
    {
      level: worst[:level],
      label: worst[:label]
    }
  end
end
