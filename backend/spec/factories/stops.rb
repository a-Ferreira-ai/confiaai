FactoryBot.define do
  factory :stop do
    sequence(:gtfs_id) { |n| "STOP#{n.to_s.rjust(3, '0')}" }
    sequence(:name) { |n| "Parada #{n}" }
    latitude { -15.820300 }
    longitude { -48.110200 }
    mode { :bus }

    trait :bus do
      mode { :bus }
      latitude { -15.820300 }
      longitude { -48.110200 }
    end

    trait :metro do
      mode { :metro }
      latitude { -15.838600 }
      longitude { -48.108900 }
    end

    trait :taguatinga do
      name { "Parada Taguatinga Centro" }
      latitude { -15.836900 }
      longitude { -48.053200 }
    end
  end
end
