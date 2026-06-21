class CreateLines < ActiveRecord::Migration[8.1]
  def change
    create_table :lines do |t|
      t.string :gtfs_id, null: false
      t.string :name, null: false
      t.integer :mode, null: false, default: 0
      t.string :color

      t.timestamps
    end

    add_index :lines, :gtfs_id, unique: true
  end
end
