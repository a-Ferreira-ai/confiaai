class StopReport < ApplicationRecord
  belongs_to :stop

  enum :category, {
    iluminacao: 0,
    infraestrutura: 1,
    seguranca_geral: 2
  }
  enum :context, { geofence_arrival: 0, on_demand: 1 }, prefix: :via

  validates :recorded_at, presence: true
  validates :category, presence: true
  validates :severity, presence: true, inclusion: { in: 1..3 }
  validates :context, presence: true
end
