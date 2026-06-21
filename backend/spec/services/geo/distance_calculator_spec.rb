require "rails_helper"

RSpec.describe Geo::DistanceCalculator do
  describe ".distance_km" do
    it "returns ~6.8 km between Ceilândia and Taguatinga demo stops" do
      distance = described_class.distance_km(-15.820300, -48.110200, -15.836900, -48.053200)

      expect(distance).to be_within(0.5).of(6.37)
    end
  end

  describe ".bounding_box" do
    it "contains the center point" do
      lat = -15.820300
      lon = -48.110200
      box = described_class.bounding_box(lat, lon, 2.0)

      expect(box[:min_lat]).to be <= lat
      expect(box[:max_lat]).to be >= lat
      expect(box[:min_lon]).to be <= lon
      expect(box[:max_lon]).to be >= lon
    end
  end

  describe ".nearest_stop" do
    it "returns the closest stop within radius" do
      near = create(:stop, name: "Ceilândia Centro", latitude: -15.820300, longitude: -48.110200)
      create(:stop, :taguatinga)

      result = described_class.nearest_stop(-15.820400, -48.110300, radius_km: 5)

      expect(result).to eq(near)
    end
  end
end
