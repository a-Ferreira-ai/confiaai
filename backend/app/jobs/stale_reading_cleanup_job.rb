class StaleReadingCleanupJob < ApplicationJob
  queue_as :default

  RETENTION_DAYS = 7

  def perform
    cutoff = RETENTION_DAYS.days.ago

    OccupancyReading.where(recorded_at: ...cutoff).delete_all
    ArrivalEvent.where(observed_at: ...cutoff).delete_all
  end
end
