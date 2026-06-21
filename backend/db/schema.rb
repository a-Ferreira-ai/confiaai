# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_06_21_175526) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "arrival_events", force: :cascade do |t|
    t.integer "context", default: 0, null: false
    t.datetime "created_at", null: false
    t.integer "delay_seconds", default: 0, null: false
    t.string "device_token"
    t.datetime "observed_at", null: false
    t.datetime "scheduled_at", null: false
    t.integer "source", default: 0, null: false
    t.bigint "stop_id", null: false
    t.bigint "trip_id", null: false
    t.datetime "updated_at", null: false
    t.index ["stop_id", "scheduled_at"], name: "index_arrival_events_on_stop_id_and_scheduled_at"
    t.index ["stop_id"], name: "index_arrival_events_on_stop_id"
    t.index ["trip_id", "stop_id", "observed_at"], name: "index_arrival_events_on_trip_id_and_stop_id_and_observed_at"
    t.index ["trip_id"], name: "index_arrival_events_on_trip_id"
  end

  create_table "demand_searches", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "destination_stop_id", null: false
    t.integer "mode_filter"
    t.bigint "origin_stop_id", null: false
    t.datetime "searched_at", null: false
    t.datetime "updated_at", null: false
    t.index ["destination_stop_id"], name: "index_demand_searches_on_destination_stop_id"
    t.index ["origin_stop_id"], name: "index_demand_searches_on_origin_stop_id"
  end

  create_table "lines", force: :cascade do |t|
    t.string "color"
    t.datetime "created_at", null: false
    t.string "gtfs_id", null: false
    t.integer "mode", default: 0, null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["gtfs_id"], name: "index_lines_on_gtfs_id", unique: true
  end

  create_table "occupancy_readings", force: :cascade do |t|
    t.integer "boarding_count"
    t.integer "context", default: 0, null: false
    t.datetime "created_at", null: false
    t.string "device_token"
    t.integer "free_seats"
    t.integer "level"
    t.datetime "recorded_at", null: false
    t.integer "source", default: 0, null: false
    t.bigint "stop_id", null: false
    t.bigint "trip_id", null: false
    t.datetime "updated_at", null: false
    t.index ["stop_id"], name: "index_occupancy_readings_on_stop_id"
    t.index ["trip_id", "stop_id", "recorded_at"], name: "idx_on_trip_id_stop_id_recorded_at_f0dfcb6b6b"
    t.index ["trip_id"], name: "index_occupancy_readings_on_trip_id"
  end

  create_table "stop_reports", force: :cascade do |t|
    t.integer "category", default: 0, null: false
    t.integer "context", default: 0, null: false
    t.datetime "created_at", null: false
    t.string "device_token"
    t.datetime "recorded_at", null: false
    t.integer "severity", default: 1, null: false
    t.bigint "stop_id", null: false
    t.datetime "updated_at", null: false
    t.index ["stop_id", "recorded_at"], name: "index_stop_reports_on_stop_id_and_recorded_at"
    t.index ["stop_id"], name: "index_stop_reports_on_stop_id"
  end

  create_table "stop_times", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "scheduled_at", null: false
    t.bigint "stop_id", null: false
    t.integer "stop_sequence", null: false
    t.bigint "trip_id", null: false
    t.datetime "updated_at", null: false
    t.index ["stop_id"], name: "index_stop_times_on_stop_id"
    t.index ["trip_id", "stop_sequence"], name: "index_stop_times_on_trip_id_and_stop_sequence", unique: true
    t.index ["trip_id"], name: "index_stop_times_on_trip_id"
  end

  create_table "stops", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "gtfs_id", null: false
    t.decimal "latitude", precision: 10, scale: 6, null: false
    t.decimal "longitude", precision: 10, scale: 6, null: false
    t.integer "mode", default: 0, null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["gtfs_id"], name: "index_stops_on_gtfs_id", unique: true
    t.index ["latitude", "longitude"], name: "index_stops_on_latitude_and_longitude"
  end

  create_table "trips", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "direction", default: 0, null: false
    t.string "gtfs_id", null: false
    t.string "headsign", null: false
    t.bigint "line_id", null: false
    t.datetime "updated_at", null: false
    t.index ["gtfs_id"], name: "index_trips_on_gtfs_id", unique: true
    t.index ["line_id"], name: "index_trips_on_line_id"
  end

  add_foreign_key "arrival_events", "stops"
  add_foreign_key "arrival_events", "trips"
  add_foreign_key "demand_searches", "stops", column: "destination_stop_id"
  add_foreign_key "demand_searches", "stops", column: "origin_stop_id"
  add_foreign_key "occupancy_readings", "stops"
  add_foreign_key "occupancy_readings", "trips"
  add_foreign_key "stop_reports", "stops"
  add_foreign_key "stop_times", "stops"
  add_foreign_key "stop_times", "trips"
  add_foreign_key "trips", "lines"
end
