-- supabase/migrations/005_marketing_views.sql

-- ── v_marketing_roi: ROI por canal de marketing ────────────────────────
CREATE OR REPLACE VIEW v_marketing_roi AS
WITH monthly_totals AS (
  SELECT
    DATE_TRUNC('month', created_at)::DATE                       AS mes,
    COUNT(DISTINCT user_id)                                      AS total_pagadores,
    COALESCE(SUM(CASE WHEN status='completed' THEN amount_cents END), 0) / 100.0 AS total_revenue
  FROM purchases
  GROUP BY DATE_TRUNC('month', created_at)::DATE
),
monthly_spend_total AS (
  SELECT
    DATE_TRUNC('month', mes)::DATE AS mes,
    SUM(gasto_usd)                 AS total_gasto
  FROM marketing_spend
  GROUP BY DATE_TRUNC('month', mes)::DATE
)
SELECT
  ms.mes,
  ms.canal,
  ms.campana,
  ms.gasto_usd,
  ROUND(mt.total_pagadores * ms.gasto_usd / NULLIF(mst.total_gasto, 0))             AS pagadores_atribuidos,
  ROUND(mt.total_revenue  * ms.gasto_usd / NULLIF(mst.total_gasto, 0), 2)           AS revenue_atribuido_usd,
  ROUND(ms.gasto_usd / NULLIF(
    mt.total_pagadores * ms.gasto_usd / NULLIF(mst.total_gasto, 0), 0
  ), 2)                                                                               AS cac_usd,
  ROUND(
    (mt.total_revenue * ms.gasto_usd / NULLIF(mst.total_gasto, 0))
    / NULLIF(ms.gasto_usd, 0),
    2
  )                                                                                   AS roas
FROM marketing_spend ms
JOIN monthly_totals mt        ON DATE_TRUNC('month', ms.mes)::DATE = mt.mes
JOIN monthly_spend_total mst  ON DATE_TRUNC('month', ms.mes)::DATE = mst.mes
ORDER BY ms.mes DESC, ms.gasto_usd DESC;

-- ── v_monthly_pnl: P&L completo del mes ───────────────────────────────
CREATE OR REPLACE VIEW v_monthly_pnl AS
SELECT
  vm.mes,
  vm.revenue_bruto,
  vm.fees_paddle,
  vm.costos_infra,
  vm.costos_api,
  COALESCE(mk.gasto_marketing, 0)                                        AS gasto_marketing,
  ROUND(
    vm.revenue_bruto
    - vm.fees_paddle
    - vm.costos_infra
    - vm.costos_api
    - COALESCE(mk.gasto_marketing, 0),
    2
  )                                                                       AS margen_neto,
  ROUND(
    (vm.revenue_bruto - vm.fees_paddle - vm.costos_infra - vm.costos_api
     - COALESCE(mk.gasto_marketing, 0))
    / NULLIF(vm.revenue_bruto, 0) * 100,
    1
  )                                                                       AS margen_pct,
  ROUND(
    vm.revenue_bruto / NULLIF(COALESCE(mk.gasto_marketing, 0), 0),
    2
  )                                                                       AS roas_global
FROM v_monthly_margin vm
LEFT JOIN (
  SELECT DATE_TRUNC('month', mes)::DATE AS mes, SUM(gasto_usd) AS gasto_marketing
  FROM marketing_spend
  GROUP BY DATE_TRUNC('month', mes)::DATE
) mk ON vm.mes = mk.mes
ORDER BY vm.mes DESC;

