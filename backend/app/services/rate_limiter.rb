class RateLimiter
  def self.call(...) = new(...).call

  def initialize(key:, limit:, window_seconds:)
    @key            = key
    @limit          = limit
    @window_seconds = window_seconds
  end

  def call
    redis = Redis.new(url: ENV.fetch("REDIS_URL", "redis://localhost:6379/1"))

    count = redis.incr(@key)
    redis.expire(@key, @window_seconds) if count == 1

    count <= @limit
  end
end
