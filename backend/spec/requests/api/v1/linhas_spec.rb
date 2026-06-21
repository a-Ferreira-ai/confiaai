require "rails_helper"

RSpec.describe "Api::V1::Linhas", type: :request do
  describe "GET /api/v1/linhas" do
    it "returns 401 without device token" do
      get "/api/v1/linhas"

      expect(response).to have_http_status(:unauthorized)
    end

    it "returns lines with reliability" do
      line = create(:line, name: "Linha 101")

      get "/api/v1/linhas", headers: auth_headers

      expect(response).to have_http_status(:ok)
      expect(json_body["lines"].size).to eq(1)
      expect(json_body["lines"].first["id"]).to eq(line.id)
      expect(json_body["lines"].first["reliability"]).to be_present
    end
  end

  describe "GET /api/v1/linhas/:id" do
    it "returns a single line" do
      line = create(:line, name: "Linha 101")

      get "/api/v1/linhas/#{line.id}", headers: auth_headers

      expect(response).to have_http_status(:ok)
      expect(json_body["id"]).to eq(line.id)
    end

    it "returns 404 for unknown line" do
      get "/api/v1/linhas/0", headers: auth_headers

      expect(response).to have_http_status(:not_found)
    end
  end
end
