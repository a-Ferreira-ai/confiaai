require "rails_helper"

RSpec.describe "Api::V1::Ranking", type: :request do
  describe "GET /api/v1/ranking" do
    it "returns 401 without device token" do
      get "/api/v1/ranking"

      expect(response).to have_http_status(:unauthorized)
    end

    it "returns ranked lines" do
      line = create(:line, name: "Linha 101")
      trip = create(:trip, line: line)
      stop = create(:stop)
      create(:arrival_event, :on_time, trip: trip, stop: stop, observed_at: 1.day.ago, scheduled_at: 1.day.ago)

      get "/api/v1/ranking", headers: auth_headers

      expect(response).to have_http_status(:ok)
      expect(json_body["lines"]).not_to be_empty
      expect(json_body["lines"].first["rank"]).to eq(1)
      expect(json_body["lines"].first["reliability"]).to be_present
    end
  end
end
