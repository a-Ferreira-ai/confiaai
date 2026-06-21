json.stops @stops do |stop|
  json.id stop.id
  json.gtfs_id stop.gtfs_id
  json.name stop.name
  json.mode stop.mode
  json.mode_label I18n.t("enums.stop.mode.#{stop.mode}")
  json.latitude stop.latitude
  json.longitude stop.longitude
  json.reliability do
    json.partial! "api/v1/shared/reliability", reliability: @reliability_by_stop_id[stop]
  end
end
