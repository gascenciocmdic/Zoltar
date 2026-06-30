# Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear un panel de administración basado en Supabase nativo con 4 tablas nuevas, 11 vistas SQL de métricas, y 3 endpoints actualizados para logging de uso de APIs.

**Architecture:** Supabase nativo sin frontend nuevo. El admin ejecuta queries directamente en el SQL Editor de Supabase. Las tablas `app_config`, `monthly_costs`, `marketing_spend` y `api_usage_log` alimentan 11 vistas SQL que cubren revenue, comportamiento, marketing ROI y semáforos KPI. El backend lee parámetros de `app_config` con fallback a constantes hardcodeadas.

**Tech Stack:** PostgreSQL (Supabase), Vercel Serverless Functions (ES Modules), `@supabase/supabase-js`, `@google/genai`, ElevenLabs REST API.

---

## File Map

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `supabase/migrations/001_admin_tables.sql` | Crear | DDL: 4 tablas nuevas |
| `supabase/migrations/002_admin_seed.sql` | Crear | Seed inicial de app_config |
| `supabase/migrations/003_revenue_views.sql` | Crear | Vistas: v_revenue_summary, v_daily_revenue, v_packages_breakdown, v_monthly_margin, v_api_costs |
| `supabase/migrations/004_behavior_views.sql` | Crear | Vistas: v_funnel_metrics, v_usage_by_language, v_top_users |
| `supabase/migrations/005_marketing_views.sql` | Crear | Vistas: v_marketing_roi, v_monthly_pnl, v_kpi_dashboard |
| `api/credits.js` | Modificar | Leer CREDIT_COSTS y bonos desde app_config con cache |
| `api/gemini.js` | Modificar | Loguear tokens input/output en api_usage_log |
| `api/tts.js` | Modificar | Loguear chars enviados a ElevenLabs en api_usage_log |

---

## Task 1: Crear tablas nuevas en Supabase

**Files:**
- Create: `supabase/migrations/001_admin_tables.sql`

- [ ] **Step 1: Crear el archivo de migración**

```sql
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
  costo_usd  NUMERIC(10,2) NOT NULL DEFAULT 0,
  nota       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── marketing_spend: gasto en marketing por canal y mes ────────────────
CREATE TABLE IF NOT EXISTS marketing_spend (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mes        DATE NOT NULL,
  canal      TEXT NOT NULL,
  campana    TEXT,
  gasto_usd  NUMERIC(10,2) NOT NULL DEFAULT 0,
  nota       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
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
CREATE INDEX IF NOT EXISTS idx_api_usage_log_created_at ON api_usage_log (created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_proveedor  ON api_usage_log (proveedor);
CREATE INDEX IF NOT EXISTS idx_monthly_costs_mes        ON monthly_costs (mes);
CREATE INDEX IF NOT EXISTS idx_marketing_spend_mes      ON marketing_spend (mes);
```

- [ ] **Step 2: Ejecutar en Supabase SQL Editor**

Ir a: **Supabase Dashboard → SQL Editor → New query**
Pegar el contenido completo del archivo y hacer clic en **Run**.

- [ ] **Step 3: Verificar que las tablas se crearon**

Ejecutar en SQL Editor:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('app_config', 'monthly_costs', 'marketing_spend', 'api_usage_log')
ORDER BY table_name;
```
Resultado esperado: 4 filas, una por tabla.

- [ ] **Step 4: Commit del archivo SQL**

```bash
git add supabase/migrations/001_admin_tables.sql
git commit -m "feat(admin): crear tablas app_config, monthly_costs, marketing_spend, api_usage_log"
```

---

## Task 2: Seed inicial de app_config

**Files:**
- Create: `supabase/migrations/002_admin_seed.sql`

- [ ] **Step 1: Crear el archivo de seed**

```sql
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
  ('kpi_api_cost_ratio_green',     '20',  '% costo API / revenue: umbral verde (menor = mejor)'),
  ('kpi_api_cost_ratio_yellow',    '40',  '% costo API / revenue: umbral amarillo')
