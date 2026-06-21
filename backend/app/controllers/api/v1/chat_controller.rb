module Api
  module V1
    class ChatController < Api::V1::BaseController
      def create
        unless RateLimiter.call(key: "rate_limit:chat:#{current_device_token}", limit: 10, window_seconds: 60)
          render json: { error: "Limite de mensagens atingido. Tente novamente em instantes." }, status: :too_many_requests
          return
        end

        system_prompt = ChatContextBuilder.call
        messages = [
          { role: "system", content: system_prompt },
          *permitted_messages
        ]

        reply = GrokClient.call(messages: messages)

        render json: { reply: reply }
      rescue GrokClient::Error
        render json: { error: "Não consegui falar com o assistente agora. Tente novamente." }, status: :bad_gateway
      end

      private

      def permitted_messages
        params.require(:messages).map do |msg|
          msg.permit(:role, :content).to_h
        end
      end
    end
  end
end
