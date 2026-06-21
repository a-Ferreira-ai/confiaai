# frozen_string_literal: true

namespace :metro do
  desc "Import synthetic metro stations from backend/data/metro_stations.yml"
  task import_stations: :environment do
    path = Rails.root.join("data/metro_stations.yml")
    raise "Missing #{path}" unless path.exist?

    data = YAML.load_file(path)
    stations = data.fetch("stations")

    ActiveRecord::Base.transaction do
      stations.each do |attrs|
        stop = Stop.find_or_initialize_by(gtfs_id: attrs["gtfs_id"])
        stop.assign_attributes(
          name: attrs["name"],
          latitude: attrs["latitude"],
          longitude: attrs["longitude"],
          mode: :metro
        )
        stop.save!
      end
    end

    puts "Imported #{stations.size} metro stations (#{Stop.metro.count} total metro stops)."
  end
end
