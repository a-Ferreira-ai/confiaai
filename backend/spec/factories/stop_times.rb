FactoryBot.define do
  factory :stop_time do
    association :trip
    association :stop
    scheduled_at { Time.zone.local(2026, 6, 21, 7, 30, 0) }
    sequence(:stop_sequence) { |n| n }
  end
end
