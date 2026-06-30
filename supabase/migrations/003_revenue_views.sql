-- supabase/migrations/003_revenue_views.sql

-- ── v_revenue_summary: resumen financiero global ───────────────────────
CREATE OR REPLACE VIEW v_revenue_summary AS
SELECT
  ROUND(COALESCE(SUM(amount_cents), 0) / 100.0, 2)                                      AS total_revenue_usd,
  COUNT(DISTINCT user_id)                                                                  AS total_pagadores,
  ROUND(COALESCE(AVG(amount_cents), 0) / 100.0, 2)                                       AS ticket_promedio,
  (SELECT package_id FROM purchases WHERE status = 'completed'
   GROUP BY package_id ORDER BY COUNT(*) DESC LIMIT 1)                                    AS paquete_mas_vendido,
  ROUND(COALESCE(SUM(CASE WHEN DATE(created_at) = CURRENT_DATE
    THEN amount_cents ELSE 0 END), 0) / 100.0, 2)                                         AS revenue_hoy,
  ROUND(COALESCE(SUM(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
    THEN amount_cents ELSE 0 END), 0) / 100.0, 2)                                         AS revenue_este_mes,
  ROUND(COALESCE(SUM(amount_cents), 0) / 100.0 * 0.05, 2)                                AS fees_paddle_usd
FROM purchases
WHERE status = 'completed';

-- ── v_daily_revenue: ingresos por día (últimos 30 días) ────────────────
CREATE OR REPLACE VIEW v_daily_revenue AS
SELECT
  DATE(created_at)                          AS fecha,
  COUNT(*)                                  AS transacciones,
  ROUND(SUM(amount_cents) / 100.0, 2)       AS revenue_usd,
  COUNT(DISTINCT user_id)                   AS nuevos_pagadores
FROM purchases
WHERE status = 'completed'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY fecha DESC;

-- ── v_packages_breakdown: ventas por paquete ───────────────────────────
CREATE OR REPLACE VIEW v_packages_breakdown AS
WITH totals AS (
  SELECT COALESCE(SUM(amount_cents), 0) AS total_cents
  FROM purchases WHERE status = 'completed'
)
SELECT
  p.package_id                                                          AS paquete,
  COUNT(*)                                                              AS unidades_vendidas,
  ROUND(SUM(p.amount_cents) / 100.0, 2)                                AS revenue_usd,
  ROUND(SUM(p.amount_cents) * 100.0 / NULLIF(t.total_cents, 0), 1)     AS porcentaje_del_total
FROM purchases p, totals t
WHERE p.status = 'completed'
GROUP BY p.package_id, t.total_cents
ORDER BY revenue_usd DESC;

-- ── v_monthly_margin: revenue - fees - costos = margen ─────────────────
CREATE OR REPLACE VIEW v_monthly_margin AS
SELECT
  DATE_TRUNC('month', p.created_at)::DATE                              AS mes,
  ROUND(SUM(p.amount_cents) / 100.0, 2)                                AS revenue_bruto,
  ROUND(SUM(p.amount_cents) / 100.0 * 0.05, 2)                        AS fees_paddle,
  COALESCE(mc.costos_infra, 0)                                         AS costos_infra,
  COALESCE(ac.costos_api, 0)                                           AS costos_api,
  ROUND(
    SUM(p.amount_cents) / 100.0
    - SUM(p.amount_cents) / 100.0 * 0.05
    - COALESCE(mc.costos_infra, 0)
    - COALESCE(ac.costos_api, 0),
    2
  )                                                                     AS margen_neto,
  ROUND(
    (SUM(p.amount_cents) / 100.0
     - SUM(p.amount_cents) / 100.0 * 0.05
     - COALESCE(mc.costos_infra, 0)
     - COALESCE(ac.costos_api, 0))
    / NULLIF(SUM(p.amount_cents) / 100.0, 0) * 100,
    1
  )                                                                     AS margen_pct
FROM purchases p
LEFT JOIN (
  SELECT DATE_TRUNC('month', mes)::DATE AS mes, SUM(costo_usd) AS costos_infra
  FROM monthly_costs
  GROUP BY DATE_TRUNC('month', mes)::DATE
) mc ON DATE_TRUNC('month', p.created_at)::DATE = mc.mes
LEFT JOIN (
  SELECT DATE_TRUNC('month', created_at)::DATE AS mes, SUM(costo_usd_est) AS costos_api
  FROM api_usage_log
  GROUP BY DATE_TRUNC('month', created_at)::DATE
) ac ON DATE_TRUNC('month', p.created_at)::DATE = ac.mes
WHERE p.status = 'completed'
GROUP BY DATE_TRUNC('month', p.created_at)::DATE, mc.costos_infra, ac.costos_api
ORDER BY mes DESC;

-- ── v_api_costs: costo real de APIs por mes ────────────────────────────
CREATE OR REPLACE VIEW v_api_costs AS
SELECT
  DATE_TRUNC('month', created_at)::DATE                AS mes,
  proveedor,
  COUNT(*)                                              AS llamadas,
  CASE
    WHEN proveedor = 'gemini'      THEN SUM(tokens_output)::TEXT || ' tokens output'
    WHEN proveedor = 'elevenlabs'  THEN SUM(chars_sent)::TEXT || ' chars'
  END                                                   AS volumen,
  CASE
    WHEN proveedor = 'gemini'      THEN '$0.30/1M tokens output'
    WHEN proveedor = 'elevenlabs'  THEN '$0.00022/char (plan Creator)'
  END                                                   AS tarifa,
  ROUND(SUM(costo_usd_est), 4)                          AS costo_usd
FROM api_usage_log
GROUP BY DATE_TRUNC('month', created_at)::DATE, proveedor
ORDER BY mes DESC, proveedor;
