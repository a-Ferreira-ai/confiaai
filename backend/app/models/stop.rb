class Stop < ApplicationRecord
  has_many :stop_times, dependent: :destroy
  has_many :arrival_events, dependent: :destroy
  has_many :occupancy_readings, dependent: :destroy
  has_many :stop_reports, dependent: :destroy
  has_many :origin_demand_searches, class_name: "DemandSearch", foreign_key: :origin_stop_id, dependent: :destroy, inverse_of: :origin_stop
  has_many :destination_demand_searches, class_name: "DemandSearch", foreign_key: :destination_stop_id, dependent: :destroy, inverse_of: :destination_stop

  enum :mode, { bus: 0, metro: 1 }

  validates :gtfs_id, presence: true, uniqueness: true
  validates :name, presence: true
  validates :latitude, presence: true
  validates :longitude, presence: true
  validates :mode, presence: true
end
