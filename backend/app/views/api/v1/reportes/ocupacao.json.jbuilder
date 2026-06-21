json.id @reading.id
json.trip_id @reading.trip_id
json.stop_id @reading.stop_id
json.recorded_at @reading.recorded_at
json.source @reading.source
json.source_label I18n.t("enums.occupancy_reading.source.#{@reading.source}")
json.context @reading.context
json.context_label I18n.t("enums.occupancy_reading.context.#{@reading.context}")
json.level @reading.level
json.level_label @reading.level.present? ? I18n.t("enums.occupancy_reading.level.#{@reading.level}") : nil
json.free_seats @reading.free_seats
json.boarding_count @reading.boarding_count
