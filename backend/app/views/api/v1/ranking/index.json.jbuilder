json.lines @entries do |entry|
  line = entry[:line]
  reliability = entry[:reliability]

  json.rank entry[:rank]
  json.id line.id
  json.gtfs_id line.gtfs_id
  json.name line.name
  json.mode line.mode
  json.mode_label I18n.t("enums.line.mode.#{line.mode}")
  json.color line.color
  json.reliability do
    json.partial! "api/v1/shared/reliability", reliability: reliability
  end
end
