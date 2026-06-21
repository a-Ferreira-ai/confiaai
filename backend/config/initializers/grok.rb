GROK_API_KEY = ENV.fetch("GROK_API_KEY", nil)
GROK_MODEL   = ENV.fetch("GROK_MODEL", "grok-4.3")

if GROK_API_KEY.blank?
  if Rails.env.production?
    raise "GROK_API_KEY não configurada. Configure a variável de ambiente antes de iniciar em produção."
  else
    Rails.logger.warn "[Grok] GROK_API_KEY não configurada — chamadas ao GrokClient vão falhar em runtime."
  end
end
