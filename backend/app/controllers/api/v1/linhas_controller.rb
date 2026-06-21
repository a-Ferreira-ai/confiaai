module Api
  module V1
    class LinhasController < BaseController
      def index
        @lines = Line.order(:name)
        @reliability_by_line_id = @lines.index_with { |line| ReliabilityScore.call(line: line) }
      end

      def show
        @line = Line.find(params[:id])
        @reliability = ReliabilityScore.call(line: @line)
        @stops = stops_for_line(@line)
        @reliability_by_stop_id = @stops.index_with { |stop| ReliabilityScore.call(line: @line, stop: stop) }
      end

      private

      def stops_for_line(line)
        Stop.joins(stop_times: { trip: :line })
          .where(lines: { id: line.id })
          .distinct
          .order(:name)
      end
    end
  end
end
