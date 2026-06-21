# frozen_string_literal: true

require_relative "../gtfs/importer"

namespace :gtfs do
  desc "Import GTFS static data from CSV files (default: backend/data/gtfs/, override with GTFS_PATH)"
  task import: :environment do
    path = ENV.fetch("GTFS_PATH", Rails.root.join("data/gtfs").to_s)
    summary = Gtfs::Importer.call(path: path)

    puts "GTFS import complete from #{path}:"
    puts "  Lines: #{summary[:lines]}"
    puts "  Stops: #{summary[:stops]}"
    puts "  Trips: #{summary[:trips]}"
    puts "  Stop times: #{summary[:stop_times]}"
  end
end
