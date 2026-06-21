FactoryBot.define do
  factory :occupancy_reading do
    association :trip
    association :stop
    recorded_at { Time.current }
    source { :user_report }
    context { :on_demand }
    level { :moderate }
    device_token { ApiHelpers::DEVICE_TOKEN }

    trait :seat_sensor do
      source { :seat_sensor }
      level { :free }
      free_seats { 15 }
    end

    trait :user_report do
      source { :user_report }
      level { :crowded }
    end
  end
end
