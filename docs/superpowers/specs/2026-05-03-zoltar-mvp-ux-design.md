# Zoltar MVP — Rediseño UX y Monetización
**Fecha:** 2026-05-03  
**Enfoque:** Cirugía mínima sobre código existente (Enfoque A)

---

## Contexto

Zoltar es una app de lectura de cartas del tarot con IA. El objetivo del MVP es capturar la experiencia completa de lectura online y validar la monetización por créditos. El cambio central es mover el cobro desde la entrada al portal hasta el momento de revelación, permitiendo que cualquier usuario (sin registro) experimente el flujo completo hasta ver un extracto de su lectura.

---

## 1. Flujo de Usuario

### Antes (modelo actual)
```
Idioma → Portal → [COBRO 40cr] → Nombre/Fecha/Motivo → Cartas → Revelación (completa)
```

### Después (MVP)
```
Idioma → Portal → Nombre/Fecha/Motivo → Cartas → Alineación astral → Revelación [EXTRACTO] → [DESBLOQUEO OPCIONAL] → Síntesis
```

**Toda la experiencia previa a la revelación es 100% gratuita y no requiere registro.**

---

## 2. Revelación — Modo Extracto (sin pago)

- Se muestra **solo la primera oración** de cada carta (split en primer `. `)
- El resto del texto tiene efecto `steamy-blur` (ya existe en el CSS)
- El **audio solo narra el extracto** — la llamada a `speakText` recibe únicamente la primera oración
- Botón "🔓 Ver lectura completa" aparece bajo el extracto
- Al clickear el botón → abre **Modal de Desbloqueo**
- La síntesis final aplica las mismas reglas: solo primera oración visible si no hay pago

---

## 3. Modal de Desbloqueo

Aparece centrado sobre la pantalla al presionar el botón. Contiene:

### Para usuarios sin créditos suficientes / guests:
```
🔮 Desbloquea tu lectura
Revela las 3 cartas + síntesis final

[ Estándar — 40💎 ]
  Revelación completa · Profundizar a 10💎/carta

[ Full — 70💎 ] ← RECOMENDADO
  Todo incluido · Profundización gratis en las 3 cartas

──────────────────────────────
🎁 Registrarme y obtener 100💎 gratis
   Ya tengo cuenta — iniciar sesión
   💳 Comprar créditos
```

### Para usuarios registrados con créditos suficientes:
- Mismo modal pero sin las opciones de registro/login
- Muestra saldo actual disponible

---

## 4. Tiers de Acceso

### `consultTier` — nuevo estado (reemplaza `readingPaid: boolean`)
| Valor | Significado |
|-------|-------------|
| `null` | Sin pago — solo extracto visible |
| `'standard'` | Pagó 40cr — revelación completa + deepening a 10cr/carta |
| `'full'` | Pagó 70cr — revelación completa + deepening gratis en las 3 cartas |

### Reglas por tier:

| Funcionalidad | Sin pago | Standard (40cr) | Full (70cr) |
|---|---|---|---|
| Extracto revelación | ✓ | ✓ | ✓ |
| Revelación completa | ✗ | ✓ | ✓ |
| Audio completo | ✗ | ✓ | ✓ |
| Profundizar carta | ✗ | 10cr/carta | Gratis (3 cartas) |
| Síntesis completa | ✗ | ✓ | ✓ |
| Email síntesis | ✗ | 10cr (requiere cuenta) | 10cr (requiere cuenta) |

**Un solo pago desbloquea revelación + síntesis.** No hay cobro adicional para la síntesis.

---

## 5. Cambios en el Código Existente

### 5.1 Eliminar cobro en portal entry
- `handleEnterPortalGated`: remover verificación de créditos y auth. El portal es libre.
- `handleStart`: remover `deductCredits` y lógica de cobro. Solo hace fade + navega al threshold.
- Eliminar `readingPaid` state → reemplazar por `consultTier` (`null | 'standard' | 'full'`).

### 5.2 Nuevo estado `consultTier`
```javascript
const [consultTier, setConsultTier] = useState(null); // null | 'standard' | 'full'
```
- Reemplaza todos los usos de `readingPaid` (boolean) por `consultTier !== null`
- Para reglas específicas de deepening: `consultTier === 'full'`

### 5.3 Audio restringido al extracto
En todas las llamadas a `speakText` dentro de la revelación, cuando `consultTier === null`:
```javascript
const textToSpeak = consultTier ? fullText : fullText.split('. ')[0] + '.';
speakText(textToSpeak, language, callback);
```

### 5.4 Nuevo componente `UnlockModal`
Archivo: `src/components/UnlockModal.jsx`

Props:
- `isOpen: boolean`
- `onClose: () => void`
- `onUnlock: (tier: 'standard' | 'full') => void`
- `authSession`
- `credits: number | null`
- `onShowAuth: () => void`
- `onShowPurchase: () => void`
- `language: string`

Lógica interna:
- Si `credits >= 40` → mostrar ambas opciones (Standard y Full si `credits >= 70`)
- Si `credits < 40` (o null) → mostrar opciones de registro/login/compra

