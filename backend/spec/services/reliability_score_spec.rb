require "rails_helper"

RSpec.describe ReliabilityScore do
  include ActiveSupport::Testing::TimeHelpers

  let(:line) { create(:line) }
  let(:stop) { create(:stop) }
  let(:trip) { create(:trip, line: line) }
  let(:frozen_time) { Time.zone.local(2026, 6, 21, 12, 0, 0) }

  around do |example|
    travel_to(frozen_time) { example.run }
  end

  describe ".call" do
    it "returns no_data when there are no events" do
      result = described_class.call(line: line)

      expect(result[:label]).to eq(I18n.t("reliability.level.no_data"))
      expect(result[:sample_size]).to eq(0)
    end

    it "returns high when delays are within threshold" do
      3.times do
        create(
          :arrival_event,
          trip: trip,
          stop: stop,
          observed_at: 1.day.ago,
          scheduled_at: 1.day.ago,
          delay_seconds: 120
        )
      end

      result = described_class.call(line: line, stop: stop)

      expect(result[:level]).to eq("high")
      expect(result[:on_time_percent]).to eq(100.0)
    end

    it "returns low when delays exceed medium threshold" do
      3.times do
        create(
          :arrival_event,
          :late,
          trip: trip,
          stop: stop,
          observed_at: 2.days.ago,
          scheduled_at: 2.days.ago - 1200.seconds
        )
      end

      result = described_class.call(line: line, stop: stop)

      expect(result[:level]).to eq("low")
    end
  end
end
