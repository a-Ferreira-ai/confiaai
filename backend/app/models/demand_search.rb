class DemandSearch < ApplicationRecord
  belongs_to :origin_stop, class_name: "Stop"
  belongs_to :destination_stop, class_name: "Stop"

  enum :mode_filter, { bus: 0, metro: 1 }, prefix: true

  validates :searched_at, presence: true
end
