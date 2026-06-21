class CreateStopTimes < ActiveRecord::Migration[8.1]
  def change
    create_table :stop_times do |t|
      t.references :trip, null: false, foreign_key: true
      t.references :stop, null: false, foreign_key: true
      t.datetime :scheduled_at, null: false
      t.integer :stop_sequence, null: false

      t.timestamps
    end

    add_index :stop_times, %i[trip_id stop_sequence], unique: true
  end
end
