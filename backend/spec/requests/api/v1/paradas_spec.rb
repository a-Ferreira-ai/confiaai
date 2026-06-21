require "rails_helper"

RSpec.describe "Api::V1::Paradas", type: :request do
  describe "GET /api/v1/paradas" do
    it "returns 401 without device token" do
      get "/api/v1/paradas"

      expect(response).to have_http_status(:unauthorized)
    end

    it "returns stops list" do
      stop = create(:stop, name: "Ceilândia Centro")

      get "/api/v1/paradas", headers: auth_headers

      expect(response).to have_http_status(:ok)
      expect(json_body["stops"].size).to eq(1)
      expect(json_body["stops"].first["id"]).to eq(stop.id)
    end
  end

  describe "GET /api/v1/paradas/:id" do
    it "returns stop detail with reliability and safety" do
      stop = create(:stop, name: "Ceilândia Centro")

      get "/api/v1/paradas/#{stop.id}", headers: auth_headers

      expect(response).to have_http_status(:ok)
      expect(json_body["id"]).to eq(stop.id)
      expect(json_body["reliability"]).to be_present
      expect(json_body["safety"]).to be_present
    end
  end
end
