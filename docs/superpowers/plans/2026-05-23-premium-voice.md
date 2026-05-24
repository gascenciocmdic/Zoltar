# Premium Voice Tier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 100-credit Premium tier that bundles ElevenLabs voice narration (masculine/feminine), full reading with deepening, and automatic synthesis email.

**Architecture:** New `'premium'` value for `consultTier`; new `voiceProfile` state; `narrate()` helper dispatches to `speakPremium()` (ElevenLabs via `/api/tts`) or `speakText()` (Web Speech) based on tier. UnlockModal gains a two-step flow: tier selection → voice selection (only for Premium). Email auto-sends silently when anchoring synthesis completes for Premium users.

**Tech Stack:** React 18, Vite, Vercel serverless (api/tts.js), ElevenLabs REST API v1 (`eleven_multilingual_v2`), Web Speech API (fallback)

---

## File Map

| File | Change |
|------|--------|
| `src/lib/credits.js` | Add `premium_ritual: 100` |
| `api/tts.js` | Accept `voiceProfile` body param; map to voice IDs via env vars |
| `src/utils/speech.js` | Export `speakPremium(text, voiceProfile, onEnd)` |
| `src/data/translations.js` | Add 8 new UI keys in es/en/pt |
| `src/components/UnlockModal.jsx` | Refactor to two-step selection + confirm; add Premium + voice selector |
| `src/App.jsx` | Add `voiceProfile` state; add `narrate()`; update `handleUnlock`; update `initDeepening`; auto-email for premium; replace `speakText` → `narrate` in reading phases |

---

## Task 1: Add `premium_ritual` credit cost

**Files:**
- Modify: `src/lib/credits.js:1-8`

- [ ] **Step 1: Add the new cost**

Open `src/lib/credits.js`. The current `CREDIT_COSTS` block (lines 1–8) is:

```js
export const CREDIT_COSTS = {
  consultation:    40,
  ancestral_ritual: 65,
  deepening:       10,
  reconsultation:  40,
  synthesis_email: 10,
};
```

Replace it with:

```js
export const CREDIT_COSTS = {
  consultation:     40,
  ancestral_ritual: 65,
  premium_ritual:  100,   // Full reading + ElevenLabs voice + auto email
  deepening:        10,
  reconsultation:   40,
  synthesis_email:  10,
};
```

- [ ] **Step 2: Verify the build still passes**

```bash
npm run build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/credits.js
git commit -m "feat(credits): add premium_ritual cost (100cr)"
```

---

## Task 2: Update `api/tts.js` to support voice profiles

**Files:**
- Modify: `api/tts.js` (full file replacement)

- [ ] **Step 1: Replace the entire file**

```js
export const maxDuration = 60;

const VOICE_IDS = {
  masculine: process.env.ELEVENLABS_VOICE_ID_MALE   || 'ErXwobaYiN019PkySvjV', // Antoni
  feminine:  process.env.ELEVENLABS_VOICE_ID_FEMALE || 'EXAVITQu4vr4xnSDxMaL', // Bella
};

const VOICE_SETTINGS = {
  masculine: { stability: 0.72, similarity_boost: 0.80, style: 0.15, use_speaker_boost: true },
  feminine:  { stability: 0.65, similarity_boost: 0.85, style: 0.20, use_speaker_boost: true },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text, voiceProfile } = req.body;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Falta la API Key de ElevenLabs.' });
  }

  const profile = voiceProfile === 'feminine' ? 'feminine' : 'masculine';
  const voiceId       = VOICE_IDS[profile];
  const voice_settings = VOICE_SETTINGS[profile];
  const modelId = 'eleven_multilingual_v2';

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({ text, model_id: modelId, voice_settings }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('ElevenLabs API Error:', errorData);
      return res.status(response.status).json(errorData);
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('Server TTS Error:', error);
    res.status(500).json({ error: 'Error interno conectando con ElevenLabs' });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add api/tts.js
git commit -m "feat(tts): support voiceProfile param (masculine/feminine) with env-var voice IDs"
```

---

## Task 3: Add `speakPremium` to speech.js

**Files:**
- Modify: `src/utils/speech.js`

- [ ] **Step 1: Add the export at the end of the file**

Open `src/utils/speech.js`. After the last function (`stopAmbient`), append:

