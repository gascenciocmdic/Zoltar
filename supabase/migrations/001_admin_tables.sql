-- supabase/migrations/001_admin_tables.sql

-- ── app_config: parámetros configurables de la app ─────────────────────
CREATE TABLE IF NOT EXISTS app_config (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT
);

-- ── monthly_costs: costos de infraestructura por mes ───────────────────
CREATE TABLE IF NOT EXISTS monthly_costs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mes        DATE NOT NULL,
  servicio   TEXT NOT NULL,
  costo_usd  NUMERIC(10,2) DEFAULT 0,
  nota       TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_monthly_costs_mes CHECK (EXTRACT(DAY FROM mes) = 1)
);

-- ── marketing_spend: gasto en marketing por canal y mes ────────────────
CREATE TABLE IF NOT EXISTS marketing_spend (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mes        DATE NOT NULL,
  canal      TEXT NOT NULL,
  campana    TEXT,
  gasto_usd  NUMERIC(10,2) DEFAULT 0,
  nota       TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_marketing_spend_mes CHECK (EXTRACT(DAY FROM mes) = 1)
);

-- ── api_usage_log: log automático de uso de Gemini y ElevenLabs ────────
CREATE TABLE IF NOT EXISTS api_usage_log (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at     TIMESTAMPTZ DEFAULT now(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  proveedor      TEXT NOT NULL CHECK (proveedor IN ('gemini', 'elevenlabs')),
  tokens_input   INTEGER,
  tokens_output  INTEGER,
  chars_sent     INTEGER,
  modelo         TEXT,
  costo_usd_est  NUMERIC(10,6)
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_api_usage_log_created_at          ON api_usage_log (created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_proveedor            ON api_usage_log (proveedor);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_proveedor_created_at ON api_usage_log (proveedor, created_at);
CREATE INDEX IF NOT EXISTS idx_monthly_costs_mes                  ON monthly_costs (mes);
CREATE INDEX IF NOT EXISTS idx_marketing_spend_mes                ON marketing_spend (mes);
