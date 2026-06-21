json.window_days @result[:window_days]
json.total_searches @result[:total_searches]
json.points @result[:points] do |point|
  json.stop_id point[:stop_id]
  json.name point[:name]
  json.latitude point[:latitude].to_s("F")
  json.longitude point[:longitude].to_s("F")
  json.search_count point[:search_count]
  json.intensity point[:intensity]
end