```js
/**
 * Narra el texto usando ElevenLabs (voz premium).
 * Si la API falla, hace fallback a speakText silenciosamente.
 * @param {string} text
 * @param {'masculine'|'feminine'} voiceProfile
 * @param {Function|null} onEnd  Called when audio ends or on error
 */
export const speakPremium = async (text, voiceProfile = 'masculine', onEnd = null) => {
  if (isMuted || !text) {
    if (onEnd) onEnd();
    return;
  }

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceProfile }),
    });

    if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);

    const blob  = await res.blob();
    const url   = URL.createObjectURL(blob);
    const audio = new Audio(url);

    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (onEnd) onEnd();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      if (onEnd) onEnd();
    };

    await audio.play();
  } catch (e) {
    console.warn('[speakPremium] ElevenLabs unavailable, falling back to speakText:', e.message);
    speakText(text, 'es', onEnd);
  }
};
```

- [ ] **Step 2: Update the import line in App.jsx to include `speakPremium`**

In `src/App.jsx` line 8, change:

```js
import { initSpeech, toggleMute, speakText, stopSpeech, startAmbientMusic, stopAmbient } from './utils/speech';
```

to:

```js
import { initSpeech, toggleMute, speakText, speakPremium, stopSpeech, startAmbientMusic, stopAmbient } from './utils/speech';
```

- [ ] **Step 3: Verify the build passes**

```bash
npm run build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/utils/speech.js src/App.jsx
git commit -m "feat(speech): add speakPremium() with ElevenLabs + fallback to Web Speech"
```

---

## Task 4: Add translation keys for Premium tier

**Files:**
- Modify: `src/data/translations.js`

The `ui` object in each language (es/en/pt) needs 8 new keys. Add them right after `synthesis_error` in each language block.

- [ ] **Step 1: Add keys to the Spanish (`es`) block**

In `src/data/translations.js`, find line 15 (`synthesis_error: "Error al enviar, intenta de nuevo",`) and insert after it:

```js
      premium_tier_name:    "Premium",
      premium_tier_desc:    "Voz premium · Email incluido",
      voice_choose:         "Elige tu voz",
      voice_masculine_name: "Masculina",
      voice_masculine_desc: "Energías del universo",
      voice_feminine_name:  "Femenina",
      voice_feminine_desc:  "Espíritu ancestral",
      premium_voice_badge:  "✨ Voz premium activa",
      deepening_included:   "✦ Profundización incluida",
```

- [ ] **Step 2: Add keys to the English (`en`) block**

Find line 210 (`synthesis_error: "Error sending, please try again",`) and insert after it:

```js
      premium_tier_name:    "Premium",
      premium_tier_desc:    "Premium voice · Email included",
      voice_choose:         "Choose your voice",
      voice_masculine_name: "Masculine",
      voice_masculine_desc: "Universe energies",
      voice_feminine_name:  "Feminine",
      voice_feminine_desc:  "Ancestral spirit",
      premium_voice_badge:  "✨ Premium voice active",
      deepening_included:   "✦ Deepening included",
```

- [ ] **Step 3: Add keys to the Portuguese (`pt`) block**

Find line 407 (`synthesis_error: "Erro ao enviar, tente novamente",`) and insert after it:

```js
      premium_tier_name:    "Premium",
      premium_tier_desc:    "Voz premium · Email incluído",
      voice_choose:         "Escolha sua voz",
      voice_masculine_name: "Masculina",
      voice_masculine_desc: "Energias do universo",
      voice_feminine_name:  "Feminina",
      voice_feminine_desc:  "Espírito ancestral",
      premium_voice_badge:  "✨ Voz premium ativa",
      deepening_included:   "✦ Aprofundamento incluído",
```

- [ ] **Step 4: Verify the build passes**

```bash
npm run build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/data/translations.js
git commit -m "feat(i18n): add premium tier and voice profile translation keys (es/en/pt)"
```

---

## Task 5: Refactor UnlockModal with Premium tier + voice selector

**Files:**
- Modify: `src/components/UnlockModal.jsx` (full file replacement)

The modal becomes a two-step selection: pick tier → (if Premium) pick voice → confirm.
`onUnlock` is now called with `(tier, voiceProfile)` — `voiceProfile` is `null` for standard/full.

- [ ] **Step 1: Replace the entire file**

