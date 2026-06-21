require "rails_helper"

RSpec.describe OccupancyScore do
  include ActiveSupport::Testing::TimeHelpers

  let(:stop) { create(:stop) }
  let(:trip) { create(:trip) }
  let(:frozen_time) { Time.zone.local(2026, 6, 21, 12, 0, 0) }

  around do |example|
    travel_to(frozen_time) { example.run }
  end

  describe ".call" do
    it "returns no_data when there are no readings" do
      result = described_class.call(stop: stop)

      expect(result[:label]).to eq(I18n.t("occupancy.levels.no_data"))
      expect(result[:sample_size]).to eq(0)
    end

    it "prefers hardware readings over user reports" do
      create(:occupancy_reading, :user_report, stop: stop, trip: trip, recorded_at: 5.minutes.ago, level: :packed)
      create(:occupancy_reading, :seat_sensor, stop: stop, trip: trip, recorded_at: 10.minutes.ago)

      result = described_class.call(stop: stop)

      expect(result[:source]).to eq("seat_sensor")
      expect(result[:level]).to eq("free")
    end

    it "uses user report when no hardware reading exists" do
      create(:occupancy_reading, :user_report, stop: stop, trip: trip, recorded_at: 5.minutes.ago)

      result = described_class.call(stop: stop)

      expect(result[:source]).to eq("user_report")
      expect(result[:level]).to eq("crowded")
    end
  end
end
