module Geo
  class DistanceCalculator
    EARTH_RADIUS_KM = 6371.0

    def self.distance_km(lat1, lon1, lat2, lon2)
      new.distance_km(lat1, lon1, lat2, lon2)
    end

    def self.bounding_box(lat, lon, radius_km)
      new.bounding_box(lat, lon, radius_km)
    end

    def self.nearest_stop(lat, lon, radius_km:, scope: Stop.all)
      new.nearest_stop(lat, lon, radius_km: radius_km, scope: scope)
    end

    def distance_km(lat1, lon1, lat2, lon2)
      lat1_rad = to_radians(lat1)
      lat2_rad = to_radians(lat2)
      delta_lat = to_radians(lat2 - lat1)
      delta_lon = to_radians(lon2 - lon1)

      a = Math.sin(delta_lat / 2)**2 +
          Math.cos(lat1_rad) * Math.cos(lat2_rad) * Math.sin(delta_lon / 2)**2
      c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

      EARTH_RADIUS_KM * c
    end

    def bounding_box(lat, lon, radius_km)
      lat_delta = radius_km / EARTH_RADIUS_KM * (180.0 / Math::PI)
      lon_delta = lat_delta / Math.cos(to_radians(lat)).abs.clamp(0.0001, 1.0)

      {
        min_lat: lat - lat_delta,
        max_lat: lat + lat_delta,
        min_lon: lon - lon_delta,
        max_lon: lon + lon_delta
      }
    end

    def nearest_stop(lat, lon, radius_km:, scope: Stop.all)
      box = bounding_box(lat, lon, radius_km)

      candidates = scope.where(
        latitude: box[:min_lat]..box[:max_lat],
        longitude: box[:min_lon]..box[:max_lon]
      )

      candidates.min_by { |stop| distance_km(lat, lon, stop.latitude.to_f, stop.longitude.to_f) }
    end

    private

    def to_radians(degrees)
      degrees * Math::PI / 180.0
    end
  end
end
