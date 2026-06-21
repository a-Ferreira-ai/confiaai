require "rails_helper"

RSpec.describe "Api::V1::Reportes", type: :request do
  describe "POST /api/v1/reportes/parada" do
    it "returns 401 without device token" do
      post "/api/v1/reportes/parada", params: { stop_id: 1, category: "seguranca_geral", severity: 2, context: "on_demand" }

      expect(response).to have_http_status(:unauthorized)
    end

    it "creates a stop report" do
      stop = create(:stop)

      expect do
        post "/api/v1/reportes/parada",
          params: {
            stop_id: stop.id,
            category: "seguranca_geral",
            severity: 2,
            context: "on_demand"
          },
          headers: auth_headers,
          as: :json
      end.to change(StopReport, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json_body["category"]).to eq("seguranca_geral")
      expect(json_body["safety"]).to be_present
    end
  end

  describe "POST /api/v1/reportes/chegada" do
    it "creates an arrival event" do
      trip = create(:trip)
      stop = create(:stop)
      scheduled_at = 1.hour.ago.iso8601
      observed_at = Time.current.iso8601

      expect do
        post "/api/v1/reportes/chegada",
          params: {
            trip_id: trip.id,
            stop_id: stop.id,
            scheduled_at: scheduled_at,
            observed_at: observed_at,
            context: "on_demand"
          },
          headers: auth_headers,
          as: :json
      end.to change(ArrivalEvent, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json_body["delay_seconds"]).to be_a(Integer)
    end

    it "returns 422 when required params are missing" do
      trip = create(:trip)
      stop = create(:stop)

      post "/api/v1/reportes/chegada",
        params: { trip_id: trip.id, stop_id: stop.id },
        headers: auth_headers,
        as: :json

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "POST /api/v1/reportes/ocupacao" do
    it "creates an occupancy reading" do
      trip = create(:trip)
      stop = create(:stop)

      expect do
        post "/api/v1/reportes/ocupacao",
          params: {
            trip_id: trip.id,
            stop_id: stop.id,
            context: "on_demand",
            level: "moderate"
          },
          headers: auth_headers,
          as: :json
      end.to change(OccupancyReading, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json_body["level"]).to eq("moderate")
    end

    it "returns 422 when occupancy value is missing" do
      trip = create(:trip)
      stop = create(:stop)

      post "/api/v1/reportes/ocupacao",
        params: {
          trip_id: trip.id,
          stop_id: stop.id,
          context: "on_demand"
        },
        headers: auth_headers,
        as: :json

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
end