### 5.5 Botón de desbloqueo en revelación
El botón aparece en cuanto el usuario ve el extracto de la primera carta (`revealedStage >= 1`), no al final de las 3. Reemplaza el `unlock-panel` inline actual por:
```jsx
{consultTier === null && revealedStage >= 1 && (
  <>
    <p className="extracto-label">✦ Primera revelación ✦</p>
    <button onClick={() => setShowUnlockModal(true)}>
      🔓 Ver lectura completa
    </button>
  </>
)}
```
El usuario puede seguir avanzando entre extractos de cartas (stage 1→2→3) sin pagar — el botón se mantiene visible en cada etapa. Lo mismo aplica en la síntesis (`phase === 'anchoring'`).

### 5.6 Lógica de deepening según tier
```javascript
// En initDeepening:
if (consultTier === 'full') {
  // No descontar créditos — profundización incluida
  setClarifications(prev => ({ ...prev, [cardId]: { step: 'question', ... } }));
  return;
}
// Si 'standard': cobrar 10cr como antes
```

### 5.7 Remover re-consulta
- Eliminar botón "Nueva consulta" de la fase anchoring
- Eliminar `handleReConsultation` y su lógica asociada

---

## 6. Widget de Invitación (nuevo componente)

Archivo: `src/components/InviteWidget.jsx`

**Aparece al final de la síntesis (fase `anchoring`) para todos los usuarios.**

### Guest (sin cuenta):
- Formulario email: input + botón "✉️ Enviar invitación"
  - Llama a `/api/send-invite` con email destino y link genérico
- Botón "🔗 Copiar link" → copia `https://zoltar.app` al clipboard
- Botón WhatsApp → `https://wa.me/?text=✨ Descubrí Zoltar, el oráculo de vidas pasadas. Pruébalo en: https://zoltar.app` (encoded)

### Usuario registrado:
- Muestra su código de referido
- Formulario email: input + botón "✉️ Enviar invitación personalizada"
  - Llama a `/api/send-invite` con email destino y link con `?ref=CODIGO`
- Botón "🔗 Copiar link" → copia link con `?ref=CODIGO`
- Botón WhatsApp → `https://wa.me/?text=✨ Te invito a descubrir tu lectura en Zoltar. Usa mi código XXXX para obtener 25💎 extra: https://zoltar.app?ref=XXXX` (encoded)

### API `/api/send-invite` (nuevo endpoint)
- Recibe: `{ toEmail, referralCode?, language }`
- Envía email de invitación via Resend (ya configurado)
- No requiere auth (funciona para guests)
- Registra evento analytics `invite_sent`

---

## 7. Analytics — Tabla `mvp_events` en Supabase

### Schema
```sql
CREATE TABLE mvp_events (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event       text NOT NULL,           -- nombre del evento
  user_id     uuid REFERENCES auth.users(id),  -- null para guests
  properties  jsonb,                   -- datos adicionales
  created_at  timestamptz DEFAULT now()
);
```

### Eventos a registrar

| Evento | Cuándo | Properties |
|--------|--------|------------|
| `session_started` | Usuario selecciona idioma | `{ language, is_guest }` |
| `revelation_viewed` | Fase revelación inicia | `{ cards: [id,id,id], language, is_guest }` |
| `unlock_modal_opened` | Usuario clickea "Ver lectura completa" | `{ is_guest }` |
| `reading_unlocked` | Pago exitoso | `{ tier: 'standard'|'full', credits_spent }` |
| `invite_sent` | Invitación enviada | `{ channel: 'email'|'whatsapp'|'link', has_referral_code }` |

### Helper `trackEvent`
Archivo: `src/lib/analytics.js`
```javascript
export async function trackEvent(event, properties = {}, session = null) {
  // Fire and forget — no bloquea el flujo del usuario
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
    body: JSON.stringify({ event, properties })
  }).catch(() => {}); // silencioso en caso de fallo
}
```

### API `/api/analytics` (nuevo endpoint)
- Recibe: `{ event, properties }`
- Inserta en `mvp_events`
- No requiere auth (acepta requests anónimos para guests)

---

## 8. Archivos a Crear / Modificar

### Nuevos archivos
- `src/components/UnlockModal.jsx` — modal de desbloqueo
- `src/components/InviteWidget.jsx` — widget de invitación
- `src/lib/analytics.js` — helper `trackEvent`
- `api/analytics.js` — endpoint Supabase analytics
- `api/send-invite.js` — endpoint email de invitación

### Archivos a modificar
- `src/App.jsx` — eliminar `readingPaid`, agregar `consultTier`, remover cobro en portal, integrar `UnlockModal` e `InviteWidget`, agregar `trackEvent` en puntos clave
- `src/lib/credits.js` — ajuste de costos si es necesario (sin cambios funcionales)

### Archivos a eliminar / simplificar
- Lógica de `handleReConsultation` en `App.jsx` (eliminar)
- Lógica de cobro en `handleEnterPortalGated` y `handleStart` (simplificar)

---

## 9. Fuera de Scope del MVP

- Dashboard de analytics con visualización (solo datos en tabla)
- Notificaciones push
- A/B testing
- Múltiples idiomas en emails de invitación (usar español por defecto)
- Límite de invitaciones por usuario
