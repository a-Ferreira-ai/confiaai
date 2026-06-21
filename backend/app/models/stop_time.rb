class StopTime < ApplicationRecord
  belongs_to :trip
  belongs_to :stop

  validates :scheduled_at, presence: true
  validates :stop_sequence, presence: true, uniqueness: { scope: :trip_id }
end
