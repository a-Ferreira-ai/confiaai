class ScoreRecalculationJob < ApplicationJob
  queue_as :default

  def perform
    Rails.logger.info("[ScoreRecalculationJob] Score recalculation stub — services not yet implemented")
  end
end
