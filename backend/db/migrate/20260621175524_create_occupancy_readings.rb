class CreateOccupancyReadings < ActiveRecord::Migration[8.1]
  def change
    create_table :occupancy_readings do |t|
      t.references :trip, null: false, foreign_key: true
      t.references :stop, null: false, foreign_key: true
      t.datetime :recorded_at, null: false
      t.integer :source, null: false, default: 0
      t.integer :free_seats
      t.integer :boarding_count
      t.integer :level
      t.integer :context, null: false, default: 0
      t.string :device_token

      t.timestamps
    end

    add_index :occupancy_readings, %i[trip_id stop_id recorded_at]
  end
end