```jsx
import { useState } from 'react';
import { CREDIT_COSTS } from '../lib/credits.js';
import { useTheme } from '../lib/themeContext';

export default function UnlockModal({
  isOpen,
  onClose,
  onUnlock,
  authSession,
  credits,
  onShowAuth,
  onShowPurchase,
  translations,
}) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [selectedTier,  setSelectedTier]  = useState(null); // 'standard'|'full'|'premium'
  const [selectedVoice, setSelectedVoice] = useState(null); // 'masculine'|'feminine'

  if (!isOpen) return null;

  const canAffordStandard = (credits ?? 0) >= CREDIT_COSTS.consultation;
  const canAffordFull     = (credits ?? 0) >= CREDIT_COSTS.ancestral_ritual;
  const canAffordPremium  = (credits ?? 0) >= CREDIT_COSTS.premium_ritual;
  const isLoggedIn        = !!authSession;

  const canConfirm = selectedTier !== null &&
    (selectedTier !== 'premium' || selectedVoice !== null);

  const handleConfirm = () => {
    if (!isLoggedIn)    { onShowAuth(); return; }
    if (!canConfirm)    return;

    const costMap = { standard: 'canAffordStandard', full: 'canAffordFull', premium: 'canAffordPremium' };
    const affordMap = { standard: canAffordStandard, full: canAffordFull, premium: canAffordPremium };
    if (!affordMap[selectedTier]) { onShowPurchase(); return; }

    onUnlock(selectedTier, selectedVoice);
    setSelectedTier(null);
    setSelectedVoice(null);
  };

  // ── Styles ────────────────────────────────────────────────────────────
  const overlayBg  = isLight ? 'rgba(200,190,230,0.55)' : 'rgba(0,0,0,0.85)';
  const modalBg    = isLight ? 'linear-gradient(145deg, #faf8ff, #f0ecff)' : '#14142b';
  const modalBorder= isLight ? '1px solid rgba(124,111,160,0.3)' : '1px solid rgba(255,215,0,0.3)';
  const closeColor = isLight ? 'rgba(45,37,64,0.4)' : '#666';
  const titleColor = isLight ? '#b8860b' : '#ffd700';
  const subColor   = isLight ? 'rgba(45,37,64,0.55)' : '#888';
  const divColor   = isLight ? 'rgba(124,111,160,0.2)' : 'rgba(255,255,255,0.1)';
  const linkColor  = isLight ? '#7c6fa0' : '#a78bfa';
  const buyColor   = isLight ? 'rgba(45,37,64,0.3)' : '#555';

  const tierBtn = (tier, label, sub, recommended = false) => {
    const active   = selectedTier === tier;
    const costMap  = { standard: CREDIT_COSTS.consultation, full: CREDIT_COSTS.ancestral_ritual, premium: CREDIT_COSTS.premium_ritual };
    const cost     = costMap[tier];
    const affordMap= { standard: canAffordStandard, full: canAffordFull, premium: canAffordPremium };
    const affordable = affordMap[tier];

    const bg = active
      ? (tier === 'premium'
          ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
          : tier === 'full'
          ? (isLight ? 'linear-gradient(135deg,#7c6fa0,#5b8db8)' : '#7c3aed')
          : (isLight ? 'rgba(184,134,11,0.15)' : 'rgba(255,215,0,0.15)'))
      : (isLight ? 'rgba(184,134,11,0.05)' : 'rgba(255,255,255,0.03)');

    const border = active
      ? (tier === 'premium' ? '1px solid #a855f7' : tier === 'full' ? '1px solid #7c3aed' : `1px solid ${isLight ? '#b8860b' : '#ffd700'}`)
      : `1px solid ${isLight ? 'rgba(124,111,160,0.2)' : 'rgba(255,255,255,0.08)'}`;

    const textColor = active && (tier === 'premium' || tier === 'full') ? '#fff' : (isLight ? '#6b4e00' : '#ffd700');
    const descColor = active && (tier === 'premium' || tier === 'full') ? 'rgba(255,255,255,0.75)' : subColor;

    return (
      <button
        key={tier}
        onClick={() => {
          if (!isLoggedIn) { onShowAuth(); return; }
          if (!affordable) { onShowPurchase(); return; }
          setSelectedTier(tier);
          if (tier !== 'premium') setSelectedVoice(null);
        }}
        style={{
          background: bg, border, borderRadius: 12, padding: '11px 14px',
          color: textColor, cursor: 'pointer', textAlign: 'left',
          transition: 'all 0.2s', position: 'relative', width: '100%',
        }}
      >
        {recommended && (
          <span style={{
            position: 'absolute', top: -9, right: 12,
            background: isLight ? '#b8860b' : '#ffd700',
            color: isLight ? '#fff' : '#000',
            fontSize: '0.55rem', padding: '2px 8px',
            borderRadius: 8, fontWeight: 700,
          }}>RECOMENDADO</span>
        )}
        <strong style={{ display: 'block', marginBottom: 2, fontSize: '0.88rem' }}>
          {label} — {cost}💎
          {!affordable && isLoggedIn && (
            <span style={{ color: subColor, fontSize: '0.65rem', marginLeft: 6 }}>
              (tienes {credits ?? 0})
            </span>
          )}
        </strong>
        <span style={{ color: descColor, fontSize: '0.72rem' }}>{sub}</span>
      </button>
    );
  };

  const voiceCard = (voice, emoji, name, desc) => {
    const active = selectedVoice === voice;
    return (
      <button
        key={voice}
        onClick={() => setSelectedVoice(voice)}
        style={{
          flex: 1, background: active ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'rgba(255,255,255,0.04)',
          border: active ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10, padding: '10px 8px', cursor: 'pointer',
          color: active ? '#fff' : subColor,
          textAlign: 'center', transition: 'all 0.2s',
        }}
      >
        <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>{emoji}</div>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: 2 }}>{name}</div>
        <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>{desc}</div>
      </button>
    );
  };

  const ui = translations?.ui || {};

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: overlayBg,
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: modalBg, border: modalBorder,
          borderRadius: 20, padding: '28px 24px', width: 320,
          textAlign: 'center', position: 'relative',
          boxShadow: isLight
            ? '0 0 40px rgba(124,111,160,0.2), 0 20px 60px rgba(0,0,0,0.08)'
            : '0 20px 60px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => { onClose(); setSelectedTier(null); setSelectedVoice(null); }}
          style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', color: closeColor, fontSize: '1.2rem', cursor: 'pointer' }}
        >✕</button>

        <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>🔮</div>
        <h3 style={{ color: titleColor, margin: '0 0 4px', fontSize: '1rem' }}>
          Desbloquea tu lectura
        </h3>
        <p style={{ color: subColor, fontSize: '0.75rem', margin: '0 0 16px' }}>
          Revela las 3 cartas + síntesis final
        </p>

        {/* ── Tier selection ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {tierBtn('standard', 'Estándar', `Revelación completa · Profundizar a ${CREDIT_COSTS.deepening}💎/carta`)}
          {tierBtn('full',     'Full',     'Todo incluido · Profundización gratis en las 3 cartas', true)}
          {tierBtn('premium',  `${ui.premium_tier_name || 'Premium'} ✨`, `${ui.premium_tier_desc || 'Voz premium · Email incluido'} · Profundización gratis`)}
        </div>

        {/* ── Voice selection (only when Premium selected) ── */}
        {selectedTier === 'premium' && (
          <div style={{ marginBottom: 12, animation: 'fadeIn 0.3s ease' }}>
            <p style={{ color: subColor, fontSize: '0.72rem', margin: '0 0 8px' }}>
              {ui.voice_choose || 'Elige tu voz'}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {voiceCard('masculine', '🌌', ui.voice_masculine_name || 'Masculina', ui.voice_masculine_desc || 'Energías del universo')}
              {voiceCard('feminine',  '🌸', ui.voice_feminine_name  || 'Femenina',  ui.voice_feminine_desc  || 'Espíritu ancestral')}
            </div>
          </div>
        )}

        {/* ── Confirm button ── */}
        {selectedTier && (
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            style={{
              width: '100%', borderRadius: 12, padding: '11px 0',
              fontWeight: 700, fontSize: '0.85rem', cursor: canConfirm ? 'pointer' : 'not-allowed',
              marginBottom: 10, border: 'none',
              background: canConfirm
                ? (selectedTier === 'premium' ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : selectedTier === 'full' ? (isLight ? 'linear-gradient(135deg,#7c6fa0,#5b8db8)' : '#7c3aed') : (isLight ? '#b8860b' : '#ffd700'))
                : 'rgba(255,255,255,0.1)',
              color: canConfirm ? (selectedTier === 'standard' && !isLight ? '#000' : '#fff') : subColor,
              transition: 'all 0.2s',
            }}
          >
            Confirmar — {selectedTier === 'standard' ? CREDIT_COSTS.consultation : selectedTier === 'full' ? CREDIT_COSTS.ancestral_ritual : CREDIT_COSTS.premium_ritual}💎
          </button>
        )}

        {/* ── Footer links ── */}
        <div style={{ borderTop: `1px solid ${divColor}`, paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {!isLoggedIn && (
            <button onClick={onShowAuth} style={{ background: 'none', border: 'none', color: linkColor, cursor: 'pointer', fontSize: '0.75rem' }}>
              🎁 Registrarme y obtener 100💎 gratis
            </button>
          )}
          {!isLoggedIn && (
            <button onClick={onShowAuth} style={{ background: 'none', border: 'none', color: subColor, cursor: 'pointer', fontSize: '0.72rem' }}>
              Ya tengo cuenta — iniciar sesión
            </button>
          )}
          {isLoggedIn && (
            <button onClick={onShowPurchase} style={{ background: 'none', border: 'none', color: buyColor, cursor: 'pointer', fontSize: '0.68rem' }}>
              💳 Comprar créditos
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the build passes**

```bash
npm run build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/UnlockModal.jsx
git commit -m "feat(UnlockModal): add Premium tier + inline voice selector (masculine/feminine)"
```

---

## Task 6: Wire Premium tier into App.jsx

**Files:**
- Modify: `src/App.jsx`

This task has 5 sub-steps.

### 6a — Add `voiceProfile` state and `narrate()` helper

- [ ] **Step 1: Add `voiceProfile` state**

Find line 147:
```js
const [consultTier, setConsultTier] = useState(null); // null | 'standard' | 'full'
```

Replace with:
```js
const [consultTier,  setConsultTier]  = useState(null); // null | 'standard' | 'full' | 'premium'
const [voiceProfile, setVoiceProfile] = useState(null); // null | 'masculine' | 'feminine'
```

- [ ] **Step 2: Add `narrate()` helper**

Find the line with `const handleSendSynthesis = async () => {` (line ~440).
Insert the following block **immediately before** it:

```js
  /**
   * Dispatches narration to ElevenLabs (premium) or Web Speech API (all other tiers).
   * Drop-in replacement for speakText() inside reading phases.
   */
  const narrate = useCallback((text, lang, onEnd) => {
    if (consultTier === 'premium' && voiceProfile) {
      speakPremium(text, voiceProfile, onEnd);
    } else {
      speakText(text, lang, onEnd);
    }
  }, [consultTier, voiceProfile]);

```

- [ ] **Step 3: Update `handleSendSynthesis` to accept a `silent` flag**

The current `handleSendSynthesis` (line ~440) starts with:

```js
  const handleSendSynthesis = async () => {
    if (!authSession || synthEmailState !== 'idle') return;
    if ((credits ?? 0) < CREDIT_COSTS.synthesis_email) {
      setPurchaseReason(`Necesitas ${CREDIT_COSTS.synthesis_email} créditos para enviar la síntesis.`);
      setShowPurchaseModal(true);
      return;
    }
    setSynthEmailState('sending');
    try {
      const res = await fetch('/api/send-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authSession.access_token}` },
        body: JSON.stringify({ language, userName, selectedCards, interpretation, clarifications, birthNarrative }),
      });
      const data = await res.json();
      if (res.ok) {
        setCredits(data.credits);
        flashCredit(-CREDIT_COSTS.synthesis_email);
        setSynthEmailState('sent');
      } else if (data.error === 'insufficient_credits') {
        setPurchaseReason(`Créditos insuficientes. Necesitas ${CREDIT_COSTS.synthesis_email}.`);
        setShowPurchaseModal(true);
        setSynthEmailState('idle');
      } else {
        const detail = data.resend_error || data.error || 'Error desconocido';
        console.error('[synthesis email] API error:', data);
        showToast(`Error al enviar el correo: ${detail}`);
        if (data.credits !== undefined) setCredits(data.credits);
        setSynthEmailState('error');
      }
    } catch (e) {
      setSynthEmailState('error');
    }
  };
