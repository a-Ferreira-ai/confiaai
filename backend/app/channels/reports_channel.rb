class ReportsChannel < ApplicationCable::Channel
  STREAM_NAME = "reports"

  def subscribed
    stream_from STREAM_NAME
  end

  def self.broadcast(payload)
    ActionCable.server.broadcast(STREAM_NAME, payload)
  end
end
