module Api
  module V1
    class ParadasController < BaseController
      def index
        @stops = Stop.order(:name)
        @stops = @stops.where(mode: params[:mode]) if params[:mode].present?
        @reliability_by_stop_id = @stops.index_with { |stop| ReliabilityScore.call(stop: stop) }
      end

      def show
        @stop = Stop.find(params[:id])
        @reliability = ReliabilityScore.call(stop: @stop)
        @safety = SafetyScore.call(stop: @stop)
        @lines = lines_for_stop(@stop)
        @reliability_by_line_id = @lines.index_with { |line| ReliabilityScore.call(line: line, stop: @stop) }
        @trips = trips_for_stop(@stop)
        @scheduled_at_by_trip_id = scheduled_at_by_trip(@stop, @trips)
      end

      private

      def trips_for_stop(stop)
        Trip.joins(:stop_times, :line)
          .where(stop_times: { stop_id: stop.id })
          .distinct
          .includes(:line)
          .order("lines.name", :headsign)
      end

      def scheduled_at_by_trip(stop, trips)
        now = Time.current
        trips.index_with do |trip|
          stop_times = StopTime.where(trip: trip, stop: stop).order(:scheduled_at)
          stop_times.find { |st| st.scheduled_at >= now }&.scheduled_at || stop_times.last&.scheduled_at
        end
      end

      def lines_for_stop(stop)
        Line.joins(trips: { stop_times: :stop })
          .where(stops: { id: stop.id })
          .distinct
          .order(:name)
      end
    end
  end
end
