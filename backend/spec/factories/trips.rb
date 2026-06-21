FactoryBot.define do
  factory :trip do
    association :line
    sequence(:gtfs_id) { |n| "TRIP#{n.to_s.rjust(3, '0')}" }
    headsign { "Taguatinga Centro" }
    direction { 0 }
  end
end
