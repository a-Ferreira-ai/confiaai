class CreateDemandSearches < ActiveRecord::Migration[8.1]
  def change
    create_table :demand_searches do |t|
      t.references :origin_stop, null: false, foreign_key: { to_table: :stops }
      t.references :destination_stop, null: false, foreign_key: { to_table: :stops }
      t.integer :mode_filter
      t.datetime :searched_at, null: false

      t.timestamps
    end
  end
end
