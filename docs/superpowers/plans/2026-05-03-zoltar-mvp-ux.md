# Zoltar MVP UX — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar el flujo de Zoltar para que sea 100% gratuito hasta la revelación, con desbloqueo opcional (Standard 40cr / Full 70cr), InviteWidget al final, y analytics en Supabase.

**Architecture:** Se reemplaza el boolean `readingPaid` por `consultTier (null|'standard'|'full')`. El portal es libre; el cobro ocurre al momento de revelar. Un nuevo componente `UnlockModal` centraliza las opciones de pago. `InviteWidget` aparece en la síntesis final. Analytics fire-and-forget vía `/api/analytics` → Supabase `mvp_events`.

**Tech Stack:** React (useState/useCallback), Supabase (JS client + SQL), Resend (email), Vercel serverless functions

---

## File Map

### New files
- `src/components/UnlockModal.jsx` — Modal de desbloqueo (Standard / Full / registro / compra)
- `src/components/InviteWidget.jsx` — Widget invitación (email + copy link + WhatsApp)
- `src/lib/analytics.js` — Helper `trackEvent` fire-and-forget
- `api/analytics.js` — Vercel serverless: inserta en `mvp_events`
- `api/send-invite.js` — Vercel serverless: envía email de invitación via Resend

### Modified files
- `src/App.jsx` — Todos los cambios de flujo, estados, y wiring de nuevos componentes

### Database (manual via Supabase dashboard SQL editor)
- Tabla `mvp_events` en Supabase

---

## Task 1: Supabase — Crear tabla `mvp_events`

**Files:**
- DB migration (run in Supabase SQL editor — no file to commit)

- [ ] **Step 1: Abrir Supabase SQL editor y ejecutar**

```sql
CREATE TABLE mvp_events (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event       text NOT NULL,
  user_id     uuid REFERENCES auth.users(id),
  properties  jsonb,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE mvp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow insert for all" ON mvp_events
  FOR INSERT WITH CHECK (true);
```

- [ ] **Step 2: Verificar que la tabla existe**

En Supabase → Table Editor → buscar `mvp_events`. Debe aparecer con 4 columnas.

---

## Task 2: Crear `api/analytics.js`

**Files:**
- Create: `api/analytics.js`

- [ ] **Step 1: Crear el archivo**

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { event, properties } = req.body;
  if (!event) return res.status(400).json({ error: 'event required' });

  let user_id = null;
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7);
    const { data } = await supabase.auth.getUser(token);
    user_id = data?.user?.id ?? null;
  }

  await supabase.from('mvp_events').insert({ event, user_id, properties });

  return res.status(200).json({ ok: true });
}
```

- [ ] **Step 2: Verificar que Vercel puede servir el endpoint**

```bash
curl -s -X POST http://localhost:3000/api/analytics \
  -H "Content-Type: application/json" \
  -d '{"event":"test","properties":{"test":true}}'
