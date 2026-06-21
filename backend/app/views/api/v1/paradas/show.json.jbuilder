json.id @stop.id
json.gtfs_id @stop.gtfs_id
json.name @stop.name
json.mode @stop.mode
json.mode_label I18n.t("enums.stop.mode.#{@stop.mode}")
json.latitude @stop.latitude
json.longitude @stop.longitude
json.reliability do
  json.partial! "api/v1/shared/reliability", reliability: @reliability
end
json.safety do
  json.partial! "api/v1/shared/safety", safety: @safety
end
json.lines @lines do |line|
  json.id line.id
  json.gtfs_id line.gtfs_id
  json.name line.name
  json.mode line.mode
  json.mode_label I18n.t("enums.line.mode.#{line.mode}")
  json.color line.color
  json.reliability do
    json.partial! "api/v1/shared/reliability", reliability: @reliability_by_line_id[line]
  end
end
json.trips @trips do |trip|
  json.id trip.id
  json.headsign trip.headsign
  json.line_id trip.line_id
  json.line_name trip.line.name
  json.scheduled_at @scheduled_at_by_trip_id[trip]
end
