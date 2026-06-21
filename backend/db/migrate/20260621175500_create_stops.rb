class CreateStops < ActiveRecord::Migration[8.1]
  def change
    create_table :stops do |t|
      t.string :gtfs_id, null: false
      t.string :name, null: false
      t.decimal :latitude, precision: 10, scale: 6, null: false
      t.decimal :longitude, precision: 10, scale: 6, null: false
      t.integer :mode, null: false, default: 0

      t.timestamps
    end

    add_index :stops, :gtfs_id, unique: true
    add_index :stops, %i[latitude longitude]
  end
end
