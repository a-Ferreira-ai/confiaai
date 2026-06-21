require "sidekiq/web"

Rails.application.routes.draw do
  mount Sidekiq::Web => "/sidekiq", constraints: SidekiqWebConstraint

  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      get "ping", to: "ping#show"
      resources :linhas, only: %i[index show]
      resources :paradas, only: %i[index show]
      resource :ocupacao, only: :show, controller: "ocupacao"
      get "busca", to: "busca#index"
      resource :rotas, only: :show, controller: "rotas"
      get "demanda", to: "demanda#index"
      get "ranking", to: "ranking#index"
      post "reportes/parada", to: "reportes#parada"
      post "reportes/chegada", to: "reportes#chegada"
      post "reportes/ocupacao", to: "reportes#ocupacao"
    end
  end
end