ON CONFLICT (key) DO NOTHING;
```

- [ ] **Step 2: Ejecutar en Supabase SQL Editor**

Pegar y ejecutar. El `ON CONFLICT DO NOTHING` garantiza idempotencia.

- [ ] **Step 3: Verificar seed**

```sql
SELECT key, value FROM app_config ORDER BY key;
```
Resultado esperado: 24 filas.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/002_admin_seed.sql
git commit -m "feat(admin): seed inicial de app_config con costos, bonos y umbrales KPI"
```

---

## Task 3: Vistas de Revenue

**Files:**
- Create: `supabase/migrations/003_revenue_views.sql`

- [ ] **Step 1: Crear el archivo de vistas de revenue**

```sql
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
```

- [ ] **Step 2: Ejecutar en Supabase SQL Editor**

Pegar y ejecutar. Esperar confirmación "Success".

- [ ] **Step 3: Verificar que las vistas retornan datos**

```sql
-- Si hay purchases en la tabla, debería retornar al menos una fila
SELECT * FROM v_revenue_summary;

-- Verificar estructura aunque esté vacía
SELECT * FROM v_daily_revenue LIMIT 5;
SELECT * FROM v_packages_breakdown LIMIT 5;
SELECT * FROM v_monthly_margin LIMIT 5;
SELECT * FROM v_api_costs LIMIT 5;
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/003_revenue_views.sql
git commit -m "feat(admin): vistas SQL de revenue, margen y costos de API"
```

---

## Task 4: Vistas de Comportamiento

**Files:**
- Create: `supabase/migrations/004_behavior_views.sql`

- [ ] **Step 1: Crear el archivo de vistas de comportamiento**

```sql
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
```

- [ ] **Step 2: Ejecutar en Supabase SQL Editor**

Pegar y ejecutar.

- [ ] **Step 3: Verificar vistas**

```sql
SELECT * FROM v_funnel_metrics;
SELECT * FROM v_usage_by_language;
SELECT * FROM v_top_users LIMIT 5;
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/004_behavior_views.sql
git commit -m "feat(admin): vistas SQL de funnel, uso por idioma y top usuarios"
```

---

## Task 5: Vistas de Marketing y KPIs

**Files:**
- Create: `supabase/migrations/005_marketing_views.sql`

- [ ] **Step 1: Crear el archivo de vistas de marketing y KPIs**

```sql
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
  -- Atribución proporcional al gasto del canal sobre el total del mes
  ROUND(mt.total_pagadores * ms.gasto_usd / NULLIF(mst.total_gasto, 0))             AS pagadores_atribuidos,
  ROUND(mt.total_revenue  * ms.gasto_usd / NULLIF(mst.total_gasto, 0), 2)           AS revenue_atribuido_usd,
  -- CAC: gasto del canal / pagadores atribuidos
  ROUND(ms.gasto_usd / NULLIF(
    mt.total_pagadores * ms.gasto_usd / NULLIF(mst.total_gasto, 0), 0
  ), 2)                                                                               AS cac_usd,
  -- ROAS: revenue atribuido / gasto del canal
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
  -- Conversión freemium→pago este mes
  SELECT
    ROUND(
      COUNT(DISTINCT CASE WHEN pu.status='completed' THEN pu.user_id END) * 100.0
      / NULLIF(COUNT(DISTINCT CASE WHEN mv.event='session_started' THEN mv.user_id END), 0),
      1
    ) AS conversion_pct,
    -- CAC
    ROUND(
      COALESCE((SELECT SUM(gasto_usd) FROM marketing_spend
        WHERE DATE_TRUNC('month',mes)=DATE_TRUNC('month',NOW())), 0)
      / NULLIF(COUNT(DISTINCT CASE WHEN pu.status='completed' THEN pu.user_id END), 0),
      2
    ) AS cac_usd,
    -- ROAS
    ROUND(
      COALESCE(SUM(CASE WHEN pu.status='completed' THEN pu.amount_cents END),0) / 100.0
      / NULLIF((SELECT SUM(gasto_usd) FROM marketing_spend
        WHERE DATE_TRUNC('month',mes)=DATE_TRUNC('month',NOW())), 0),
      2
    ) AS roas,
    -- Completitud (reached reading_unlocked / session_started)
    ROUND(
      COUNT(DISTINCT CASE WHEN mv2.event='reading_unlocked' THEN mv2.user_id END) * 100.0
      / NULLIF(COUNT(DISTINCT CASE WHEN mv.event='session_started' THEN mv.user_id END), 0),
      1
    ) AS completion_pct,
    -- Ratio costo API / revenue
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
-- Retención D7: usuarios que volvieron entre día 6 y 8 tras registro
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
```

