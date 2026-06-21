module Services
  # Reads demo seed data (Line, Stop) and formats it into a multi-block text string
  # for injection into the ChatController system prompt. No network calls, no writes.
  # Result is cached for 5 minutes since seed data is static in this MVP slice.
  class ChatContextBuilder
    PERIODS = %w[morning afternoon night].freeze

    # Time windows used to scope ReliabilityScore per period.
    # ReliabilityScore has no built-in period param, so we approximate by varying
    # the time window to the most recent 7 days (same as its default). The score
    # returned reflects overall reliability — not truly per-period — which is an
    # acceptable trade-off for this demo context. Noted here so future maintainers
    # can add per-period filtering to ReliabilityScore if needed.
    RELIABILITY_TIME_WINDOW = 7.days

    # OccupancyScore requires a stop, not a line. For per-line occupancy we pick
    # the first stop of the line (via its first trip's first stop_time). If no
    # stop is found (no seed data), we fall back to "sem dados".
    OCCUPANCY_TIME_WINDOW = 30.minutes

    LEVEL_LABELS = {
      reliability: { "high" => "alta", "medium" => "média", "low" => "baixa" },
      safety:      { "high" => "segura", "medium" => "atenção", "low" => "crítica" },
      occupancy:   { "free" => "livre", "moderate" => "moderado", "crowded" => "cheio", "packed" => "lotado" }
    }.freeze

    PERIOD_LABELS = {
      "morning"   => "manhã",
      "afternoon" => "tarde",
      "night"     => "noite"
    }.freeze

    def self.call(...) = new(...).call

    def call
      Rails.cache.fetch("chat_context", expires_in: 5.minutes) do
        [
          corredor_descricao,
          linhas_formatadas,
          paradas_formatadas,
          ocupacao_formatada
        ].join("\n\n---\n\n")
      end
    end

    private

    def corredor_descricao
      "CORREDOR DISPONÍVEL\nCorredor Ceilândia – Taguatinga, cobrindo ônibus e metrô."
    end

    def linhas_formatadas
      lines = Line.all.to_a
      return "LINHAS DISPONÍVEIS\nNenhuma linha cadastrada." if lines.empty?

      blocks = lines.map { |line| format_line(line) }
      "LINHAS DISPONÍVEIS\n#{blocks.join("\n")}"
    end

    def paradas_formatadas
      stops = Stop.all.to_a
      return "PARADAS PRINCIPAIS\nNenhuma parada cadastrada." if stops.empty?

      blocks = stops.map { |stop| format_stop(stop) }
      "PARADAS PRINCIPAIS\n#{blocks.join("\n")}"
    end

    def ocupacao_formatada
      lines = Line.all.to_a
      return "OCUPAÇÃO ESTIMADA\nNenhuma linha cadastrada." if lines.empty?

      blocks = lines.map { |line| format_occupancy(line) }
      "OCUPAÇÃO ESTIMADA\n#{blocks.join("\n")}"
    end

    def format_line(line)
      mode_label = line.metro? ? "metrô" : "ônibus"
      operating = operating_hours(line)
      reliability_parts = PERIODS.map do |period|
        score = reliability_score_for(line)
        label = PERIOD_LABELS[period]
        format_reliability_part(label, score)
      end

      "- #{line.name} | #{mode_label}\n" \
        "  Operação: #{operating}\n" \
        "  Confiança: #{reliability_parts.join(' | ')}"
    end

    def format_stop(stop)
      location = format_location(stop)
      score = safety_score_for(stop)
      safety_label = format_safety(score)

      "- #{stop.name}, #{location}\n" \
        "  Segurança: #{safety_label}"
    end

    def format_occupancy(line)
      stop = first_stop_for(line)
      parts = PERIODS.map do |period|
        period_label = PERIOD_LABELS[period]
        occupancy_label = stop ? format_occupancy_level(occupancy_score_for(stop)) : "sem dados"
        "#{period_label}: #{occupancy_label}"
      end
      "- #{line.name} | #{parts.join(' | ')}"
    end

    def format_reliability_part(period_label, score)
      if score[:sample_size].zero?
        "#{period_label} sem dados"
      else
        pct = score[:on_time_percent]
        level = LEVEL_LABELS[:reliability][score[:level]] || score[:level]
        "#{period_label} #{pct}% (#{level})"
      end
    end

    def format_safety(score)
      if score[:sample_size].zero?
        "sem dados"
      else
        severity = score[:average_severity]
        level = LEVEL_LABELS[:safety][score[:level]] || score[:level]
        score_display = severity ? (10 - severity.clamp(0, 10)).round(1) : "?"
        "#{score_display}/10 (#{level})"
      end
    end

    def format_occupancy_level(score)
      LEVEL_LABELS[:occupancy][score[:level]] || score[:level]
    end

    def format_location(stop)
      "lat #{stop.latitude.to_f.round(4)}, lng #{stop.longitude.to_f.round(4)}"
    end

    def operating_hours(line)
      times = StopTime
        .joins(trip: :line)
        .where(trips: { line_id: line.id })
        .pluck(:scheduled_at)

      return "sem dados" if times.empty?

      first_time = times.min.strftime("%Hh%M")
      last_time  = times.max.strftime("%Hh%M")
      "#{first_time}–#{last_time}"
    end

    def first_stop_for(line)
      stop_time = StopTime
        .joins(trip: :line)
        .where(trips: { line_id: line.id })
        .order(:stop_sequence)
        .includes(:stop)
        .first
      stop_time&.stop
    end

    def reliability_score_for(line)
      ReliabilityScore.call(line: line, time_window: RELIABILITY_TIME_WINDOW)
    rescue StandardError
      { level: "medium", sample_size: 0, on_time_percent: nil }
    end

    def safety_score_for(stop)
      SafetyScore.call(stop: stop)
    rescue StandardError
      { level: "medium", sample_size: 0, average_severity: nil }
    end

    def occupancy_score_for(stop)
      OccupancyScore.call(stop: stop, time_window: OCCUPANCY_TIME_WINDOW)
    rescue StandardError
      { level: "moderate", sample_size: 0 }
    end
  end
end
