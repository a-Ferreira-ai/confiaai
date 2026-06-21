FactoryBot.define do
  factory :demand_search do
    association :origin_stop, factory: :stop
    association :destination_stop, factory: %i[stop taguatinga]
    searched_at { Time.current }
    mode_filter { nil }
  end
end