- [ ] **Step 2: Ejecutar en Supabase SQL Editor**

Pegar y ejecutar.

- [ ] **Step 3: Verificar vistas**

```sql
-- Vista de marketing (vacía hasta que cargues marketing_spend)
SELECT * FROM v_marketing_roi LIMIT 5;

-- P&L completo
SELECT * FROM v_monthly_pnl LIMIT 5;

-- Semáforos KPI — debe retornar 6 filas con estado verde/amarillo/rojo
SELECT kpi, valor, estado, accion_recomendada FROM v_kpi_dashboard;
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/005_marketing_views.sql
git commit -m "feat(admin): vistas SQL de marketing ROI, P&L mensual y semáforos KPI"
```

---

## Task 6: api/credits.js — Leer configuración desde app_config

**Files:**
- Modify: `api/credits.js`

- [ ] **Step 1: Agregar helper de cache de configuración al inicio del archivo**

Abrir `api/credits.js`. Después de las líneas de import (línea ~12), agregar este bloque antes de `const CREDIT_COSTS`:

```javascript
// ── Config cache: lee app_config de Supabase con fallback a constantes ──
let _configCache = null;
let _configCacheTime = 0;
const CONFIG_TTL_MS = 60_000;

const CREDIT_COSTS_DEFAULT = {
  consultation:     40,
  ancestral_ritual: 65,
  premium_ritual:  100,
  deepening:        10,
  reconsultation:   40,
  synthesis_email:  10,
};

const BONUSES_DEFAULT = {
  signup:              100,
  referral_referrer:    50,
  referral_new_user:    25,
};

async function getAppConfig(sb) {
  const now = Date.now();
  if (_configCache && now - _configCacheTime < CONFIG_TTL_MS) return _configCache;

  try {
    const { data, error } = await sb
      .from('app_config')
      .select('key, value')
      .in('key', [
        'credit_cost_consultation', 'credit_cost_ancestral_ritual',
        'credit_cost_premium_ritual', 'credit_cost_deepening',
        'credit_cost_reconsultation', 'credit_cost_synthesis_email',
        'signup_bonus', 'referral_bonus_referrer', 'referral_bonus_new_user',
      ]);

    if (error || !data) throw new Error(error?.message || 'No data');

    const raw = Object.fromEntries(data.map(r => [r.key, Number(r.value)]));
    _configCache = {
      CREDIT_COSTS: {
        consultation:     raw.credit_cost_consultation     ?? CREDIT_COSTS_DEFAULT.consultation,
        ancestral_ritual: raw.credit_cost_ancestral_ritual ?? CREDIT_COSTS_DEFAULT.ancestral_ritual,
        premium_ritual:   raw.credit_cost_premium_ritual   ?? CREDIT_COSTS_DEFAULT.premium_ritual,
        deepening:        raw.credit_cost_deepening        ?? CREDIT_COSTS_DEFAULT.deepening,
        reconsultation:   raw.credit_cost_reconsultation   ?? CREDIT_COSTS_DEFAULT.reconsultation,
        synthesis_email:  raw.credit_cost_synthesis_email  ?? CREDIT_COSTS_DEFAULT.synthesis_email,
      },
      BONUSES: {
        signup:            raw.signup_bonus            ?? BONUSES_DEFAULT.signup,
        referral_referrer: raw.referral_bonus_referrer ?? BONUSES_DEFAULT.referral_referrer,
        referral_new_user: raw.referral_bonus_new_user ?? BONUSES_DEFAULT.referral_new_user,
      },
    };
    _configCacheTime = now;
  } catch (err) {
    console.warn('[credits] No se pudo leer app_config, usando defaults:', err.message);
    _configCache = { CREDIT_COSTS: CREDIT_COSTS_DEFAULT, BONUSES: BONUSES_DEFAULT };
    _configCacheTime = now;
  }

  return _configCache;
}
```

