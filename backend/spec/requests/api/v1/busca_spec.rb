require "rails_helper"

RSpec.describe "Api::V1::Busca", type: :request do
  describe "GET /api/v1/busca", :gtfs_context do
    it "returns 401 without device token" do
      get "/api/v1/busca", params: { origin_stop_id: 1, destination_stop_id: 2 }

      expect(response).to have_http_status(:unauthorized)
    end

    it "returns 422 when origin is missing" do
      destination = Stop.find_by!(gtfs_id: "STOP002")

      get "/api/v1/busca", params: { destination_stop_id: destination.id }, headers: auth_headers

      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "returns route options between demo stops" do
      origin = Stop.find_by!(gtfs_id: "STOP001")
      destination = Stop.find_by!(gtfs_id: "STOP002")

      get "/api/v1/busca",
        params: { origin_stop_id: origin.id, destination_stop_id: destination.id },
        headers: auth_headers

      expect(response).to have_http_status(:ok)
      expect(json_body["routes"]).not_to be_empty
      expect(json_body["routes"].first["leave_at"]).to be_present
    end
  end
end
