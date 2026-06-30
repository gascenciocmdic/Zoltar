# Panel de Administración Zoltar — Diseño

**Fecha:** 2026-06-29  
**Estado:** Aprobado  
**Proyecto:** cosmic-guidance.com

---

## Resumen

Panel de administración basado en Supabase nativo (sin frontend nuevo). El administrador accede desde el SQL Editor y Table Editor de Supabase para consultar métricas y configurar parámetros de la app. La app lee los parámetros operativos desde la base de datos en tiempo de ejecución, eliminando la necesidad de redeploy para cambios de configuración.

---

## Arquitectura

**Decisión:** Supabase nativo — vistas SQL + tabla de configuración.  
**Razón:** Más rápido de implementar (1–2 días), sin frontend adicional, cambios de config instantáneos sin redeploy.

### Componentes

| Componente | Tipo | Descripción |
|---|---|---|
| `app_config` | Tabla editable | Parámetros configurables de la app |
| `monthly_costs` | Tabla editable | Costos de infraestructura por mes |
| `marketing_spend` | Tabla editable | Gasto de marketing por canal y mes |
| `api_usage_log` | Tabla automática | Log de uso real de Gemini y ElevenLabs |
| `v_revenue_summary` | Vista SQL | Resumen financiero global |
| `v_daily_revenue` | Vista SQL | Ingresos día a día (últimos 30 días) |
| `v_packages_breakdown` | Vista SQL | Ventas por paquete de créditos |
| `v_monthly_margin` | Vista SQL | Revenue - fees - costos = margen neto |
| `v_api_costs` | Vista SQL | Costo real de APIs desde api_usage_log |
| `v_funnel_metrics` | Vista SQL | Conversión por etapa del flujo |
| `v_usage_by_language` | Vista SQL | Sesiones y conversión por idioma y tier |
| `v_top_users` | Vista SQL | Usuarios más activos |
| `v_marketing_roi` | Vista SQL | CAC y ROAS por canal de marketing |
| `v_monthly_pnl` | Vista SQL | P&L completo del mes |
| `v_kpi_dashboard` | Vista SQL | Semáforos KPI con acciones recomendadas |

---

## Tablas nuevas

### `app_config`

Almacena todos los parámetros configurables de la app. La app los lee en cada request en vez de usar constantes hardcodeadas.

```sql
CREATE TABLE app_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT
);
```

**Filas iniciales:**

| key | value | description |
|---|---|---|
| `credit_cost_consultation` | `40` | Créditos por consulta estándar |
| `credit_cost_ancestral_ritual` | `65` | Créditos por ritual ancestral |
| `credit_cost_premium_ritual` | `100` | Créditos por ritual premium (ElevenLabs) |
| `credit_cost_deepening` | `10` | Créditos por profundización |
| `credit_cost_synthesis_email` | `10` | Créditos por email de síntesis |
| `signup_bonus` | `100` | Créditos de bienvenida al registrarse |
| `referral_bonus_referrer` | `50` | Créditos para quien refirió |
| `referral_bonus_new_user` | `25` | Créditos extra para el nuevo usuario referido |
| `kpi_conversion_green` | `5` | % conversión freemium→pago umbral verde |
| `kpi_conversion_yellow` | `3` | % conversión umbral amarillo |
| `kpi_cac_green` | `5` | CAC USD umbral verde |
| `kpi_cac_yellow` | `15` | CAC USD umbral amarillo |
| `kpi_roas_green` | `2` | ROAS umbral verde |
| `kpi_roas_yellow` | `1` | ROAS umbral amarillo |
| `kpi_completion_green` | `60` | % completitud flujo umbral verde |
| `kpi_completion_yellow` | `40` | % completitud umbral amarillo |
| `kpi_retention_d7_green` | `15` | % retención D7 umbral verde |
| `kpi_retention_d7_yellow` | `8` | % retención D7 umbral amarillo |
| `kpi_api_cost_ratio_green` | `20` | % ratio costo API/revenue umbral verde |
| `kpi_api_cost_ratio_yellow` | `40` | % ratio umbral amarillo |

