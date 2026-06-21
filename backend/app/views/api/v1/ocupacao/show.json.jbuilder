json.stop_id params[:stop_id].to_i
json.trip_id params[:trip_id].present? ? params[:trip_id].to_i : nil
json.occupancy do
  json.partial! "api/v1/shared/occupancy", occupancy: @occupancy
end
