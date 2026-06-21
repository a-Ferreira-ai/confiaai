# Ranks lines by reliability score (high > medium > low), with tie-breakers.
class LineRanking
  LEVEL_PRIORITY = { "high" => 3, "medium" => 2, "low" => 1 }.freeze

  def self.call
    new.call
  end

  def call
    entries = Line.order(:name).map do |line|
      reliability = ReliabilityScore.call(line: line)
      { line: line, reliability: reliability }
    end

    sorted = entries.sort { |left, right| compare(left, right) }

    sorted.each_with_index.map do |entry, index|
      {
        rank: index + 1,
        line: entry[:line],
        reliability: entry[:reliability]
      }
    end
  end

  private

  def compare(left, right)
    left_rel = left[:reliability]
    right_rel = right[:reliability]

    left_no_data = left_rel[:sample_size].zero?
    right_no_data = right_rel[:sample_size].zero?

    return 1 if left_no_data && !right_no_data
    return -1 if right_no_data && !left_no_data
    return 0 if left_no_data && right_no_data

    by_level = LEVEL_PRIORITY[right_rel[:level]] <=> LEVEL_PRIORITY[left_rel[:level]]
    return by_level unless by_level.zero?

    left_on_time = left_rel[:on_time_percent] || 0
    right_on_time = right_rel[:on_time_percent] || 0
    by_on_time = right_on_time <=> left_on_time
    return by_on_time unless by_on_time.zero?

    left_delay = left_rel[:median_delay_seconds] || Float::INFINITY
    right_delay = right_rel[:median_delay_seconds] || Float::INFINITY
    left_delay <=> right_delay
  end
end