### `monthly_costs`

Costos de infraestructura que el admin ingresa manualmente cada mes.

```sql
CREATE TABLE monthly_costs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mes        DATE NOT NULL,         -- primer día del mes: '2026-06-01'
  servicio   TEXT NOT NULL,         -- 'Vercel', 'Supabase', 'ElevenLabs', etc.
  costo_usd  NUMERIC(10,2) NOT NULL,
  nota       TEXT
);
```

### `marketing_spend`

Gasto en marketing por canal y campaña.

```sql
CREATE TABLE marketing_spend (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mes        DATE NOT NULL,
  canal      TEXT NOT NULL,         -- 'Meta Ads', 'Influencer', 'TikTok', 'Orgánico'
  campana    TEXT,
  gasto_usd  NUMERIC(10,2) NOT NULL DEFAULT 0,
  nota       TEXT
);
```

### `api_usage_log`

Registrado automáticamente por `api/gemini.js` y `api/tts.js` en cada llamada.

```sql
CREATE TABLE api_usage_log (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT now(),
  user_id         UUID REFERENCES auth.users(id),
  proveedor       TEXT NOT NULL,    -- 'gemini' | 'elevenlabs'
  tokens_input    INTEGER,          -- solo Gemini
  tokens_output   INTEGER,          -- solo Gemini
  chars_sent      INTEGER,          -- solo ElevenLabs
  modelo          TEXT,             -- 'gemini-2.5-flash' | voice_id
  costo_usd_est   NUMERIC(10,6)     -- costo calculado al momento del log
);
```

**Tarifas usadas para `costo_usd_est`:**
- Gemini 2.5 Flash: $0.075/1M tokens input + $0.30/1M tokens output
- ElevenLabs: prorrateado desde el plan activo — valor configurable en `app_config` como `elevenlabs_cost_per_char` (default: $0.00022/char basado en plan Creator $22/100k chars)

---

## Vistas SQL

### Ingresos

**`v_revenue_summary`** — una fila, siempre actualizada:
- `total_revenue_usd`, `total_pagadores`, `ticket_promedio`, `paquete_mas_vendido`
- `revenue_hoy`, `revenue_este_mes`, `fees_paddle_usd` (5% del bruto)

**`v_daily_revenue`** — una fila por día (últimos 30 días):
- `fecha`, `transacciones`, `revenue_usd`, `nuevos_pagadores`

**`v_packages_breakdown`** — una fila por paquete:
- `paquete`, `unidades_vendidas`, `revenue_usd`, `porcentaje_del_total`

**`v_monthly_margin`** — una fila por mes:
- `mes`, `revenue_bruto`, `fees_paddle`, `costos_infra` (suma de `monthly_costs`), `costos_api` (suma de `api_usage_log`), `margen_neto`, `margen_pct`

**`v_api_costs`** — una fila por proveedor y mes:
- `mes`, `proveedor`, `llamadas`, `volumen` (tokens/chars), `tarifa`, `costo_usd`

### Comportamiento

**`v_funnel_metrics`** — una fila por etapa (mes actual):
- `etapa`, `usuarios`, `conversion_pct`, `drop_pct`
- Etapas: `session_started` → `revelation_viewed` → `unlock_modal_opened` → `reading_unlocked` → pago completado
- Fuente: tabla `mvp_events`

**`v_usage_by_language`** — una fila por idioma:
- `idioma`, `sesiones`, `tier_standard`, `tier_full`, `tier_premium`, `conversion_pct`

**`v_top_users`** — top 20 usuarios más activos:
- `email`, `creditos_actuales`, `consultas_totales`, `pagos_realizados`, `ultimo_acceso`

### Marketing y P&L

