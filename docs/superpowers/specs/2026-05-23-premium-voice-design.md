# Premium Voice Tier — Implementation Spec

**Goal:** Add a 100-credit Premium tier that bundles ElevenLabs voice narration (masculine/feminine choice), full card reading with deepening, and automatic synthesis email — on top of the existing 40cr Standard and 65cr Full tiers.

**Architecture:** New `'premium'` value added to the existing `consultTier` state; new `voiceProfile` state holds the voice choice. A `narrate()` helper in App.jsx dispatches to `speakPremium()` (ElevenLabs) or `speakText()` (Web Speech API) based on tier. Voice profiles are configured via Vercel env vars so IDs can be changed without code deploys.

**Tech Stack:** React + Vite (frontend), Vercel serverless (api/tts.js), ElevenLabs REST API v1, Web Speech API (fallback)

---

## Tier Structure

| Tier | Credits | Included |
|------|---------|----------|
| Standard | 40 cr | 3 main cards · Web Speech API voice |
| Full | 65 cr | 3 main cards + deepening · Web Speech API voice |
| Premium | 100 cr | 3 main cards + deepening + ElevenLabs voice (masculine/feminine) + automatic synthesis email |

---

## Files to Change

| File | Change |
|------|--------|
| `src/lib/credits.js` | Add `premium_ritual: 100` to `CREDIT_COSTS` |
| `api/tts.js` | Accept `voiceProfile` in body; map to voice ID via env vars; per-profile voice settings |
| `src/utils/speech.js` | Add `speakPremium(text, voiceProfile, onEnd)` function |
| `src/App.jsx` | Add `voiceProfile` state; add `narrate()` helper; update `handleUnlock`; auto-send email for premium; replace `speakText` calls in revelation/deepening/anchoring with `narrate` |
| `src/components/UnlockModal.jsx` | Add Premium tier option; add inline voice selection step (masculine/feminine) |
| `src/data/translations.js` | Add Premium tier labels and voice profile names in es/en/pt |

---

## Voice Profiles

### Environment Variables (Vercel Dashboard)

| Env Var | Default (fallback) | Description |
|---------|--------------------|-------------|
| `ELEVENLABS_API_KEY` | — (required) | ElevenLabs account API key |
| `ELEVENLABS_VOICE_ID_MALE` | `ErXwobaYiN019PkySvjV` (Antoni) | Masculine voice ID |
| `ELEVENLABS_VOICE_ID_FEMALE` | `EXAVITQu4vr4xnSDxMaL` (Bella) | Feminine voice ID |

### Voice Settings per Profile

**Masculine — "Energías del universo"**
```json
{ "stability": 0.72, "similarity_boost": 0.80, "style": 0.15, "use_speaker_boost": true }
```

**Feminine — "Espíritu ancestral"**
```json
{ "stability": 0.65, "similarity_boost": 0.85, "style": 0.20, "use_speaker_boost": true }
```

Both use `model_id: "eleven_multilingual_v2"`.

---

## Component: UnlockModal

### Tier Selection (step 1)

Three radio-style cards:
- **40 cr — Estándar:** 3 cartas · voz del sistema
- **65 cr — Completa:** + profundización · voz del sistema  
- **100 cr — Premium ✨:** + profundización + voz premium + email incluido

### Voice Selection (step 2 — only when Premium selected)

Appears inline below tier cards with a fade-in animation. Two selectable cards:

- **🌌 Masculina** — "Energías del universo" (Antoni/configurable)
- **🌸 Femenina** — "Espíritu ancestral" (Bella/configurable)

Confirm button is disabled until a voice is chosen. Selecting 40cr or 65cr hides this panel.

### State inside UnlockModal

```js
const [selectedTier, setSelectedTier]   = useState(null); // 'standard'|'full'|'premium'
const [selectedVoice, setSelectedVoice] = useState(null); // 'masculine'|'feminine'|null

const canConfirm = selectedTier !== null &&
  (selectedTier !== 'premium' || selectedVoice !== null);
```

---

## `api/tts.js` — Updated Handler

```js
export default async function handler(req, res) {
  const { text, voiceProfile } = req.body; // voiceProfile: 'masculine'|'feminine'|undefined

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing ElevenLabs API key' });

  const voiceMap = {
    masculine: process.env.ELEVENLABS_VOICE_ID_MALE   || 'ErXwobaYiN019PkySvjV',
    feminine:  process.env.ELEVENLABS_VOICE_ID_FEMALE || 'EXAVITQu4vr4xnSDxMaL',
  };
  const voiceId = voiceMap[voiceProfile] || voiceMap.masculine;

  const settingsMap = {
    masculine: { stability: 0.72, similarity_boost: 0.80, style: 0.15, use_speaker_boost: true },
    feminine:  { stability: 0.65, similarity_boost: 0.85, style: 0.20, use_speaker_boost: true },
  };
  const voice_settings = settingsMap[voiceProfile] || settingsMap.masculine;

  // ... fetch ElevenLabs stream, stream MP3 back (unchanged from current implementation)
}
```

