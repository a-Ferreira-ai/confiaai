module Api
  module V1
    class BuscaController < BaseController
      def index
        origin_stop, destination_stop = load_stops
        return if performed?

        @origin_stop = origin_stop
        @destination_stop = destination_stop
        record_demand_search(origin_stop, destination_stop)
        @routes = RouteSearch.call(
          origin_stop: origin_stop,
          destination_stop: destination_stop,
          mode_filter: params[:mode_filter],
          arrive_by: parse_arrive_by
        )
      end

      private

      def load_stops
        origin_id = params[:origin_stop_id]
        destination_id = params[:destination_stop_id]

        if origin_id.blank?
          render_error(:unprocessable_entity, I18n.t("api.errors.missing_origin"))
          return
        end

        if destination_id.blank?
          render_error(:unprocessable_entity, I18n.t("api.errors.missing_destination"))
          return
        end

        if origin_id.to_s == destination_id.to_s
          render_error(:unprocessable_entity, I18n.t("api.errors.same_stop"))
          return
        end

        [Stop.find(origin_id), Stop.find(destination_id)]
      end

      def parse_arrive_by
        return nil if params[:arrive_by].blank?

        Time.zone.parse(params[:arrive_by])
      rescue ArgumentError
        nil
      end

      def record_demand_search(origin_stop, destination_stop)
        DemandSearch.create!(
          origin_stop: origin_stop,
          destination_stop: destination_stop,
          mode_filter: valid_mode_filter,
          searched_at: Time.current
        )
      rescue ActiveRecord::RecordInvalid => e
        Rails.logger.warn("[BuscaController] demand search not recorded: #{e.message}")
      end

      def valid_mode_filter
        filter = params[:mode_filter].presence
        return nil if filter.blank?
        return filter if DemandSearch.mode_filters.key?(filter)

        nil
      end
    end
  end
end