```

Replace the entire function with:

```js
  const handleSendSynthesis = async ({ silent = false } = {}) => {
    if (!authSession || synthEmailState !== 'idle') return;

    // For non-premium: check and deduct 10cr; for premium (silent): skip cost check
    if (!silent) {
      if ((credits ?? 0) < CREDIT_COSTS.synthesis_email) {
        setPurchaseReason(`Necesitas ${CREDIT_COSTS.synthesis_email} créditos para enviar la síntesis.`);
        setShowPurchaseModal(true);
        return;
      }
    }

    setSynthEmailState('sending');
    try {
      const res = await fetch('/api/send-synthesis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({
          language, userName, selectedCards, interpretation,
          clarifications, birthNarrative,
          skipCreditDeduction: silent,   // server will skip 10cr deduct if true
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (!silent) {
          setCredits(data.credits);
          flashCredit(-CREDIT_COSTS.synthesis_email);
        }
        setSynthEmailState('sent');
      } else if (data.error === 'insufficient_credits') {
        if (!silent) {
          setPurchaseReason(`Créditos insuficientes. Necesitas ${CREDIT_COSTS.synthesis_email}.`);
          setShowPurchaseModal(true);
        }
        setSynthEmailState('idle');
      } else {
        const detail = data.resend_error || data.error || 'Error desconocido';
        console.error('[synthesis email] API error:', data);
        if (!silent) showToast(`Error al enviar el correo: ${detail}`);
        else showToast('📧 No se pudo enviar el email de síntesis');
        if (data.credits !== undefined && !silent) setCredits(data.credits);
        setSynthEmailState('error');
      }
    } catch (e) {
      setSynthEmailState('error');
      if (silent) showToast('📧 No se pudo enviar el email de síntesis');
    }
  };
