FactoryBot.define do
  factory :arrival_event do
    association :trip
    association :stop
    scheduled_at { 1.hour.ago }
    observed_at { scheduled_at + delay_seconds.seconds }
    delay_seconds { 0 }
    source { :user }
    context { :on_demand }
    device_token { ApiHelpers::DEVICE_TOKEN }

    trait :on_time do
      delay_seconds { 60 }
    end

    trait :late do
      delay_seconds { 1200 }
    end
  end
end
