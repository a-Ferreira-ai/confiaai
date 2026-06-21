require "rails_helper"

RSpec.describe "Api::V1::Ocupacao", type: :request do
  describe "GET /api/v1/ocupacao" do
    it "returns 401 without device token" do
      get "/api/v1/ocupacao", params: { stop_id: 1 }

      expect(response).to have_http_status(:unauthorized)
    end

    it "returns 422 when stop_id is missing" do
      get "/api/v1/ocupacao", headers: auth_headers

      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "returns occupancy for a stop" do
      stop = create(:stop)
      create(:occupancy_reading, stop: stop, recorded_at: Time.current)

      get "/api/v1/ocupacao", params: { stop_id: stop.id }, headers: auth_headers

      expect(response).to have_http_status(:ok)
      expect(json_body["occupancy"]).to be_present
      expect(json_body["occupancy"]["level"]).to be_present
    end
  end
end
