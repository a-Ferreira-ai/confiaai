require "rails_helper"

RSpec.describe SafetyScore do
  include ActiveSupport::Testing::TimeHelpers

  let(:stop) { create(:stop) }
  let(:frozen_time) { Time.zone.local(2026, 6, 21, 12, 0, 0) }

  around do |example|
    travel_to(frozen_time) { example.run }
  end

  describe ".call" do
    it "returns no_data when there are no reports" do
      result = described_class.call(stop: stop)

      expect(result[:label]).to eq(I18n.t("safety.level.no_data"))
      expect(result[:sample_size]).to eq(0)
    end

    it "returns high when average severity is low" do
      create(:stop_report, stop: stop, severity: 1, recorded_at: 1.day.ago)
      create(:stop_report, stop: stop, severity: 1, recorded_at: 2.days.ago)

      result = described_class.call(stop: stop)

      expect(result[:level]).to eq("high")
    end

    it "returns low when average severity is high" do
      create(:stop_report, stop: stop, severity: 3, recorded_at: 1.day.ago)
      create(:stop_report, stop: stop, severity: 3, recorded_at: 2.days.ago)

      result = described_class.call(stop: stop)

      expect(result[:level]).to eq("low")
    end
  end
end
