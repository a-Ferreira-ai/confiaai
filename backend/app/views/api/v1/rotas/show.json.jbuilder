json.origin_stop_id @origin_stop.id
json.destination_stop_id @destination_stop.id
json.route_index @route[:route_index]
json.route_type @route[:route_type]
json.leave_at @route[:leave_at].iso8601
json.arrive_at @route[:arrive_at].iso8601
json.total_minutes @route[:total_minutes]
json.buffer_seconds @route[:buffer_seconds]
json.reliability do
  json.partial! "api/v1/shared/reliability", reliability: @route[:reliability]
end
json.legs @route[:legs] do |leg|
  leg_with_reliability = leg.dup
  if leg[:mode] == "bus" && leg[:line_id]
    line = Line.find_by(id: leg[:line_id])
    if line
      leg_with_reliability[:reliability] = ReliabilityScore.call(line: line, stop: leg[:from_stop])
    end
  end
  json.partial! "api/v1/shared/route_leg", leg: leg_with_reliability
end
