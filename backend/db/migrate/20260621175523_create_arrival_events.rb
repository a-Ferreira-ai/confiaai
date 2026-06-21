class CreateArrivalEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :arrival_events do |t|
      t.references :trip, null: false, foreign_key: true
      t.references :stop, null: false, foreign_key: true
      t.datetime :scheduled_at, null: false
      t.datetime :observed_at, null: false
      t.integer :delay_seconds, null: false, default: 0
      t.integer :source, null: false, default: 0
      t.integer :context, null: false, default: 0
      t.string :device_token

      t.timestamps
    end

    add_index :arrival_events, %i[trip_id stop_id observed_at]
    add_index :arrival_events, %i[stop_id scheduled_at]
  end
end