-- ── v_kpi_dashboard: semáforos KPI con acciones recomendadas ──────────
CREATE OR REPLACE VIEW v_kpi_dashboard AS
WITH config AS (
  SELECT
    MAX(CASE WHEN key='kpi_conversion_green'    THEN value::NUMERIC END) AS conv_green,
    MAX(CASE WHEN key='kpi_conversion_yellow'   THEN value::NUMERIC END) AS conv_yellow,
    MAX(CASE WHEN key='kpi_cac_green'           THEN value::NUMERIC END) AS cac_green,
    MAX(CASE WHEN key='kpi_cac_yellow'          THEN value::NUMERIC END) AS cac_yellow,
    MAX(CASE WHEN key='kpi_roas_green'          THEN value::NUMERIC END) AS roas_green,
    MAX(CASE WHEN key='kpi_roas_yellow'         THEN value::NUMERIC END) AS roas_yellow,
    MAX(CASE WHEN key='kpi_completion_green'    THEN value::NUMERIC END) AS comp_green,
    MAX(CASE WHEN key='kpi_completion_yellow'   THEN value::NUMERIC END) AS comp_yellow,
    MAX(CASE WHEN key='kpi_retention_d7_green'  THEN value::NUMERIC END) AS ret_green,
    MAX(CASE WHEN key='kpi_retention_d7_yellow' THEN value::NUMERIC END) AS ret_yellow,
    MAX(CASE WHEN key='kpi_api_cost_ratio_green'  THEN value::NUMERIC END) AS api_green,
    MAX(CASE WHEN key='kpi_api_cost_ratio_yellow' THEN value::NUMERIC END) AS api_yellow
  FROM app_config WHERE key LIKE 'kpi_%'
),
raw AS (
  SELECT
    ROUND(
      COUNT(DISTINCT CASE WHEN pu.status='completed' THEN pu.user_id END) * 100.0
      / NULLIF(COUNT(DISTINCT CASE WHEN mv.event='session_started' THEN mv.user_id END), 0),
      1
    ) AS conversion_pct,
    ROUND(
      COALESCE((SELECT SUM(gasto_usd) FROM marketing_spend
        WHERE DATE_TRUNC('month',mes)=DATE_TRUNC('month',NOW())), 0)
      / NULLIF(COUNT(DISTINCT CASE WHEN pu.status='completed' THEN pu.user_id END), 0),
      2
    ) AS cac_usd,
    ROUND(
      COALESCE(SUM(CASE WHEN pu.status='completed' THEN pu.amount_cents END),0) / 100.0
      / NULLIF((SELECT SUM(gasto_usd) FROM marketing_spend
        WHERE DATE_TRUNC('month',mes)=DATE_TRUNC('month',NOW())), 0),
      2
    ) AS roas,
    ROUND(
      COUNT(DISTINCT CASE WHEN mv2.event='reading_unlocked' THEN mv2.user_id END) * 100.0
      / NULLIF(COUNT(DISTINCT CASE WHEN mv.event='session_started' THEN mv.user_id END), 0),
      1
    ) AS completion_pct,
    ROUND(
      COALESCE((SELECT SUM(costo_usd_est) FROM api_usage_log
        WHERE DATE_TRUNC('month',created_at)=DATE_TRUNC('month',NOW())), 0)
      / NULLIF(COALESCE(SUM(CASE WHEN pu.status='completed' THEN pu.amount_cents END),0)/100.0, 0) * 100,
      1
    ) AS api_cost_ratio
  FROM profiles pr
  LEFT JOIN purchases pu  ON pu.user_id=pr.id
    AND DATE_TRUNC('month',pu.created_at)=DATE_TRUNC('month',NOW())
  LEFT JOIN mvp_events mv  ON mv.user_id=pr.id
    AND DATE_TRUNC('month',mv.created_at)=DATE_TRUNC('month',NOW())
  LEFT JOIN mvp_events mv2 ON mv2.user_id=pr.id
    AND DATE_TRUNC('month',mv2.created_at)=DATE_TRUNC('month',NOW())
),
ret AS (
  SELECT ROUND(
    COUNT(DISTINCT CASE
      WHEN mv_ret.created_at BETWEEN pr_ret.created_at + INTERVAL '6 days'
                                  AND pr_ret.created_at + INTERVAL '8 days'
      THEN pr_ret.id END) * 100.0 / NULLIF(COUNT(DISTINCT pr_ret.id), 0),
    1
  ) AS retention_d7
  FROM profiles pr_ret
  LEFT JOIN mvp_events mv_ret ON mv_ret.user_id = pr_ret.id
  WHERE pr_ret.created_at >= NOW() - INTERVAL '30 days'
)
SELECT kpi, valor, umbral_verde::TEXT, umbral_amarillo::TEXT,
  CASE
    WHEN es_mayor_mejor  AND valor >= umbral_verde   THEN '🟢 verde'
    WHEN es_mayor_mejor  AND valor >= umbral_amarillo THEN '🟡 amarillo'
    WHEN NOT es_mayor_mejor AND valor <= umbral_verde  THEN '🟢 verde'
    WHEN NOT es_mayor_mejor AND valor <= umbral_amarillo THEN '🟡 amarillo'
    ELSE '🔴 rojo'
  END AS estado,
  accion_recomendada
