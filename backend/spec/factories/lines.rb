FactoryBot.define do
  factory :line do
    sequence(:gtfs_id) { |n| "LINE#{n.to_s.rjust(3, '0')}" }
    sequence(:name) { |n| "Linha #{n}" }
    mode { :bus }
    color { "12849A" }

    trait :bus do
      mode { :bus }
    end

    trait :metro do
      mode { :metro }
    end
  end
end
