# JSON responses use Jbuilder templates under app/views/api/v1/<controller>/<action>.json.jbuilder.
# Shared partials live in app/views/api/v1/shared/ (e.g. _error.json.jbuilder).
module Api
  module V1
    class BaseController < ApplicationController
      UUID_REGEX = /\A[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\z/i

      before_action :require_device_token!, unless: :preflight_request?

      rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
      rescue_from ActiveRecord::RecordInvalid, with: :render_unprocessable_entity

      private

      attr_reader :current_device_token

      def require_device_token!
        token = request.headers["X-Device-Token"].to_s.strip

        if token.blank? || token !~ UUID_REGEX
          render_error(:unauthorized, I18n.t("api.errors.missing_device_token"))
          return
        end

        @current_device_token = token
      end

      def preflight_request?
        request.options?
      end

      def render_not_found(exception)
        message = exception.model ? I18n.t("api.errors.not_found", model: exception.model) : I18n.t("api.errors.record_not_found")
        render_error(:not_found, message)
      end

      def render_unprocessable_entity(exception)
        render partial: "api/v1/shared/error",
          formats: :json,
          locals: { message: I18n.t("api.errors.unprocessable_entity"), errors: exception.record.errors.full_messages },
          status: :unprocessable_entity
      end

      def render_error(status, message, errors: nil)
        render partial: "api/v1/shared/error",
          formats: :json,
          locals: { message: message, errors: errors },
          status: status
      end
    end
  end
end