- [ ] **Step 2: Reemplazar las constantes hardcodeadas por la versión dinámica**

Encontrar las líneas actuales (aprox línea 12-24):
```javascript
const CREDIT_COSTS = {
  consultation:     40,
  ...
};

const SIGNUP_BONUS             = 100;
const REFERRAL_BONUS_REFERRER  = 50;
const REFERRAL_BONUS_NEW_USER  = 25;
```

Eliminar esas constantes. Ya están cubiertos por `CREDIT_COSTS_DEFAULT` y `BONUSES_DEFAULT`.

- [ ] **Step 3: Actualizar el handler para obtener config dinámicamente**

Al inicio del bloque `export default async function handler(req, res)`, después de crear `const sb = supabaseAdmin();`, agregar:

```javascript
const { CREDIT_COSTS, BONUSES } = await getAppConfig(sb);
const SIGNUP_BONUS            = BONUSES.signup;
const REFERRAL_BONUS_REFERRER = BONUSES.referral_referrer;
const REFERRAL_BONUS_NEW_USER = BONUSES.referral_new_user;
```

- [ ] **Step 4: Verificar que la app sigue funcionando**

```bash
# En terminal local
cd /Users/inacap/Documents/Zoltar
vercel dev
```

Abrir http://localhost:3000 y completar un flujo de consulta completo. Verificar que los créditos se descuentan correctamente.

- [ ] **Step 5: Commit**

```bash
git add api/credits.js
git commit -m "feat(admin): credits.js lee CREDIT_COSTS y bonos desde app_config con cache y fallback"
```

---

## Task 7: api/gemini.js — Loguear uso de tokens

**Files:**
- Modify: `api/gemini.js`

- [ ] **Step 1: Agregar import de Supabase al inicio del archivo**

En `api/gemini.js`, después de `import { GoogleGenAI } from "@google/genai";`, agregar:

```javascript
import { createClient } from '@supabase/supabase-js';

function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
```

- [ ] **Step 2: Agregar la función de logging (fire-and-forget)**

Después de `const MODEL = "gemini-2.5-flash";`, agregar:

```javascript
async function logGeminiUsage({ tokensInput, tokensOutput, userId = null }) {
  try {
    const costPer1mInput  = 0.075;
    const costPer1mOutput = 0.30;
    const costEst = (tokensInput * costPer1mInput + tokensOutput * costPer1mOutput) / 1_000_000;

    await supabaseAdmin().from('api_usage_log').insert({
      user_id:       userId,
      proveedor:     'gemini',
      tokens_input:  tokensInput,
      tokens_output: tokensOutput,
      modelo:        MODEL,
      costo_usd_est: costEst,
    });
  } catch (err) {
    console.warn('[gemini] No se pudo loguear uso en api_usage_log:', err.message);
  }
}
```

- [ ] **Step 3: Modificar generateJSON para retornar usage metadata**

Reemplazar la función `generateJSON` existente por esta versión que también retorna el uso de tokens:

```javascript
async function generateJSON(ai, prompt) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });
  const text  = response.text;
  const match = text.match(/{[\s\S]*}/);
  const data  = JSON.parse(match ? match[0] : text);
  const usage = response.usageMetadata || {};
  return {
    data,
    tokensInput:  usage.promptTokenCount     || 0,
    tokensOutput: usage.candidatesTokenCount || 0,
  };
}
```

- [ ] **Step 4: Actualizar cada función handler para loguear uso**

Cada función `handleXxx` llama `await generateJSON(ai, prompt)`. Actualizar el patrón en `handleTeaser` como ejemplo (repetir para las demás):

