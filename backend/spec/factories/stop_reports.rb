FactoryBot.define do
  factory :stop_report do
    association :stop
    recorded_at { Time.current }
    category { :seguranca_geral }
    severity { 2 }
    context { :on_demand }
    device_token { ApiHelpers::DEVICE_TOKEN }
  end
end
