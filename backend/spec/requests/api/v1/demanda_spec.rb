require "rails_helper"

RSpec.describe "Api::V1::Demanda", type: :request do
  describe "GET /api/v1/demanda" do
    it "returns 401 without device token" do
      get "/api/v1/demanda"

      expect(response).to have_http_status(:unauthorized)
    end

    it "returns heatmap points" do
      origin = create(:stop)
      destination = create(:stop, :taguatinga)
      create(:demand_search, origin_stop: origin, destination_stop: destination, searched_at: 1.day.ago)

      get "/api/v1/demanda", headers: auth_headers

      expect(response).to have_http_status(:ok)
      expect(json_body["points"]).not_to be_empty
      expect(json_body["total_searches"]).to eq(1)
    end
  end
end
