class Trip < ApplicationRecord
  belongs_to :line

  has_many :stop_times, dependent: :destroy
  has_many :arrival_events, dependent: :destroy
  has_many :occupancy_readings, dependent: :destroy

  validates :gtfs_id, presence: true, uniqueness: true
  validates :headsign, presence: true
  validates :direction, presence: true
end
