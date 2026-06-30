-- supabase/migrations/002_admin_seed.sql

INSERT INTO app_config (key, value, description) VALUES
  -- Costos de créditos por acción
  ('credit_cost_consultation',     '40',  'Créditos por consulta estándar'),
  ('credit_cost_ancestral_ritual', '65',  'Créditos por ritual ancestral'),
  ('credit_cost_premium_ritual',   '100', 'Créditos por ritual premium con ElevenLabs'),
  ('credit_cost_deepening',        '10',  'Créditos por profundización por carta'),
  ('credit_cost_reconsultation',   '40',  'Créditos por nueva consulta en la misma sesión'),
  ('credit_cost_synthesis_email',  '10',  'Créditos por email de síntesis'),
  -- Bonos de créditos
  ('signup_bonus',                 '100', 'Créditos de bienvenida al verificar email'),
  ('referral_bonus_referrer',      '50',  'Créditos para quien refirió'),
  ('referral_bonus_new_user',      '25',  'Créditos extra para el nuevo usuario referido'),
  -- Tarifas de APIs (para cálculo de costos en api_usage_log)
  ('gemini_cost_per_1m_input',     '0.075', 'USD por 1M tokens de input en Gemini 2.5 Flash'),
  ('gemini_cost_per_1m_output',    '0.30',  'USD por 1M tokens de output en Gemini 2.5 Flash'),
  ('elevenlabs_cost_per_char',     '0.00022', 'USD por caracter en ElevenLabs (plan Creator)'),
  -- Umbrales KPI (semáforos)
  ('kpi_conversion_green',         '5',   '% conversión freemium→pago: umbral verde'),
  ('kpi_conversion_yellow',        '3',   '% conversión: umbral amarillo'),
  ('kpi_cac_green',                '5',   'CAC USD: umbral verde (menor = mejor)'),
  ('kpi_cac_yellow',               '15',  'CAC USD: umbral amarillo'),
  ('kpi_roas_green',               '2',   'ROAS: umbral verde (mayor = mejor)'),
  ('kpi_roas_yellow',              '1',   'ROAS: umbral amarillo'),
  ('kpi_completion_green',         '60',  '% completitud flujo: umbral verde'),
  ('kpi_completion_yellow',        '40',  '% completitud: umbral amarillo'),
  ('kpi_retention_d7_green',       '15',  '% retención D7: umbral verde'),
  ('kpi_retention_d7_yellow',      '8',   '% retención D7: umbral amarillo'),
  ('kpi_api_cost_ratio_green',     '20',  '% ratio costo API/revenue: umbral verde (menor = mejor)'),
  ('kpi_api_cost_ratio_yellow',    '40',  '% ratio costo API/revenue: umbral amarillo')
ON CONFLICT (key) DO NOTHING;
