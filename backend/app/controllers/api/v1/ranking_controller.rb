module Api
  module V1
    class RankingController < BaseController
      def index
        @entries = LineRanking.call
      end
    end
  end
end