```

Respuesta esperada: `{"ok":true}`

- [ ] **Step 3: Commit**

```bash
git add api/analytics.js
git commit -m "feat: add analytics API endpoint for mvp_events"
```

---

## Task 3: Crear `src/lib/analytics.js`

**Files:**
- Create: `src/lib/analytics.js`

- [ ] **Step 1: Crear el helper**

```javascript
export async function trackEvent(event, properties = {}, session = null) {
  fetch('/api/analytics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {})
    },
    body: JSON.stringify({ event, properties })
  }).catch(() => {});
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/analytics.js
git commit -m "feat: add trackEvent analytics helper"
```

---

## Task 4: Reemplazar `readingPaid` → `consultTier` en App.jsx

**Files:**
- Modify: `src/App.jsx` (estado + todas las referencias)

El estado `readingPaid: boolean` se reemplaza por `consultTier: null | 'standard' | 'full'`.
Regla: `readingPaid === true` ↔ `consultTier !== null`.

- [ ] **Step 1: Cambiar la declaración de estado (línea 98)**

Reemplazar:
```javascript
const [readingPaid, setReadingPaid] = useState(false);
```
Por:
```javascript
const [consultTier, setConsultTier] = useState(null); // null | 'standard' | 'full'
const [showUnlockModal, setShowUnlockModal] = useState(false);
```

- [ ] **Step 2: Buscar y reemplazar todos los usos de `readingPaid` en el JSX**

En el bloque de renderizado, cada `readingPaid` cambia por `consultTier !== null`:

- Línea ~1354: `if (readingPaid) return fullText;` → `if (consultTier !== null) return fullText;`
- Línea ~1373: `{!readingPaid && revealedStage > 0 && (` → `{consultTier === null && revealedStage >= 1 && (`
- Línea ~1410: `{readingPaid && (` → `{consultTier !== null && (`
- Línea ~1510: `if (readingPaid) return interpretation.conclusionFinal;` → `if (consultTier !== null) return interpretation.conclusionFinal;`
- Línea ~1523: `if (readingPaid) return interpretation.mision_alma;` → `if (consultTier !== null) return interpretation.mision_alma;`
- Línea ~1535: `if (readingPaid) return interpretation.leccion_karmica;` → `if (consultTier !== null) return interpretation.leccion_karmica;`
- Línea ~1544: `{!readingPaid && (` → `{consultTier === null && (`
- Línea ~1572: `{readingPaid && (` → `{consultTier !== null && (`

- [ ] **Step 3: Actualizar `saveStateForPurchase` / `handlePostAuth` que usen `readingPaid`**

Buscar en App.jsx:
```bash
grep -n "readingPaid\|setReadingPaid" src/App.jsx
```

Para cada ocurrencia restante:
- `setReadingPaid(true)` → `setConsultTier('standard')` (o eliminar si el contexto desaparece)
- `setReadingPaid(false)` → `setConsultTier(null)`
- `readingPaid` como prop o en guardado de estado → usar `consultTier`

- [ ] **Step 4: Verificar que no quedan referencias**

```bash
grep -n "readingPaid" src/App.jsx
```

Output esperado: vacío (0 matches).

- [ ] **Step 5: Verificar que la app compila**

```bash
npm run build 2>&1 | tail -20
```

Output esperado: sin errores.

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "refactor: replace readingPaid boolean with consultTier state"
```

---

## Task 5: Liberar el portal de entrada (sin cobro)

**Files:**
- Modify: `src/App.jsx` — `handleEnterPortalGated` (línea ~342), `handleStart` (línea ~485)

- [ ] **Step 1: Simplificar `handleEnterPortalGated`**

Reemplazar el cuerpo completo (líneas 342-363) por:

```javascript
const handleEnterPortalGated = useCallback(() => {
  _doEnterPortal();
}, [_doEnterPortal]);
```

- [ ] **Step 2: Simplificar `handleStart` (líneas 485-520)**

Reemplazar el cuerpo completo por:

```javascript
const handleStart = async () => {
  setConsultTier(null);
  setIsFading(true);
  speakText(sessionTexts.askName, language);
  setTimeout(() => {
    setThresholdStep(1);
    setIsFading(false);
  }, Math.floor(Math.random() * 2000) + 3000);
};
```

- [ ] **Step 3: Verificar que `handleStartRevelation` también usa `setConsultTier(null)`**

En `handleStartRevelation` (línea ~613): reemplazar `setReadingPaid(false)` por `setConsultTier(null)` si aún está (debe haber sido removido en Task 4, verificar).

- [ ] **Step 4: Compilar y verificar**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: portal entry is free — remove credit gate from handleEnterPortalGated and handleStart"
```

---

## Task 6: Eliminar `handleReConsultation` y botón "Nueva consulta"

**Files:**
- Modify: `src/App.jsx` — eliminar función (líneas ~371-441) y botón en anchoring (~línea 1625)

- [ ] **Step 1: Eliminar la función `handleReConsultation`**

Borrar desde `// Re-consulta desde fase de anclaje...` hasta el cierre del `useCallback` que contiene `handleReConsultation` (aproximadamente líneas 370-441).

- [ ] **Step 2: Eliminar el botón "Nueva consulta" en el bloque `anchoring`**

Encontrar y borrar:

```jsx
<button
  className="start-button blinking-button action-button-reveal"
  onClick={handleReConsultation}
>
  {translations.ui.new_consultation}
  {authSession && <span style={{ fontSize: '0.7rem', opacity: 0.7, marginLeft: '8px' }}>(-40 💎)</span>}
</button>
```

- [ ] **Step 3: Eliminar el botón "Invitar amigos" redundante en anchoring**

Encontrar y borrar este bloque (el InviteWidget del Task 12 lo reemplaza):

```jsx
{authSession && referralCode && (
  <button
    style={{ background: 'transparent', border: '1px solid rgba(255,215,0,0.4)', borderRadius: '25px', padding: '8px 20px', color: '#ffd700', cursor: 'pointer', fontSize: '0.85rem' }}
    onClick={() => setShowReferralWidget(true)}
  >
    🌟 Invitar amigos y ganar créditos
  </button>
)}
```

- [ ] **Step 4: Compilar**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: remove re-consultation flow per MVP spec"
```

---

## Task 7: Crear `src/components/UnlockModal.jsx`

**Files:**
- Create: `src/components/UnlockModal.jsx`

- [ ] **Step 1: Crear el componente**

```jsx
import { CREDIT_COSTS } from '../lib/credits.js';

export default function UnlockModal({
  isOpen,
  onClose,
  onUnlock,
  authSession,
  credits,
  onShowAuth,
  onShowPurchase,
  language,
}) {
  if (!isOpen) return null;

  const canAffordStandard = (credits ?? 0) >= CREDIT_COSTS.consultation;
  const canAffordFull = (credits ?? 0) >= CREDIT_COSTS.ancestral_ritual;
  const isLoggedIn = !!authSession;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 9000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#14142b', border: '1px solid rgba(255,215,0,0.3)',
          borderRadius: '20px', padding: '28px 24px', width: '320px',
          textAlign: 'center', position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '12px', right: '16px',
            background: 'none', border: 'none', color: '#666',
            fontSize: '1.2rem', cursor: 'pointer',
          }}
        >
          ✕
        </button>

        <div style={{ fontSize: '1.6rem', marginBottom: '8px' }}>🔮</div>
        <h3 style={{ color: '#ffd700', margin: '0 0 4px', fontSize: '1rem' }}>
          Desbloquea tu lectura
        </h3>
        <p style={{ color: '#888', fontSize: '0.75rem', margin: '0 0 18px' }}>
          Revela las 3 cartas + síntesis final
        </p>

        {/* Tier buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          <button
            onClick={() => canAffordStandard ? onUnlock('standard') : onShowPurchase()}
            style={{
              background: 'rgba(255,215,0,0.08)', border: '1px solid #ffd700',
              borderRadius: '12px', padding: '12px', color: '#ffd700',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <strong style={{ display: 'block', marginBottom: '2px' }}>
              Estándar — {CREDIT_COSTS.consultation}💎
              {!canAffordStandard && isLoggedIn && (
                <span style={{ color: '#888', fontSize: '0.65rem', marginLeft: '6px' }}>
                  (tienes {credits ?? 0})
                </span>
              )}
            </strong>
            <span style={{ color: '#888', fontSize: '0.72rem' }}>
              Revelación completa · Profundizar a {CREDIT_COSTS.deepening}💎/carta
            </span>
          </button>

          <button
            onClick={() => canAffordFull ? onUnlock('full') : onShowPurchase()}
            style={{
              background: '#7c3aed', border: 'none', borderRadius: '12px',
              padding: '12px', color: '#fff', cursor: 'pointer',
              textAlign: 'left', position: 'relative',
            }}
          >
            <span style={{
              position: 'absolute', top: '-9px', right: '12px',
              background: '#ffd700', color: '#000', fontSize: '0.55rem',
              padding: '2px 8px', borderRadius: '8px', fontWeight: 700,
            }}>
              RECOMENDADO
            </span>
            <strong style={{ display: 'block', marginBottom: '2px' }}>
              Full — {CREDIT_COSTS.ancestral_ritual}💎
            </strong>
            <span style={{ color: '#c4b5fd', fontSize: '0.72rem' }}>
              Todo incluido · Profundización gratis en las 3 cartas
            </span>
          </button>
        </div>

        {/* Auth / purchase options */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px',
          display: 'flex', flexDirection: 'column', gap: '6px',
        }}>
          {!isLoggedIn && (
            <button
              onClick={onShowAuth}
              style={{
                background: 'none', border: 'none', color: '#a78bfa',
                cursor: 'pointer', fontSize: '0.75rem',
              }}
            >
              🎁 Registrarme y obtener 100💎 gratis
            </button>
          )}
          {!isLoggedIn && (
            <button
              onClick={onShowAuth}
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.72rem' }}
            >
              Ya tengo cuenta — iniciar sesión
            </button>
          )}
          {isLoggedIn && (
            <button
              onClick={onShowPurchase}
              style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.68rem' }}
            >
              💳 Comprar créditos
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar que compila**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/UnlockModal.jsx
git commit -m "feat: add UnlockModal component for Standard/Full tier selection"
```

---

## Task 8: Wiring UnlockModal en App.jsx — revelación

**Files:**
- Modify: `src/App.jsx`

Esto añade:
1. Import de `UnlockModal`
2. La función `handleUnlock(tier)` que reemplaza `handlePurchaseReading`
3. Restricción de audio al extracto cuando `consultTier === null`
4. Reemplazo del unlock-panel inline en la revelación por botón + UnlockModal

- [ ] **Step 1: Agregar import al inicio de App.jsx**

Junto a los otros imports de componentes:
```javascript
import UnlockModal from './components/UnlockModal.jsx';
```

- [ ] **Step 2: Agregar `handleUnlock` después de `handleStartRevelation` (~línea 643)**

```javascript
const handleUnlock = async (tier) => {
  if (!authSession) {
    setShowAuthModal(true);
    return;
  }

  const creditKey = tier === 'full' ? 'ancestral_ritual' : 'consultation';
  const cost = CREDIT_COSTS[creditKey];

  if ((credits ?? 0) < cost) {
    setPurchaseReason(`Necesitas ${cost} créditos. Tienes ${credits ?? 0}.`);
    setShowPurchaseModal(true);
    return;
  }

  setLoading(true);
  setVibe('karmic_red');
  speakText(sessionTexts.waitMsg, language);

  const resultDeduct = await deductCredits(authSession, creditKey);
  if (!resultDeduct.ok) {
    setLoading(false);
    setVibe('healing_blue');
    return;
  }
  setCredits(resultDeduct.credits);
  flashCredit(-cost);

  let newInterpretation = interpretation;

  if (tier === 'full') {
    const bdStr = birthDate.day ? `${birthDate.day}/${birthDate.month}/${birthDate.year}` : '';
    const userContext = {
      name: userName, birthDate: bdStr, reason: visitReason,
      preference: dichotomousChoice, tier: 'ancestral_ritual',
    };
    const result = await interpretCards(selectedCards, visitReason, null, userContext, language);
    newInterpretation = {
      ...result,
      decreto: result.decreto || translations.ui.default_decree,
      tarea_terrenal: result.tarea_terrenal || translations.ui.default_task,
    };
    setInterpretation(newInterpretation);
    setVibe(result.vibe || 'healing_blue');
  }

  setConsultTier(tier);
  setShowUnlockModal(false);
  setLoading(false);

  if (revealedStage > 0) {
    const fullText = Array.isArray(newInterpretation.narrativaAncestral)
      ? newInterpretation.narrativaAncestral[revealedStage - 1]
      : newInterpretation.narrativaAncestral;
    speakText(fullText, language, () => setCanProceed(true));
  }

  trackEvent('reading_unlocked', { tier, credits_spent: cost }, authSession);
};
```

- [ ] **Step 3: Importar `trackEvent` al inicio de App.jsx**

```javascript
import { trackEvent } from './lib/analytics.js';
```

- [ ] **Step 4: Restringir audio en `handleNextStage` (línea ~736-746)**

Reemplazar el bloque que calcula `textToRead` y llama a `speakText`:

```javascript
// ANTES:
setCanProceed(false);
speakText(prefix + textToRead, language, () => setCanProceed(true));

// DESPUÉS:
const audioText = consultTier !== null
  ? prefix + textToRead
  : prefix + textToRead.split('. ')[0] + '.';
setCanProceed(false);
speakText(audioText, language, () => setCanProceed(true));
```

- [ ] **Step 5: Reemplazar el unlock-panel inline en la revelación (~línea 1373)**

Reemplazar el bloque `{consultTier === null && revealedStage >= 1 && (` (el inline unlock-panel con los botones de pago) por:

```jsx
{consultTier === null && revealedStage >= 1 && (
  <div className="fade-in-text" style={{ textAlign: 'center', marginTop: '16px' }}>
    <p style={{ color: '#ffd700', fontSize: '0.8rem', marginBottom: '10px' }}>
      ✦ Primera revelación ✦
    </p>
    <button
      className="start-button blinking-button"
      style={{ fontSize: '0.82rem', padding: '10px 24px' }}
      onClick={() => {
        setShowUnlockModal(true);
        trackEvent('unlock_modal_opened', { is_guest: !authSession }, authSession);
      }}
    >
      🔓 Ver lectura completa
    </button>
  </div>
)}
```

- [ ] **Step 6: Agregar `<UnlockModal>` al final del JSX (antes de `</div>` final)**

Junto a `<AuthModal>` y `<PurchaseModal>` (~línea 1646):

```jsx
<UnlockModal
  isOpen={showUnlockModal}
  onClose={() => setShowUnlockModal(false)}
  onUnlock={handleUnlock}
  authSession={authSession}
  credits={credits}
  onShowAuth={() => { setShowUnlockModal(false); setShowAuthModal(true); }}
  onShowPurchase={() => { setShowUnlockModal(false); setShowPurchaseModal(true); }}
  language={language}
/>
```

- [ ] **Step 7: Compilar y verificar**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 8: Commit**

```bash
git add src/App.jsx
git commit -m "feat: wire UnlockModal in revelation phase and restrict audio to extracto for unpaid"
```

---

## Task 9: Wiring UnlockModal en anchoring (síntesis)

**Files:**
- Modify: `src/App.jsx` — bloque `phase === 'anchoring'`

- [ ] **Step 1: Reemplazar el unlock-panel en anchoring (~línea 1544)**

El bloque `{consultTier === null && (` con el `payment-options-grid` inline en anchoring → reemplazar por:

```jsx
{consultTier === null && (
  <div className="fade-in-text" style={{ textAlign: 'center', margin: '20px 0' }}>
    <p style={{ color: '#ffd700', fontSize: '0.85rem', marginBottom: '12px' }}>
      ✧ El Oráculo aguarda tu ofrenda para revelar la síntesis final ✧
    </p>
    <button
      className="start-button blinking-button"
      style={{ fontSize: '0.82rem', padding: '10px 24px' }}
      onClick={() => {
        setShowUnlockModal(true);
        trackEvent('unlock_modal_opened', { is_guest: !authSession }, authSession);
      }}
    >
      🔓 Ver lectura completa
    </button>
  </div>
)}
```

- [ ] **Step 2: Restringir audio de síntesis en `handleNextStage` bloque anchoring (~línea 769)**

El `speakText` que habla la síntesis completa:

```javascript
// ANTES:
speakText(
  `${translations.ui.great_synthesis.replace('{name}', userName)} ${finalSynthesis.conclusionFinal || ''} ...`,
  language
);

// DESPUÉS:
const synthText = consultTier !== null
  ? `${translations.ui.great_synthesis.replace('{name}', userName)} ${finalSynthesis.conclusionFinal || ''} ${translations.ui.healing_decree}: ${finalSynthesis.decreto || translations.ui.default_decree}. ${translations.ui.earthly_task}: ${finalSynthesis.tarea_terrenal || translations.ui.default_task}`
  : `${translations.ui.great_synthesis.replace('{name}', userName)} ${(finalSynthesis.conclusionFinal || '').split('. ')[0]}.`;
speakText(synthText, language);
```

**Nota:** `consultTier` dentro de `.then()` es capturado por closure. Usar `consultTier` directamente es correcto.

- [ ] **Step 3: Compilar y verificar**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: wire UnlockModal in anchoring phase and restrict synthesis audio for unpaid"
```

---

## Task 10: Actualizar `initDeepening` para tier Full (gratis)

**Files:**
- Modify: `src/App.jsx` — `initDeepening` (~línea 789)

- [ ] **Step 1: Modificar `initDeepening`**

Reemplazar el cuerpo de `initDeepening`:

```javascript
const initDeepening = async (cardId) => {
  // Full tier: deepening gratis
  if (consultTier === 'full') {
    setClarifications(prev => ({
      ...prev,
      [cardId]: { step: 'question', question: '', extraCard: null, extraResponse: '' }
    }));
    return;
  }

  if (supabase) {
    if (!authSession) {
      setPendingAction({ type: 'deepening', cardId });
      setShowAuthModal(true);
      return;
    }
    const cost = CREDIT_COSTS.deepening;
    const currentCredits = credits ?? 0;
    if (currentCredits < cost) {
      setPurchaseReason(`Necesitas ${cost} créditos para profundizar esta carta. Tienes ${currentCredits}.`);
      setShowPurchaseModal(true);
      return;
    }
    const result = await deductCredits(authSession, 'deepening');
    if (!result.ok) {
      if (result.error === 'insufficient_credits') {
        setPurchaseReason(`Créditos insuficientes para profundizar.`);
        setShowPurchaseModal(true);
      }
      return;
    }
    setCredits(result.credits);
    flashCredit(-CREDIT_COSTS.deepening);
  }

  setClarifications(prev => ({
    ...prev,
    [cardId]: { step: 'question', question: '', extraCard: null, extraResponse: '' }
  }));
};
```

- [ ] **Step 2: Actualizar el label del botón de deepening para ocultar precio en tier Full**

En el JSX del botón deepening (~línea 1414-1421):

```jsx
{!clarifications[selectedCards[revealedStage-1].id] ? (
  canProceed && (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      {consultTier === 'standard' && (
        <p style={{ color: 'rgba(255,215,0,0.55)', fontSize: '0.75rem', margin: 0, letterSpacing: '1px' }}>
          💎 {CREDIT_COSTS.deepening} {translations.ui.credits_label || 'créditos'}
        </p>
      )}
      {consultTier === 'full' && (
        <p style={{ color: 'rgba(167,139,250,0.7)', fontSize: '0.75rem', margin: 0, letterSpacing: '1px' }}>
          ✦ Profundización incluida
        </p>
      )}
      <button
        className="start-button blinking-button"
        style={{ fontSize: '0.8rem', padding: '8px 20px' }}
        onClick={() => initDeepening(selectedCards[revealedStage-1].id)}
      >
        {translations.ui.deepen_action || translations.ui.deepen}
      </button>
    </div>
  )
) : /* ... resto sin cambios */ }
```

- [ ] **Step 3: Compilar y verificar**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: deepening is free for Full tier, show correct credit label per tier"
```

---

## Task 11: Crear `api/send-invite.js`

**Files:**
- Create: `api/send-invite.js`

- [ ] **Step 1: Crear el endpoint**

```javascript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.APP_URL || 'https://zoltar.app';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { toEmail, referralCode, language = 'es' } = req.body;
  if (!toEmail) return res.status(400).json({ error: 'toEmail required' });

  const inviteLink = referralCode
    ? `${APP_URL}?ref=${referralCode}`
    : APP_URL;

  const subject = referralCode
    ? 'Te invito a descubrir Zoltar ✨'
    : 'Descubre Zoltar — el oráculo de vidas pasadas ✨';

  const html = referralCode
    ? `<p>Te invito a explorar tu lectura de cartas en Zoltar.</p>
       <p>Usa mi código <strong>${referralCode}</strong> al registrarte y recibe 25💎 extra.</p>
       <p><a href="${inviteLink}">Ir a Zoltar →</a></p>`
    : `<p>Descubrí Zoltar, el oráculo de vidas pasadas.</p>
       <p>La experiencia completa es gratuita hasta la revelación.</p>
       <p><a href="${inviteLink}">Ir a Zoltar →</a></p>`;

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM || 'Zoltar <noreply@zoltar.app>',
    to: toEmail,
    subject,
    html,
  });

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ ok: true });
}
```

- [ ] **Step 2: Verificar que el endpoint responde**

```bash
curl -s -X POST http://localhost:3000/api/send-invite \
  -H "Content-Type: application/json" \
  -d '{"toEmail":"test@example.com"}'
```

Respuesta esperada: `{"ok":true}` (o error de Resend si las credenciales son de test).

- [ ] **Step 3: Commit**

```bash
git add api/send-invite.js
git commit -m "feat: add send-invite API endpoint via Resend"
```

---

## Task 12: Crear `src/components/InviteWidget.jsx`

**Files:**
- Create: `src/components/InviteWidget.jsx`

- [ ] **Step 1: Crear el componente**

```jsx
import { useState } from 'react';

const APP_URL = 'https://zoltar.app';

export default function InviteWidget({ authSession, referralCode }) {
  const [email, setEmail] = useState('');
  const [emailState, setEmailState] = useState('idle'); // idle | sending | sent | error
  const [copied, setCopied] = useState(false);

  const inviteLink = referralCode ? `${APP_URL}?ref=${referralCode}` : APP_URL;

  const handleSendEmail = async () => {
    if (!email.trim()) return;
    setEmailState('sending');
    try {
      const res = await fetch('/api/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail: email, referralCode: referralCode || undefined }),
      });
      setEmailState(res.ok ? 'sent' : 'error');
    } catch {
      setEmailState('error');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const waText = referralCode
    ? `✨ Te invito a descubrir tu lectura en Zoltar. Usa mi código ${referralCode} para obtener 25💎 extra: ${inviteLink}`
    : `✨ Descubrí Zoltar, el oráculo de vidas pasadas. Pruébalo en: ${APP_URL}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`;

  return (
    <div style={{
      textAlign: 'center', padding: '18px 16px',
      border: '1px solid rgba(255,215,0,0.2)', borderRadius: '16px',
      background: 'rgba(255,215,0,0.04)', marginTop: '32px',
    }}>
      <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>🌟</div>

      {referralCode ? (
        <>
          <p style={{ color: '#ffd700', fontSize: '0.85rem', fontWeight: 700, margin: '0 0 4px' }}>
            Invita y gana 50💎 por registro
          </p>
          <p style={{ color: '#888', fontSize: '0.72rem', margin: '0 0 12px' }}>
            Tu invitado recibe 25💎 extra al registrarse
          </p>
          <div style={{
            background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.25)',
            borderRadius: '10px', padding: '10px', marginBottom: '14px',
          }}>
            <div style={{ color: '#888', fontSize: '0.62rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Tu código
            </div>
            <div style={{ color: '#ffd700', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '6px' }}>
              {referralCode}
            </div>
          </div>
        </>
      ) : (
        <>
          <p style={{ color: '#ffd700', fontSize: '0.85rem', fontWeight: 700, margin: '0 0 4px' }}>
            ¿Conoces a alguien que necesite esta lectura?
          </p>
          <p style={{ color: '#888', fontSize: '0.72rem', margin: '0 0 14px' }}>
            Comparte Zoltar con quienes más lo necesitan
          </p>
        </>
      )}

      {/* Email form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="correo@ejemplo.com"
          style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,215,0,0.2)',
            borderRadius: '8px', padding: '8px 10px', color: '#fff', fontSize: '0.75rem',
            outline: 'none',
          }}
        />
        <button
          onClick={handleSendEmail}
          disabled={emailState === 'sending' || emailState === 'sent'}
          style={{
            background: emailState === 'sent'
              ? 'linear-gradient(135deg,#16a34a,#15803d)'
              : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
            border: 'none', borderRadius: '8px', padding: '8px',
            color: '#fff', fontSize: '0.75rem', cursor: 'pointer',
          }}
        >
          {emailState === 'idle' && (referralCode ? '✉️ Enviar invitación personalizada' : '✉️ Enviar invitación')}
          {emailState === 'sending' && '⏳ Enviando...'}
          {emailState === 'sent' && '✅ ¡Enviado!'}
          {emailState === 'error' && '❌ Error — intenta de nuevo'}
        </button>
      </div>

      <div style={{ color: '#555', fontSize: '0.65rem', marginBottom: '10px' }}>
        — o comparte {referralCode ? 'tu link único' : 'directo'} —
      </div>

      {/* Share buttons */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <button
          onClick={handleCopyLink}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '8px', padding: '7px 14px', color: '#e0e0e0',
            fontSize: '0.72rem', cursor: 'pointer',
          }}
        >
          {copied ? '✅ Copiado' : '🔗 Copiar link'}
        </button>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: '#25D366', border: 'none', borderRadius: '8px',
            padding: '7px 14px', color: '#fff', fontSize: '0.72rem',
            cursor: 'pointer', textDecoration: 'none', display: 'flex',
            alignItems: 'center', gap: '5px',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WhatsApp
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Compilar**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/InviteWidget.jsx
git commit -m "feat: add InviteWidget component with email, copy link, and WhatsApp sharing"
```

---

## Task 13: Wiring InviteWidget en anchoring + analytics en puntos clave

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Importar `InviteWidget`**

```javascript
import InviteWidget from './components/InviteWidget.jsx';
```

- [ ] **Step 2: Agregar `<InviteWidget>` en el bloque anchoring**

Dentro del bloque `{!anchoringLoading && interpretation && (` en la fase anchoring, después del bloque de email síntesis y antes del cierre `</>`:

```jsx
<InviteWidget
  authSession={authSession}
  referralCode={referralCode || null}
/>
```

- [ ] **Step 3: Agregar `trackEvent('session_started')` en `handleSelectLanguage`**

Al final de `handleSelectLanguage`, después de `setLanguage(lang)`:

```javascript
trackEvent('session_started', { language: lang, is_guest: !authSession }, authSession);
```

- [ ] **Step 4: Agregar `trackEvent('revelation_viewed')` en `handleStartRevelation`**

Después de `setPhase('revelation')` (~línea 609):

```javascript
trackEvent('revelation_viewed', {
  cards: selectedCards.map(c => c.id),
  language,
  is_guest: !authSession,
}, authSession);
```

- [ ] **Step 5: Verificar que `trackEvent('reading_unlocked')` ya está en `handleUnlock` (Task 8)**

Confirmar que la llamada existe. No duplicar.

- [ ] **Step 6: Compilar final**

```bash
npm run build 2>&1 | tail -20
```

Output esperado: sin errores.

- [ ] **Step 7: Smoke test manual**

Abrir `http://localhost:3000` (con `vercel dev` corriendo):
1. Seleccionar idioma → flujo avanza gratis al portal
2. Pasar por Nombre/Fecha/Motivo/Cartas → llega a revelación sin pagar
3. Verificar que solo se muestra la primera oración, el resto difuminado
4. Verificar botón "🔓 Ver lectura completa"
5. Clickear → UnlockModal aparece con ambas opciones
6. Avanzar hasta síntesis → InviteWidget aparece al final

- [ ] **Step 8: Commit final**

```bash
git add src/App.jsx
git commit -m "feat: wire InviteWidget in anchoring phase and add analytics events throughout MVP flow"
```

---

## Self-Review — Spec Coverage

| Spec Section | Tarea(s) |
|---|---|
| 1. Flujo gratuito hasta revelación | Task 5 (liberar portal + handleStart) |
| 2. Revelación modo extracto + blur + audio restringido | Task 4 (consultTier), 8 (audio), 9 (anchoring audio) |
| 3. Modal de desbloqueo | Task 7 (UnlockModal), 8 (wiring revelación), 9 (wiring anchoring) |
| 4. Tiers Standard/Full | Task 4 (estado), 8 (handleUnlock), 10 (deepening gratis Full) |
| 5.1 Eliminar cobro portal | Task 5 |
| 5.2 `consultTier` state | Task 4 |
| 5.3 Audio restringido | Task 8 paso 4, Task 9 paso 2 |
| 5.4 `UnlockModal` component | Task 7 |
| 5.5 Botón desbloqueo en revelación | Task 8 paso 5 |
| 5.6 Deepening según tier | Task 10 |
| 5.7 Remover re-consulta | Task 6 |
| 6. InviteWidget | Task 12, Task 13 |
| 7. Analytics `mvp_events` | Task 1, 2, 3, 13 |
| 8. Archivos nuevos/modificados | Cubiertos en todas las tareas |
