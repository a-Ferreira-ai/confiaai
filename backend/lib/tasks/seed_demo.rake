# frozen_string_literal: true

require_relative "../demo/seeder"

namespace :demo do
  desc "Seed demo corridor with GTFS/metro base data and synthetic events"
  task seed: :environment do
    reset = ENV.fetch("DEMO_RESET", "1") != "0"
    summary = Demo::Seeder.call(reset: reset)

    puts "Demo seed complete (reset=#{reset}):"
    puts "  Lines: #{summary[:lines]}"
    puts "  Stops: #{summary[:stops]}"
    puts "  Trips: #{summary[:trips]}"
    puts "  Stop times: #{summary[:stop_times]}"
    puts "  Arrival events: #{summary[:arrival_events]}"
    puts "  Occupancy readings: #{summary[:occupancy_readings]}"
    puts "  Stop reports: #{summary[:stop_reports]}"
    puts "  Demand searches: #{summary[:demand_searches]}"
  end
end
