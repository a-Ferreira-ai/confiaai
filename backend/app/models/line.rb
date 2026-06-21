class Line < ApplicationRecord
  has_many :trips, dependent: :destroy

  enum :mode, { bus: 0, metro: 1 }

  validates :gtfs_id, presence: true, uniqueness: true
  validates :name, presence: true
  validates :mode, presence: true
end
