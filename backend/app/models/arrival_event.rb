class ArrivalEvent < ApplicationRecord
  belongs_to :trip
  belongs_to :stop

  enum :source, { gps: 0, user: 1 }
  enum :context, {
    gps: 0,
    geofence_arrival: 1,
    geofence_boarding: 2,
    on_demand: 3
  }, prefix: :via

  validates :scheduled_at, presence: true
  validates :observed_at, presence: true
  validates :delay_seconds, presence: true, numericality: { only_integer: true }
  validates :source, presence: true
  validates :context, presence: true
end
