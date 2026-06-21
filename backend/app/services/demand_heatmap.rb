# Aggregates origin/destination demand searches per stop for heatmap visualization.
# Each search increments both origin and destination stop counts.
class DemandHeatmap
  DEFAULT_TIME_WINDOW = 7.days

  def self.call(time_window: DEFAULT_TIME_WINDOW)
    new(time_window: time_window).call
  end

  def initialize(time_window: DEFAULT_TIME_WINDOW)
    @time_window = time_window
  end

  def call
    searches = DemandSearch.where("searched_at >= ?", time_window.ago)
    return empty_result if searches.empty?

    counts = Hash.new(0)
    searches.find_each do |search|
      counts[search.origin_stop_id] += 1
      counts[search.destination_stop_id] += 1
    end

    max_count = counts.values.max.to_f
    stops = Stop.where(id: counts.keys).index_by(&:id)

    points = counts.filter_map do |stop_id, count|
      stop = stops[stop_id]
      next unless stop

      {
        stop_id: stop.id,
        name: stop.name,
        latitude: stop.latitude,
        longitude: stop.longitude,
        search_count: count,
        intensity: (count / max_count).round(3)
      }
    end.sort_by { |point| -point[:search_count] }

    {
      window_days: (time_window / 1.day).to_i,
      total_searches: searches.count,
      points: points
    }
  end

  private

  attr_reader :time_window

  def empty_result
    {
      window_days: (time_window / 1.day).to_i,
      total_searches: 0,
      points: []
    }
  end
end
