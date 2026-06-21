# Orchestrates ConnectionRouter + LeaveTime for search and route detail endpoints.
class RouteSearch
  DEFAULT_ARRIVAL_OFFSET = 1.hour

  def self.call(origin_stop:, destination_stop:, mode_filter: nil, arrive_by: nil)
    new(
      origin_stop: origin_stop,
      destination_stop: destination_stop,
      mode_filter: mode_filter,
      arrive_by: arrive_by
    ).call
  end

  def initialize(origin_stop:, destination_stop:, mode_filter: nil, arrive_by: nil)
    @origin_stop = origin_stop
    @destination_stop = destination_stop
    @mode_filter = mode_filter
    @arrive_by = arrive_by || default_arrive_by
  end

  def call
    routes = ConnectionRouter.call(
      origin_stop: origin_stop,
      destination_stop: destination_stop,
      mode_filter: mode_filter
    )

    routes.map do |route|
      LeaveTime.call(route: route, arrive_by: arrive_by).merge(
        route_index: route[:route_index],
        route_type: route[:route_type]
      )
    end
  end

  private

  attr_reader :origin_stop, :destination_stop, :mode_filter, :arrive_by

  def default_arrive_by
    Time.zone.now + DEFAULT_ARRIVAL_OFFSET
  end
end