---

## `speech.js` — `speakPremium`

```js
export const speakPremium = async (text, voiceProfile = 'masculine', onEnd = null) => {
  if (isMuted || !text) { if (onEnd) onEnd(); return; }

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceProfile }),
    });

    if (!res.ok) throw new Error('TTS API error');

    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => { URL.revokeObjectURL(url); if (onEnd) onEnd(); };
    audio.onerror = () => { URL.revokeObjectURL(url); if (onEnd) onEnd(); };
    await audio.play();
  } catch (e) {
    // Fallback to Web Speech API — experience continues uninterrupted
    console.warn('[speakPremium] ElevenLabs unavailable, falling back to speakText', e);
    speakText(text, 'es', onEnd);
  }
};
```

---

## `App.jsx` — Key Changes

### New state
```js
const [voiceProfile, setVoiceProfile] = useState(null); // null | 'masculine' | 'feminine'
```

### `narrate()` helper
```js
const narrate = useCallback((text, lang, onEnd) => {
  if (consultTier === 'premium' && voiceProfile)
    speakPremium(text, voiceProfile, onEnd);
  else
    speakText(text, lang, onEnd);
}, [consultTier, voiceProfile]);
```

### `handleUnlock` — premium branch
```js
case 'premium':
  deductCredits(authSession, 'premium_ritual');  // 100 cr
  setConsultTier('premium');
  setVoiceProfile(selectedVoice);                // from UnlockModal
  // deepening gratis (same as 'full')
  // email: triggered automatically in anchoring phase
```

### `speakText` replacements
Replace `speakText(narrativaAncestral[...], language, ...)` calls in:
- `handlePurchaseReading` (revelation narration)
- `handleUnlock` (post-unlock narration)
- `handleDeepening` (deepening narration)
- `anchoring` synthesis narration

...with `narrate(text, language, onEnd)`.

Threshold/synchrony/astral phase `speakText` calls are **not replaced** — they run before purchase and always use Web Speech API.

### Auto email for Premium (anchoring phase)
```js
// In the anchoring synthesis completion block:
if (consultTier === 'premium' && authSession) {
  handleSendSynthesis({ silent: true }); // no credit deduction, no user prompt
}
```

`handleSendSynthesis` gains a `silent` flag: when true, skips the 10cr deduction and shows only a subtle success/error toast.

---

## Translations (es / en / pt)

```js
// New keys in translations.js → ui object

// ES
premium_tier_name:    "Premium",
premium_tier_desc:    "Voz premium · Email incluido",
voice_masculine_name: "Masculina",
voice_masculine_desc: "Energías del universo",
voice_feminine_name:  "Femenina",
voice_feminine_desc:  "Espíritu ancestral",
choose_voice:         "Elige tu voz",
premium_voice_badge:  "Voz premium activa",

// EN
premium_tier_name:    "Premium",
premium_tier_desc:    "Premium voice · Email included",
voice_masculine_name: "Masculine",
voice_masculine_desc: "Universe energies",
voice_feminine_name:  "Feminine",
voice_feminine_desc:  "Ancestral spirit",
choose_voice:         "Choose your voice",
premium_voice_badge:  "Premium voice active",

// PT
premium_tier_name:    "Premium",
premium_tier_desc:    "Voz premium · Email incluído",
voice_masculine_name: "Masculina",
voice_masculine_desc: "Energias do universo",
voice_feminine_name:  "Feminina",
voice_feminine_desc:  "Espírito ancestral",
choose_voice:         "Escolha sua voz",
premium_voice_badge:  "Voz premium ativa",
```

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| `ELEVENLABS_API_KEY` missing | `speakPremium` falls back to `speakText`; toast: "Voz premium temporalmente no disponible" |
| ElevenLabs API returns error | Same fallback; experience not interrupted |
| Email send fails (premium auto-send) | Toast: "No se pudo enviar el email · [Reintentar]" — non-blocking |
| User selects Premium but has < 100cr | UnlockModal shows insufficient credits (same as existing behavior) |

---

## What Does NOT Change

- Tiers `null`, `'standard'`, `'full'` — unchanged behavior
- All threshold/synchrony/astral narration — always uses Web Speech API
- The `synthesis_email` cost of 10cr — still charged for Standard and Full tiers if user manually sends email
- `deepening` cost of 10cr — still charged for Standard tier; free for Full and Premium
