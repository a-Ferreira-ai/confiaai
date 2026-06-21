module ApiHelpers
  DEVICE_TOKEN = "00000000-0000-4000-8000-000000000001"

  def auth_headers(token: DEVICE_TOKEN)
    {
      "X-Device-Token" => token,
      "Accept" => "application/json"
    }
  end

  def json_headers(token: DEVICE_TOKEN)
    auth_headers(token: token).merge("Content-Type" => "application/json")
  end

  def json_body
    JSON.parse(response.body)
  end
end

RSpec.configure do |config|
  config.include ApiHelpers, type: :request
end
