module Api
  module V1
    class OcupacaoController < BaseController
      def show
        stop = find_stop
        return unless stop

        trip = Trip.find(params[:trip_id]) if params[:trip_id].present?

        @occupancy = OccupancyScore.call(stop: stop, trip: trip)
      end

      private

      def find_stop
        stop_id = params[:stop_id].to_s.strip

        if stop_id.blank?
          render_error(:unprocessable_entity, I18n.t("api.errors.missing_stop_id"))
          return nil
        end

        Stop.find(stop_id)
      end
    end
  end
end
