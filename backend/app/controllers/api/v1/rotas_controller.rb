module Api
  module V1
    class RotasController < BaseController
      def show
        origin_stop, destination_stop = load_stops
        return if performed?

        routes = RouteSearch.call(
          origin_stop: origin_stop,
          destination_stop: destination_stop,
          mode_filter: params[:mode_filter],
          arrive_by: parse_arrive_by
        )

        route_index = params[:route_index].to_i
        @route = routes[route_index]

        unless @route
          render_error(:not_found, I18n.t("api.errors.route_not_found"))
          return
        end

        @origin_stop = origin_stop
        @destination_stop = destination_stop
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
    end
  end
end
