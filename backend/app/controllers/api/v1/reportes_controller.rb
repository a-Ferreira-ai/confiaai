module Api
  module V1
    class ReportesController < BaseController
      def parada
        stop = Stop.find(report_params[:stop_id])
        @report = stop.stop_reports.create!(
          category: report_params[:category],
          severity: report_params[:severity],
          context: report_params[:context],
          recorded_at: Time.current,
          device_token: current_device_token
        )
        @safety = SafetyScore.call(stop: stop)

        broadcast_report(@report)
        render :parada, status: :created
      end

      def chegada
        trip = Trip.find(chegada_params[:trip_id])
        stop = Stop.find(chegada_params[:stop_id])
        scheduled_at = parse_time!(chegada_params[:scheduled_at], :missing_scheduled_at)
        return if performed?

        observed_at = parse_time!(chegada_params[:observed_at], :missing_observed_at)
        return if performed?

        context = require_param!(chegada_params[:context], :missing_context)
        return if performed?

        @event = ArrivalEvent.create!(
          trip: trip,
          stop: stop,
          scheduled_at: scheduled_at,
          observed_at: observed_at,
          delay_seconds: (observed_at - scheduled_at).to_i,
          source: :user,
          context: context,
          device_token: current_device_token
        )

        broadcast_report(@event)
        render :chegada, status: :created
      end

      def ocupacao
        trip = Trip.find(ocupacao_params[:trip_id])
        stop = Stop.find(ocupacao_params[:stop_id])
        context = require_param!(ocupacao_params[:context], :missing_context)
        return if performed?

        attrs = {
          trip: trip,
          stop: stop,
          context: context,
          source: :user_report,
          recorded_at: Time.current,
          device_token: current_device_token
        }

        if ocupacao_params[:level].present?
          attrs[:level] = ocupacao_params[:level]
        elsif ocupacao_params[:free_seats].present?
          attrs[:free_seats] = ocupacao_params[:free_seats]
        elsif ocupacao_params[:boarding_count].present?
          attrs[:boarding_count] = ocupacao_params[:boarding_count]
        else
          render_error(:unprocessable_entity, I18n.t("api.errors.missing_occupancy_value"))
          return
        end

        @reading = OccupancyReading.create!(attrs)

        broadcast_report(@reading)
        render :ocupacao, status: :created
      end

      private

      def report_params
        params.permit(:stop_id, :category, :severity, :context)
      end

      def chegada_params
        params.permit(:trip_id, :stop_id, :scheduled_at, :observed_at, :context)
      end

      def ocupacao_params
        params.permit(:trip_id, :stop_id, :context, :level, :free_seats, :boarding_count)
      end

      def require_param!(value, error_key)
        if value.blank?
          render_error(:unprocessable_entity, I18n.t("api.errors.#{error_key}"))
          return
        end

        value
      end

      def parse_time!(value, error_key)
        if value.blank?
          render_error(:unprocessable_entity, I18n.t("api.errors.#{error_key}"))
          return
        end

        Time.zone.parse(value.to_s)
      rescue ArgumentError, TypeError
        render_error(:unprocessable_entity, I18n.t("api.errors.#{error_key}"))
        nil
      end

      def broadcast_report(record)
        payload = {
          event: "report_created",
          kind: record.class.name.underscore,
          stop_id: record.stop_id
        }
        payload[:trip_id] = record.trip_id if record.respond_to?(:trip_id)

        ReportsChannel.broadcast(payload)
      end
    end
  end
end
