-- supabase/migrations/004_behavior_views.sql

-- ── v_funnel_metrics: conversión por etapa del flujo (mes actual) ───────
CREATE OR REPLACE VIEW v_funnel_metrics AS
WITH mes_actual AS (
  SELECT
    COUNT(DISTINCT CASE WHEN event = 'session_started'      THEN user_id END) AS sesiones,
    COUNT(DISTINCT CASE WHEN event = 'revelation_viewed'    THEN user_id END) AS revelaciones,
    COUNT(DISTINCT CASE WHEN event = 'unlock_modal_opened'  THEN user_id END) AS modal_abierto,
    COUNT(DISTINCT CASE WHEN event = 'reading_unlocked'     THEN user_id END) AS desbloqueados,
    COUNT(DISTINCT CASE WHEN event = 'purchase_completed'   THEN user_id END) AS pagadores
  FROM mvp_events
  WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
),
funnel AS (
  SELECT 1 AS orden, '🚪 Sesiones iniciadas'    AS etapa, sesiones     AS usuarios, sesiones FROM mes_actual
  UNION ALL
  SELECT 2, '🔮 Revelación vista',               revelaciones,  sesiones FROM mes_actual
  UNION ALL
  SELECT 3, '🔓 Modal unlock abierto',           modal_abierto, sesiones FROM mes_actual
  UNION ALL
  SELECT 4, '💎 Lectura desbloqueada',           desbloqueados, sesiones FROM mes_actual
  UNION ALL
  SELECT 5, '💳 Pago completado',                pagadores,     sesiones FROM mes_actual
)
SELECT
  etapa,
  usuarios,
  ROUND(usuarios * 100.0 / NULLIF(sesiones, 0), 1)                                       AS conversion_pct,
  ROUND(
    (LAG(usuarios) OVER (ORDER BY orden) - usuarios) * 100.0
    / NULLIF(LAG(usuarios) OVER (ORDER BY orden), 0),
    1
  )                                                                                        AS drop_pct
FROM funnel;

-- ── v_usage_by_language: sesiones y conversión por idioma ──────────────
CREATE OR REPLACE VIEW v_usage_by_language AS
SELECT
  COALESCE(properties->>'language', 'unknown')                          AS idioma,
  COUNT(DISTINCT CASE WHEN event = 'session_started' THEN user_id END)  AS sesiones,
  COUNT(CASE WHEN event = 'session_started'
    AND properties->>'tier' = 'standard' THEN 1 END)                    AS tier_standard,
  COUNT(CASE WHEN event = 'session_started'
    AND properties->>'tier' = 'full' THEN 1 END)                        AS tier_full,
  COUNT(CASE WHEN event = 'session_started'
    AND properties->>'tier' = 'premium' THEN 1 END)                     AS tier_premium,
  ROUND(
    COUNT(DISTINCT CASE WHEN event = 'purchase_completed' THEN user_id END) * 100.0
    / NULLIF(COUNT(DISTINCT CASE WHEN event = 'session_started' THEN user_id END), 0),
    1
  )                                                                       AS conversion_pct
FROM mvp_events
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
GROUP BY COALESCE(properties->>'language', 'unknown')
ORDER BY sesiones DESC;

-- ── v_top_users: top 20 usuarios más activos ───────────────────────────
CREATE OR REPLACE VIEW v_top_users AS
SELECT
  pr.email,
  pr.credits                                                             AS creditos_actuales,
  COUNT(DISTINCT CASE WHEN cl.reason IN
    ('consultation','ancestral_ritual','premium_ritual','reconsultation')
    THEN cl.id END)                                                      AS consultas_totales,
  COUNT(DISTINCT pu.id)                                                  AS pagos_realizados,
  MAX(mv.created_at)                                                     AS ultimo_acceso
FROM profiles pr
LEFT JOIN credit_ledger cl ON cl.user_id = pr.id AND cl.amount < 0
LEFT JOIN purchases pu      ON pu.user_id = pr.id AND pu.status = 'completed'
LEFT JOIN mvp_events mv      ON mv.user_id = pr.id
GROUP BY pr.id, pr.email, pr.credits
ORDER BY consultas_totales DESC, pagos_realizados DESC
LIMIT 20;
