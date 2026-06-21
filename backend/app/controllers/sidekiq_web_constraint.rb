class SidekiqWebConstraint
  def self.matches?(request)
    username = ENV.fetch("SIDEKIQ_USERNAME", "admin")
    password = ENV.fetch("SIDEKIQ_PASSWORD", "confia")

    provided = Rack::Auth::Basic::Request.new(request.env)
    return false unless provided.provided? && provided.basic?

    given_user, given_pass = provided.credentials
    ActiveSupport::SecurityUtils.secure_compare(given_user, username) &&
      ActiveSupport::SecurityUtils.secure_compare(given_pass, password)
  end
end