```

- [ ] **Step 4: Commit this sub-step**

```bash
git add src/App.jsx
git commit -m "feat(App): add voiceProfile state, narrate() helper, update handleSendSynthesis with silent flag"
```

### 6b — Update `handleUnlock` to handle `'premium'` tier

- [ ] **Step 5: Replace `handleUnlock`**

Find `const handleUnlock = async (tier) => {` (line ~831). Replace the entire function with:

```js
  const handleUnlock = async (tier, voiceProfileChoice = null) => {
    if (!authSession) {
      setPendingAction({ type: 'unlock', tier });
      setShowAuthModal(true);
      return;
    }

    const creditKeyMap = {
      standard: 'consultation',
      full:     'ancestral_ritual',
      premium:  'premium_ritual',
    };
    const creditKey = creditKeyMap[tier] || 'consultation';
    const cost = CREDIT_COSTS[creditKey];

    if ((credits ?? 0) < cost) {
      setPurchaseReason(`Necesitas ${cost} créditos. Tienes ${credits ?? 0}.`);
      setShowPurchaseModal(true);
      return;
    }

    setShowUnlockModal(false);
    setLoading(true);
    setVibe('karmic_red');
    speakText(sessionTexts.waitMsg, language);

    let resultDeduct;
    try {
      resultDeduct = await deductCredits(authSession, creditKey);
    } catch (e) {
      setLoading(false);
      setVibe('healing_blue');
      showToast(`Error al procesar el pago: ${e.message}`);
      return;
    }
    if (!resultDeduct.ok) {
      setLoading(false);
      setVibe('healing_blue');
      const errMsg = resultDeduct.error === 'insufficient_credits'
        ? `Créditos insuficientes (tienes ${resultDeduct.credits ?? 0}, necesitas ${cost}).`
        : `Error al descontar créditos: ${resultDeduct.error || 'desconocido'}`;
      showToast(errMsg);
      return;
    }
    setCredits(resultDeduct.credits);
    flashCredit(-cost);

    setConsultTier(tier);
    if (tier === 'premium') setVoiceProfile(voiceProfileChoice);
    setLoading(false);

    if (revealedStage > 0) {
      const fullText = Array.isArray(interpretation.narrativaAncestral)
        ? interpretation.narrativaAncestral[revealedStage - 1]
        : interpretation.narrativaAncestral;
      // Use premium voice immediately if premium tier
      if (tier === 'premium' && voiceProfileChoice) {
        speakPremium(fullText, voiceProfileChoice, () => setCanProceed(true));
      } else {
        speakText(fullText, language, () => setCanProceed(true));
      }
    }

    trackEvent('reading_unlocked', { tier, credits_spent: cost }, authSession);
  };
```

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "feat(App): update handleUnlock to support premium tier + voiceProfile"
```

### 6c — Update `initDeepening` to treat `'premium'` like `'full'`

- [ ] **Step 7: Update deepening free-tier check**

Find (line ~968):
```js
    if (consultTier === 'full') {
```

Replace with:
```js
    if (consultTier === 'full' || consultTier === 'premium') {
```

- [ ] **Step 8: Commit**

```bash
git add src/App.jsx
git commit -m "feat(App): deepening free for premium tier (same as full)"
```

### 6d — Replace `speakText` with `narrate` in reading phases

- [ ] **Step 9: Replace in `handlePurchaseReading` (line ~796)**

Find:
```js
        speakText(interpretation.narrativaAncestral[revealedStage - 1], language, () => setCanProceed(true));
```
Replace with:
```js
        narrate(interpretation.narrativaAncestral[revealedStage - 1], language, () => setCanProceed(true));
```

Also find (line ~822):
```js
      speakText(result.narrativaAncestral[revealedStage - 1], language, () => setCanProceed(true));
```
Replace with:
```js
      narrate(result.narrativaAncestral[revealedStage - 1], language, () => setCanProceed(true));
```

- [ ] **Step 10: Replace in `handleUnlock` post-unlock narration (line ~880)**

Find (inside the `if (revealedStage > 0)` block you just wrote in Task 6b — already uses `speakPremium` directly, so this is already done ✓).

- [ ] **Step 11: Replace in `handleNextStage` revelation narration (line ~924)**

Find:
```js
          setCanProceed(false);
          speakText(audioText, language, () => setCanProceed(true));
```
Replace with:
```js
          setCanProceed(false);
          narrate(audioText, language, () => setCanProceed(true));
```

- [ ] **Step 12: Replace in anchoring synthesis narration + add auto-email (line ~950)**

Find:
```js
            speakText(synthText, language);
          }, 500);
```
Replace with:
```js
            narrate(synthText, language);
            // Auto-send email for Premium tier (no credit deduction, no user action needed)
            if (consultTier === 'premium' && authSession) {
              handleSendSynthesis({ silent: true });
            }
          }, 500);
```

- [ ] **Step 13: Replace in deepening narration (lines ~1057 and ~1065)**

Find:
```js
        speakText(`${translations.ui.deepen_subtitle}. ${finalResponse}`, language);
```
Replace with:
```js
        narrate(`${translations.ui.deepen_subtitle}. ${finalResponse}`, language);
```

And find:
```js
        speakText(`${translations.ui.deepen_subtitle}. ${translations.ui.oracle_misfire}`, language);
```
Replace with:
```js
        narrate(`${translations.ui.deepen_subtitle}. ${translations.ui.oracle_misfire}`, language);
```

- [ ] **Step 14: Verify the build passes**

```bash
npm run build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 15: Commit**

```bash
git add src/App.jsx
git commit -m "feat(App): use narrate() for reading phases — ElevenLabs for premium, Web Speech for standard/full"
```

### 6e — Update JSX deepening badge for Premium tier

- [ ] **Step 16: Update deepening included badge**

Find (line ~1738):
```jsx
                                       {consultTier === 'full' && (
                                         <p style={{ color: 'rgba(167,139,250,0.7)', fontSize: '0.75rem', margin: 0, letterSpacing: '1px' }}>
                                           ✦ Profundización incluida
                                         </p>
                                       )}
```

Replace with:
```jsx
                                       {(consultTier === 'full' || consultTier === 'premium') && (
                                         <p style={{ color: 'rgba(167,139,250,0.7)', fontSize: '0.75rem', margin: 0, letterSpacing: '1px' }}>
                                           {translations.ui.deepening_included || '✦ Profundización incluida'}
                                         </p>
                                       )}
```

- [ ] **Step 17: Pass `translations` prop to `UnlockModal`**

Find the `<UnlockModal` JSX (line ~1981). It currently has these props:
```jsx
      <UnlockModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        onUnlock={handleUnlock}
        authSession={authSession}
        credits={credits}
        onShowAuth={() => { setShowUnlockModal(false); setShowAuthModal(true); }}
        onShowPurchase={() => { setShowUnlockModal(false); setShowPurchaseModal(true); }}
      />
```

Add `translations={translations}` as a prop:
```jsx
      <UnlockModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        onUnlock={handleUnlock}
        authSession={authSession}
        credits={credits}
        onShowAuth={() => { setShowUnlockModal(false); setShowAuthModal(true); }}
        onShowPurchase={() => { setShowUnlockModal(false); setShowPurchaseModal(true); }}
        translations={translations}
      />
```

- [ ] **Step 18: Verify the full build passes**

```bash
npm run build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 19: Commit**

```bash
git add src/App.jsx
git commit -m "feat(App): premium deepening badge, pass translations to UnlockModal"
```

---

## Task 7: Update `api/send-synthesis` to support `skipCreditDeduction`

**Files:**
- Modify: `api/send-synthesis.js`

- [ ] **Step 1: Check current file**

```bash
cat api/send-synthesis.js | head -40
```

Find where credits are deducted (look for `deductCredits` or direct Supabase credit update).

- [ ] **Step 2: Add `skipCreditDeduction` support**

Find the block that checks and deducts `synthesis_email` credits. It will look similar to:
```js
  // check credits
  const cost = CREDIT_COSTS.synthesis_email; // 10
  if (profile.credits < cost) {
    return res.status(402).json({ error: 'insufficient_credits' });
  }
  // deduct
  const newCredits = profile.credits - cost;
  await supabase.from('profiles').update({ credits: newCredits }).eq('id', userId);
```

Wrap the cost check and deduction with a guard:
```js
  const skipDeduction = req.body.skipCreditDeduction === true;
  const cost = CREDIT_COSTS.synthesis_email; // 10

  if (!skipDeduction) {
    if (profile.credits < cost) {
      return res.status(402).json({ error: 'insufficient_credits' });
    }
    const newCredits = profile.credits - cost;
    await supabase.from('profiles').update({ credits: newCredits }).eq('id', userId);
    // include updated credits in response
  }
```

Make sure the success response still returns `{ ok: true, credits: updatedCredits }` — for `skipDeduction === true`, return the unchanged credit balance.

- [ ] **Step 3: Verify the build passes**

```bash
npm run build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add api/send-synthesis.js
git commit -m "feat(send-synthesis): support skipCreditDeduction flag for Premium auto-send"
```

---

## Task 8: Set environment variables in Vercel

- [ ] **Step 1: Add `ELEVENLABS_API_KEY` in Vercel dashboard**

Go to https://vercel.com → Project Settings → Environment Variables.
Add for **Production + Preview + Development**:
- `ELEVENLABS_API_KEY` = your ElevenLabs API key

- [ ] **Step 2: (Optional) Add custom voice IDs**

If you want to use specific voices from your account instead of the defaults (Antoni / Bella), add:
- `ELEVENLABS_VOICE_ID_MALE`   = your masculine voice ID
- `ELEVENLABS_VOICE_ID_FEMALE` = your feminine voice ID

If left unset, Antoni (`ErXwobaYiN019PkySvjV`) and Bella (`EXAVITQu4vr4xnSDxMaL`) are used.

- [ ] **Step 3: Push all commits to trigger deploy**

```bash
git push origin main
```

---

## Task 9: End-to-end verification

- [ ] **Step 1: Test Standard tier (40cr) — no regression**

1. Start a new session, select cards, reach the UnlockModal
2. Select "Estándar" → confirm → verify 40cr deducted
3. Verify narration uses Web Speech API (no network call to /api/tts)
4. Verify deepening costs 10cr

- [ ] **Step 2: Test Full tier (65cr) — no regression**

1. Select "Full" → confirm → verify 65cr deducted
2. Verify deepening is free
3. Verify email send button still visible and costs 10cr

- [ ] **Step 3: Test Premium tier (100cr)**

1. Select "Premium ✨" → voice selector appears
2. Select "Masculina" → confirm button activates
3. Confirm → 100cr deducted, session starts with ElevenLabs narration
4. Verify audio plays (check Network tab: POST /api/tts returns 200 with audio/mpeg)
5. Reach anchoring phase → email sends automatically → toast or `synthEmailState === 'sent'`
6. Verify deepening is free

- [ ] **Step 4: Test Premium with "Femenina" voice**

Repeat Step 3 selecting "Femenina" — verify different voice plays.

- [ ] **Step 5: Test fallback behavior**

1. Temporarily remove `ELEVENLABS_API_KEY` from local `.env`
2. Buy Premium → narration should fall back to Web Speech API with console warning
3. Re-add the key

- [ ] **Step 6: Final push**

```bash
git push origin main
```

---

## Self-Review

**Spec coverage:**
- ✅ 3 tiers (40/65/100cr) — Tasks 1, 5, 6
- ✅ ElevenLabs masculine/feminine voices — Tasks 2, 3, 6b
- ✅ Deepening free for premium — Task 6c
- ✅ Auto email for premium — Task 6d step 12 + Task 7
- ✅ Standard/Full unaffected — `narrate()` dispatches to `speakText` for those tiers
- ✅ Fallback to Web Speech on ElevenLabs error — Task 3
- ✅ Voice IDs configurable via env vars — Task 2, 8
- ✅ Translations es/en/pt — Task 4

**Type consistency:**
- `tier` values: `'standard' | 'full' | 'premium'` — consistent across UnlockModal, handleUnlock, initDeepening, JSX badges
- `voiceProfile` values: `'masculine' | 'feminine'` — consistent across speakPremium, api/tts.js, voiceCard, setVoiceProfile
- `handleSendSynthesis({ silent: true })` — `silent` flag consistent in App.jsx and api/send-synthesis.js