**`v_marketing_roi`** — una fila por canal y mes:
- `mes`, `canal`, `gasto_usd`, `nuevos_usuarios_mes`, `pagadores_mes`, `revenue_mes_usd`
- `cac_usd` = gasto_canal / pagadores_mes_total (prorrateo proporcional al gasto del canal)
- `roas` = revenue_mes × (gasto_canal / gasto_total_mes) / gasto_canal
- **Nota:** sin UTM tracking, la atribución por canal es proporcional al gasto, no exacta. Para atribución exacta se requiere agregar `utm_source` al flujo de registro en Sprint futuro

**`v_monthly_pnl`** — una fila por mes:
- `mes`, `revenue_bruto`, `fees_paddle`, `costos_infra`, `costos_api`, `gasto_marketing`, `margen_neto`, `roas_global`

### KPIs con semáforos

**`v_kpi_dashboard`** — una fila por KPI:
- `kpi`, `valor`, `umbral_verde`, `umbral_amarillo`, `estado` (`verde`/`amarillo`/`rojo`), `accion_recomendada`

Los umbrales se leen desde `app_config` (`kpi_*`). La columna `accion_recomendada` usa CASE para sugerir acciones concretas por estado:

| KPI en rojo | Acción recomendada |
|---|---|
| `roas < 1x` | Pausar ads pagados, enfocar en orgánico |
| `cac > $15` | Revisar copy y targeting de campañas |
| `conversion < 3%` | Revisar pricing o flujo de unlock |
| `completion < 40%` | Revisar UX del flujo de revelación |
| `retention_d7 < 8%` | Activar email de reactivación D5 |
| `api_cost_ratio > 40%` | Revisar prompts de Gemini, reducir output tokens |

---

## Cambios en el backend

### `api/credits.js`
- Al inicio del handler, hacer un `SELECT value FROM app_config WHERE key IN (...)` para obtener `CREDIT_COSTS` y bonos dinámicamente
- Cachear en una variable de módulo con timestamp: la primera invocación de la instancia serverless carga desde DB; las siguientes reusan el valor si tiene < 60s de antigüedad. Nota: al ser serverless, instancias distintas no comparten cache — esto es aceptable
- Si la query falla, usar los valores hardcodeados como fallback para garantizar disponibilidad

### `api/gemini.js`
- Al completar cada generación, insertar en `api_usage_log`:
  - `proveedor: 'gemini'`, `tokens_input`, `tokens_output`, `modelo`, `costo_usd_est`
- La respuesta de la Gemini API incluye `response.usageMetadata`

### `api/tts.js`
- Al enviar cada request a ElevenLabs, insertar en `api_usage_log`:
  - `proveedor: 'elevenlabs'`, `chars_sent` (longitud del texto), `modelo` (voice_id), `costo_usd_est`

---

## Flujo de uso del admin

1. Abre Supabase Dashboard → SQL Editor
2. Guarda queries frecuentes como "Snippets" con nombre (ej: "KPIs hoy", "Revenue mes")
3. Ejecuta `SELECT * FROM v_kpi_dashboard` → semáforos actualizados al instante
4. Si hay un KPI rojo → lee la acción recomendada → actúa
5. Cada mes: agrega filas en `monthly_costs` y `marketing_spend` con los gastos reales

---

## Seguridad

- Las vistas y tablas solo son accesibles con la `service_role_key` de Supabase (ya requerida por el backend)
- El acceso al Supabase Dashboard requiere credenciales del proyecto — no hay exposición pública
- La tabla `app_config` no tiene RLS habilitado (solo acceso admin), cambios de config requieren acceso al dashboard de Supabase

---

## Criterios de éxito

- El admin puede ejecutar `SELECT * FROM v_kpi_dashboard` y ver el estado actual en < 1 segundo
- Un cambio en `app_config` (ej: subir `credit_cost_consultation` de 40 a 50) se refleja en la app en el próximo request sin redeploy
- Los costos reales de Gemini y ElevenLabs del mes actual son visibles con precisión de ±5%
- El ROAS por canal de marketing es calculado automáticamente cruzando `marketing_spend` con `purchases`
