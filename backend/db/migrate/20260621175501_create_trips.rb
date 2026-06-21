class CreateTrips < ActiveRecord::Migration[8.1]
  def change
    create_table :trips do |t|
      t.references :line, null: false, foreign_key: true
      t.string :gtfs_id, null: false
      t.string :headsign, null: false
      t.integer :direction, null: false, default: 0

      t.timestamps
    end

    add_index :trips, :gtfs_id, unique: true
  end
end
