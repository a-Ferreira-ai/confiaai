require "net/http"
require "json"
require "uri"

class GrokClient
  ENDPOINT = "https://api.x.ai/v1/chat/completions"
  TIMEOUT_SECONDS = 15

  class Error < StandardError; end

  def self.call(...) = new(...).call

  def initialize(messages:)
    @messages = messages
  end

  def call
    raise Error, "GROK_API_KEY não configurada" if GROK_API_KEY.blank?

    uri = URI.parse(ENDPOINT)

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.read_timeout = TIMEOUT_SECONDS
    http.open_timeout = TIMEOUT_SECONDS

    request = Net::HTTP::Post.new(uri.path)
    request["Content-Type"] = "application/json"
    request["Authorization"] = "Bearer #{GROK_API_KEY}"
    request.body = {
      model: GROK_MODEL,
      messages: @messages,
      temperature: 0.7,
      max_tokens: 500
    }.to_json

    response = http.request(request)

    unless response.is_a?(Net::HTTPSuccess)
      raise Error, "xAI API respondeu com status #{response.code}: #{response.body}"
    end

    parsed = JSON.parse(response.body)
    content = parsed.dig("choices", 0, "message", "content")

    raise Error, "Resposta malformada da xAI: choices[0].message.content ausente" if content.blank?

    content
  rescue Net::ReadTimeout, Net::OpenTimeout
    raise Error, "Timeout ao conectar com a xAI (limite: #{TIMEOUT_SECONDS}s)"
  end
end
