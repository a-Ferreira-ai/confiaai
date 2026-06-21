require "rails_helper"

RSpec.describe "Api::V1::Rotas", type: :request do
  describe "GET /api/v1/rotas", :gtfs_context do
    it "returns 401 without device token" do
      get "/api/v1/rotas", params: { origin_stop_id: 1, destination_stop_id: 2, route_index: 0 }

      expect(response).to have_http_status(:unauthorized)
    end

    it "returns route detail for a valid index" do
      origin = Stop.find_by!(gtfs_id: "STOP001")
      destination = Stop.find_by!(gtfs_id: "STOP002")

      get "/api/v1/rotas",
        params: {
          origin_stop_id: origin.id,
          destination_stop_id: destination.id,
          route_index: 0
        },
        headers: auth_headers

      expect(response).to have_http_status(:ok)
      expect(json_body["legs"]).to be_present
      expect(json_body["leave_at"]).to be_present
    end

    it "returns 404 for an invalid route index" do
      origin = Stop.find_by!(gtfs_id: "STOP001")
      destination = Stop.find_by!(gtfs_id: "STOP002")

      get "/api/v1/rotas",
        params: {
          origin_stop_id: origin.id,
          destination_stop_id: destination.id,
          route_index: 99
        },
        headers: auth_headers

      expect(response).to have_http_status(:not_found)
    end
  end
end
