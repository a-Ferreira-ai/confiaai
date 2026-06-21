require "rails_helper"

RSpec.describe "Api::V1::Ping", type: :request do
  describe "GET /api/v1/ping" do
    it "returns 401 without device token" do
      get "/api/v1/ping"

      expect(response).to have_http_status(:unauthorized)
    end

    it "returns 200 with valid device token" do
      get "/api/v1/ping", headers: auth_headers

      expect(response).to have_http_status(:ok)
      expect(json_body["status"]).to eq("ok")
    end
  end
end
