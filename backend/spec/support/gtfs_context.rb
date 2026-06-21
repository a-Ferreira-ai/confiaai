module GtfsContext
  def import_gtfs_fixtures!
    Gtfs::Importer.call(path: Rails.root.join("spec/fixtures/gtfs").to_s)

    path = Rails.root.join("data/metro_stations.yml")
    stations = YAML.load_file(path).fetch("stations")
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
end

RSpec.configure do |config|
  config.include GtfsContext

  config.before(:each, :gtfs_context) do
    import_gtfs_fixtures!
  end
end