FROM (
  SELECT 1 AS ord, 'Conversión freemium→pago (%)'  AS kpi, r.conversion_pct  AS valor,
    c.conv_green AS umbral_verde, c.conv_yellow AS umbral_amarillo, TRUE AS es_mayor_mejor,
    CASE WHEN r.conversion_pct < c.conv_yellow
      THEN 'Revisar pricing o flujo de unlock. Testear copy del modal de compra.'
         WHEN r.conversion_pct < c.conv_green
      THEN 'Monitorear. Considerar ajuste de mensaje en unlock modal.'
      ELSE 'En objetivo ✅' END AS accion_recomendada
  FROM raw r, config c
  UNION ALL
  SELECT 2, 'CAC (USD por pagador)', r.cac_usd,
    c.cac_green, c.cac_yellow, FALSE,
    CASE WHEN r.cac_usd > c.cac_yellow
      THEN 'Pausar ads pagados inmediatamente. Revisar targeting y creative.'
         WHEN r.cac_usd > c.cac_green
      THEN 'Optimizar campañas. Probar nuevas creatividades o audiencias.'
      ELSE 'En objetivo ✅' END
  FROM raw r, config c
  UNION ALL
  SELECT 3, 'ROAS', r.roas,
    c.roas_green, c.roas_yellow, TRUE,
    CASE WHEN r.roas < c.roas_yellow
      THEN 'URGENTE: Pausar ads pagados. Enfocar en orgánico e influencers.'
         WHEN r.roas < c.roas_green
      THEN 'Optimizar copy de ads y segmentación de audiencia.'
      ELSE 'En objetivo ✅' END
  FROM raw r, config c
  UNION ALL
  SELECT 4, 'Completitud del flujo (%)', r.completion_pct,
    c.comp_green, c.comp_yellow, TRUE,
    CASE WHEN r.completion_pct < c.comp_yellow
      THEN 'Revisar UX de la revelación. Posible bug o fricción bloqueante.'
         WHEN r.completion_pct < c.comp_green
      THEN 'A/B test en pantalla de revelación. Simplificar pasos.'
      ELSE 'En objetivo ✅' END
  FROM raw r, config c
  UNION ALL
  SELECT 5, 'Retención D7 (%)', rt.retention_d7,
    c.ret_green, c.ret_yellow, TRUE,
    CASE WHEN rt.retention_d7 < c.ret_yellow
      THEN 'Activar email de reactivación a D5. Revisar propuesta de valor.'
         WHEN rt.retention_d7 < c.ret_green
      THEN 'Mejorar email post-consulta. Agregar recordatorio de créditos.'
      ELSE 'En objetivo ✅' END
  FROM ret rt, config c
  UNION ALL
  SELECT 6, 'Ratio costo API / revenue (%)', r.api_cost_ratio,
    c.api_green, c.api_yellow, FALSE,
    CASE WHEN r.api_cost_ratio > c.api_yellow
      THEN 'Revisar prompts Gemini — reducir output tokens. Cachear respuestas frecuentes.'
         WHEN r.api_cost_ratio > c.api_green
      THEN 'Monitorear crecimiento. Evaluar optimización de prompts.'
      ELSE 'En objetivo ✅' END
  FROM raw r, config c
) kpis
ORDER BY ord;
