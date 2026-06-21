module Api
  module V1
    class DemandaController < BaseController
      MIN_WINDOW_DAYS = 1
      MAX_WINDOW_DAYS = 30
      DEFAULT_WINDOW_DAYS = 7

      def index
        @result = DemandHeatmap.call(time_window: window_days.days)
      end

      private

      def window_days
        days = params[:days].presence&.to_i || DEFAULT_WINDOW_DAYS
        days.clamp(MIN_WINDOW_DAYS, MAX_WINDOW_DAYS)
      end
    end
  end
end
