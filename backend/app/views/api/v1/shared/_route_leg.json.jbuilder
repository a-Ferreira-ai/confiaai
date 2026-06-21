json.leg_type leg[:leg_type]
json.mode leg[:mode]
json.mode_label I18n.t("enums.line.mode.#{leg[:mode]}", default: I18n.t("routing.transfer"))
json.line_id leg[:line_id]
json.line_name leg[:line_name]
json.trip_id leg[:trip_id]
json.from_stop do
  json.id leg[:from_stop].id
  json.name leg[:from_stop].name
  json.mode leg[:from_stop].mode
end
json.to_stop do
  json.id leg[:to_stop].id
  json.name leg[:to_stop].name
  json.mode leg[:to_stop].mode
end
json.duration_minutes leg[:duration_minutes]
json.buffer_seconds leg[:buffer_seconds]
json.depart_at leg[:depart_at]&.iso8601
json.arrive_at leg[:arrive_at]&.iso8601
if leg[:reliability]
  json.reliability do
    json.partial! "api/v1/shared/reliability", reliability: leg[:reliability]
  end
end