```javascript
async function handleTeaser(ai, { cards, reason, userContext, language = 'es' }, userId) {
  // ... prompt igual que antes ...
  try {
    const { data, tokensInput, tokensOutput } = await generateJSON(ai, prompt);
    logGeminiUsage({ tokensInput, tokensOutput, userId }).catch(() => {});
    return data;
  } catch (e) {
    return {
      teaser: language === 'en'
        ? "The wind of centuries whispers of a throne lost in the desert sand... the cards hide a secret that your soul is ready to remember."
        : "El viento de los siglos susurra sobre un trono perdido en la arena del desierto... las cartas esconden un secreto que tu alma está lista para recordar."
    };
  }
}
```

Hacer lo mismo en `handleIntrospection`, `handleInterpretation`, `handleAnchoring`, `handleDeepening`.

- [ ] **Step 5: Pasar userId desde el handler principal**

En el `switch (action)` del handler principal, obtener el userId del JWT y pasarlo a cada función:

```javascript
// Al inicio del handler, antes del switch:
const authHeader = req.headers['authorization'] || '';
const token = authHeader.replace('Bearer ', '').trim();
let userId = null;
if (token) {
  try {
    const sb = supabaseAdmin();
    const { data } = await sb.auth.getUser(token);
    userId = data?.user?.id || null;
  } catch (_) {}
}

// En el switch:
case 'teaser':         result = await handleTeaser(ai, payload, userId); break;
case 'introspection':  result = await handleIntrospection(ai, payload, userId); break;
case 'interpretation': result = await handleInterpretation(ai, payload, userId); break;
case 'anchoring':      result = await handleAnchoring(ai, payload, userId); break;
case 'deepening':      result = await handleDeepening(ai, payload, userId); break;
```

- [ ] **Step 6: Verificar que el log funciona**

Hacer una consulta completa en la app y luego ejecutar en Supabase SQL Editor:
```sql
SELECT * FROM api_usage_log WHERE proveedor = 'gemini' ORDER BY created_at DESC LIMIT 5;
```
Debe aparecer al menos una fila con tokens_input, tokens_output y costo_usd_est.

- [ ] **Step 7: Commit**

```bash
git add api/gemini.js
git commit -m "feat(admin): gemini.js loguea tokens input/output en api_usage_log (fire-and-forget)"
```

---

## Task 8: api/tts.js — Loguear uso de ElevenLabs

**Files:**
- Modify: `api/tts.js`

- [ ] **Step 1: Agregar import de Supabase al inicio de tts.js**

Agregar al principio del archivo, después de `export const maxDuration = 60;`:

```javascript
import { createClient } from '@supabase/supabase-js';

function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
```

- [ ] **Step 2: Agregar función de logging fire-and-forget**

Después de la definición de `VOICE_SETTINGS`, agregar:

```javascript
async function logElevenLabsUsage({ charsSent, voiceId, userId = null }) {
  try {
    const costPerChar = 0.00022; // plan Creator: $22/100k chars
    const costEst = charsSent * costPerChar;

    await supabaseAdmin().from('api_usage_log').insert({
      user_id:      userId,
      proveedor:    'elevenlabs',
      chars_sent:   charsSent,
      modelo:       voiceId,
      costo_usd_est: costEst,
    });
  } catch (err) {
    console.warn('[tts] No se pudo loguear uso en api_usage_log:', err.message);
  }
}
```

- [ ] **Step 3: Llamar logElevenLabsUsage tras el request exitoso**

En el handler, después de obtener `voiceId` y `text`, y justo antes (o después) del `fetch` a ElevenLabs, agregar el log. Buscar la línea `const response = await fetch(...)` y después de validar que la respuesta es ok, agregar:

```javascript
// Obtener userId del JWT (no bloquea el flujo si falla)
let userId = null;
try {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (token) {
    const { data } = await supabaseAdmin().auth.getUser(token);
    userId = data?.user?.id || null;
  }
} catch (_) {}

// Log fire-and-forget (no bloquea la respuesta de audio)
logElevenLabsUsage({ charsSent: text.length, voiceId, userId }).catch(() => {});
```

- [ ] **Step 4: Verificar que el log funciona**

Hacer una consulta Premium con voz de ElevenLabs y luego ejecutar en Supabase SQL Editor:
```sql
SELECT * FROM api_usage_log WHERE proveedor = 'elevenlabs' ORDER BY created_at DESC LIMIT 5;
```
Debe aparecer al menos una fila con chars_sent y costo_usd_est.

