require "rails_helper"

RSpec.describe LeaveTime do
  include ActiveSupport::Testing::TimeHelpers

  let(:arrive_by) { Time.zone.local(2026, 6, 21, 9, 0, 0) }

  around do |example|
    travel_to(Time.zone.local(2026, 6, 21, 6, 0, 0)) { example.run }
  end

  describe ".call" do
    it "subtracts bus duration and default buffer from arrive_by" do
      route = {
        total_minutes: 30,
        legs: [
          {
            mode: "bus",
            duration_minutes: 30,
            line_id: nil,
            from_stop: nil
          }
        ]
      }

      result = described_class.call(route: route, arrive_by: arrive_by)

      expect(result[:leave_at]).to eq(arrive_by - 30.minutes - LeaveTime::DEFAULT_BUS_BUFFER_SECONDS.seconds)
      expect(result[:arrive_at]).to eq(arrive_by)
    end

    it "uses metro buffer for metro legs" do
      route = {
        total_minutes: 15,
        legs: [
          {
            mode: "metro",
            duration_minutes: 15
          }
        ]
      }

      result = described_class.call(route: route, arrive_by: arrive_by)

      expect(result[:leave_at]).to eq(arrive_by - 15.minutes - LeaveTime::METRO_BUFFER_SECONDS.seconds)
      expect(result[:legs].first[:buffer_seconds]).to eq(LeaveTime::METRO_BUFFER_SECONDS)
    end

    it "aggregates worst bus reliability across legs" do
      line = create(:line)
      stop = create(:stop)
      trip = create(:trip, line: line)
      create(:arrival_event, :late, trip: trip, stop: stop, observed_at: 1.day.ago, scheduled_at: 1.day.ago - 1200.seconds)

      route = {
        total_minutes: 20,
        legs: [
          {
            mode: "bus",
            duration_minutes: 20,
            line_id: line.id,
            from_stop: stop
          }
        ]
      }

      result = described_class.call(route: route, arrive_by: arrive_by)

      expect(result[:reliability][:level]).to eq("low")
    end
  end
end
