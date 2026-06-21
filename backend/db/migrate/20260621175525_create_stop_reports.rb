class CreateStopReports < ActiveRecord::Migration[8.1]
  def change
    create_table :stop_reports do |t|
      t.references :stop, null: false, foreign_key: true
      t.datetime :recorded_at, null: false
      t.integer :category, null: false, default: 0
      t.integer :severity, null: false, default: 1
      t.integer :context, null: false, default: 0
      t.string :device_token

      t.timestamps
    end

    add_index :stop_reports, %i[stop_id recorded_at]
  end
end
