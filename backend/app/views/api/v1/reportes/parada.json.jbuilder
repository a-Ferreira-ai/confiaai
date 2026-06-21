json.id @report.id
json.stop_id @report.stop_id
json.category @report.category
json.category_label I18n.t("enums.stop_report.category.#{@report.category}")
json.severity @report.severity
json.context @report.context
json.context_label I18n.t("enums.stop_report.context.#{@report.context}")
json.recorded_at @report.recorded_at
json.safety do
  json.partial! "api/v1/shared/safety", safety: @safety
end