- [ ] **Step 5: Commit y push**

```bash
git add api/tts.js
git commit -m "feat(admin): tts.js loguea chars enviados a ElevenLabs en api_usage_log"
git push origin main
```

---

## Task 9: Verificación final y guía de uso

- [ ] **Step 1: Ejecutar suite completa de verificación en Supabase SQL Editor**

```sql
-- 1. Resumen financiero
SELECT * FROM v_revenue_summary;

-- 2. Ingresos últimos 7 días
SELECT * FROM v_daily_revenue LIMIT 7;

-- 3. Breakdown por paquete
SELECT * FROM v_packages_breakdown;

-- 4. Margen mensual
SELECT * FROM v_monthly_margin LIMIT 3;

-- 5. Costos API del mes
SELECT * FROM v_api_costs;

-- 6. Funnel del mes
SELECT * FROM v_funnel_metrics;

-- 7. Uso por idioma
SELECT * FROM v_usage_by_language;

-- 8. Top usuarios
SELECT * FROM v_top_users LIMIT 10;

-- 9. ROI marketing (vacío hasta agregar datos en marketing_spend)
SELECT * FROM v_marketing_roi;

-- 10. P&L mensual
SELECT * FROM v_monthly_pnl;

-- 11. Semáforos KPI — tu dashboard diario
SELECT kpi, valor, estado, accion_recomendada FROM v_kpi_dashboard;
```

- [ ] **Step 2: Guardar queries frecuentes como Snippets en Supabase**

En Supabase SQL Editor → clic en el ícono de guardar (💾) para cada query frecuente:
- `"📊 KPIs hoy"` → `SELECT kpi, valor, estado, accion_recomendada FROM v_kpi_dashboard;`
- `"💰 Revenue summary"` → `SELECT * FROM v_revenue_summary;`
- `"📋 P&L mensual"` → `SELECT * FROM v_monthly_pnl;`
- `"🔻 Funnel este mes"` → `SELECT * FROM v_funnel_metrics;`

- [ ] **Step 3: Agregar primeros datos de marketing_spend**

En Supabase Table Editor → `marketing_spend`, agregar una fila por cada canal activo del mes:
```
mes: 2026-06-01, canal: Orgánico, campana: Lanzamiento, gasto_usd: 0, nota: TikTok + Instagram orgánico
```

- [ ] **Step 4: Agregar costos de infraestructura del mes actual**

En Table Editor → `monthly_costs`, agregar una fila por servicio:
```
mes: 2026-06-01, servicio: ElevenLabs, costo_usd: 22.00, nota: Plan Creator
mes: 2026-06-01, servicio: Gemini,     costo_usd: 0,     nota: Free tier
```

- [ ] **Step 5: Verificar que cambiar app_config afecta a la app sin redeploy**

En Table Editor → `app_config`, cambiar `credit_cost_deepening` de `10` a `15`.
Esperar 60 segundos (TTL del cache), hacer una profundización en la app y verificar que deduce 15 créditos.
Volver a cambiar a `10`.

- [ ] **Step 6: Commit final**

```bash
git add supabase/
git commit -m "docs(admin): agregar migraciones SQL completas del panel de administración"
git push origin main
```

---

## Referencia rápida — Qué editar y cuándo

| Acción | Dónde |
|---|---|
| Cambiar costo de créditos | Supabase → Table Editor → `app_config` |
| Cambiar bonos de signup/referido | Supabase → Table Editor → `app_config` |
| Ajustar umbrales KPI (semáforos) | Supabase → Table Editor → `app_config` → filas `kpi_*` |
| Registrar costos del mes (Vercel, Supabase, etc.) | Supabase → Table Editor → `monthly_costs` |
| Registrar gasto en publicidad | Supabase → Table Editor → `marketing_spend` |
| Ver estado del negocio hoy | Supabase → SQL Editor → Snippet "📊 KPIs hoy" |
| Ver revenue del mes | Supabase → SQL Editor → Snippet "💰 Revenue summary" |
