class OccupancyReading < ApplicationRecord
  belongs_to :trip
  belongs_to :stop

  enum :source, { seat_sensor: 0, turnstile: 1, user_report: 2 }
  enum :level, { free: 0, moderate: 1, crowded: 2, packed: 3 }, prefix: true
  enum :context, {
    gps: 0,
    geofence_arrival: 1,
    geofence_boarding: 2,
    on_demand: 3
  }, prefix: :via

  validates :recorded_at, presence: true
  validates :source, presence: true
  validates :context, presence: true
end
