# UX Improvements — Zoltar Oracle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 7 targeted UX changes: streamline consultation flow, make birth date optional, fix legal page scroll, improve mobile card button, scroll-to-top on revelation.

**Architecture:** All changes are in the React frontend. `App.jsx` handles the flow logic, `translations.js` holds i18n strings, `LegalLayout.jsx` fixes scroll, `App.css` fixes mobile button. No backend changes.

**Tech Stack:** React 18, Vite, plain CSS, localStorage for user persistence.

---

## File Map

| File | Changes |
|------|---------|
| `src/data/translations.js` | Add `skip_birth_date` key to es/en/pt |
| `src/App.jsx` | Changes 1–4 and 7 (flow, localStorage, scroll) |
| `src/components/legal/LegalLayout.jsx` | Fix body overflow for scroll |
| `src/App.css` | Sticky "Continuar" button on mobile |

---

### Task 1: Add i18n keys for "skip birth date" option

**Files:**
- Modify: `src/data/translations.js`

- [ ] **Step 1: Add `skip_birth_date` to the `es.ui` object**

Open `src/data/translations.js`. In the `es: { ui: { ... } }` block, add after `birthdate_placeholder`:

```js
skip_birth_date: "Prefiero no indicar mi fecha de nacimiento",
```

- [ ] **Step 2: Add `skip_birth_date` to the `en.ui` object**

In the `en: { ui: { ... } }` block, add after `birthdate_placeholder`:

```js
skip_birth_date: "Prefer not to share my birth date",
```

- [ ] **Step 3: Add `skip_birth_date` to the `pt.ui` object**

In the `pt: { ui: { ... } }` block, add after `birthdate_placeholder`:

```js
skip_birth_date: "Prefiro não informar minha data de nascimento",
```

- [ ] **Step 4: Commit**

```bash
git add src/data/translations.js
git commit -m "feat: add skip_birth_date i18n key for es/en/pt"
```

---

### Task 2: Fix Terms & Privacy page scrolling

**Files:**
- Modify: `src/components/legal/LegalLayout.jsx`

- [ ] **Step 1: Import useEffect and add scroll fix**

Replace the content of `src/components/legal/LegalLayout.jsx` with:

```jsx
import { useEffect } from 'react';

export default function LegalLayout({ title, children }) {
  useEffect(() => {
    // The global CSS sets body overflow:hidden for the app canvas.
    // Legal pages are standalone routes that need normal scroll.
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    const root = document.getElementById('root');
    if (root) {
      root.style.height = 'auto';
      root.style.overflowY = 'auto';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
      if (root) {
        root.style.height = '';
        root.style.overflowY = '';
      }
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050505',
      color: '#d1d5db',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: 15,
      lineHeight: 1.75,
    }}>
      {/* Top bar */}
      <div style={{
        borderBottom: '1px solid #1f2937',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <a
          href="/"
          style={{
            color: '#ffd700',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.06em',
          }}
        >
          ← ZOLTAR
        </a>
        <span style={{ color: '#374151', fontSize: 13 }}>/</span>
        <span style={{ color: '#6b7280', fontSize: 13 }}>{title}</span>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: 740,
        margin: '0 auto',
        padding: '48px 24px 80px',
      }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 800,
          color: '#ffd700',
          marginBottom: 8,
          letterSpacing: '-0.01em',
        }}>
          {title}
        </h1>
        <div style={{ color: '#4b5563', fontSize: 13, marginBottom: 40 }}>
          Última actualización: 14 de mayo de 2026
        </div>
        {children}
      </div>
    </div>
  );
}

export function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{
        fontSize: 16,
        fontWeight: 700,
        color: '#e5e7eb',
        marginBottom: 10,
        paddingBottom: 6,
        borderBottom: '1px solid #1f2937',
      }}>
        {title}
      </h2>
      <div style={{ color: '#9ca3af' }}>{children}</div>
    </section>
  );
}
```

- [ ] **Step 2: Verify manually**

In dev server, navigate to `/terms` or `/privacy` and confirm the page scrolls normally.

- [ ] **Step 3: Commit**

```bash
git add src/components/legal/LegalLayout.jsx
git commit -m "fix: legal pages now scroll correctly by overriding body overflow"
```

---

### Task 3: Mobile — sticky "Continuar" button

**Files:**
- Modify: `src/App.css`

- [ ] **Step 1: Find the existing mobile rule for `.fan-continue-outer`**

In `src/App.css`, find `@media (max-width: 480px)` and the `.fan-continue-outer { padding: 10px 14px 2px; }` rule inside it.

- [ ] **Step 2: Replace it with sticky styles**

Change the existing `@media (max-width: 480px)` `.fan-continue-outer` rule from:
```css
.fan-continue-outer { padding: 10px 14px 2px; }
```
to:
```css
.fan-continue-outer {
  position: sticky;
  bottom: 16px;
  z-index: 100;
  background: rgba(5, 5, 5, 0.72);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 50px;
  padding: 12px 20px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.6);
  max-width: 280px;
}
```

Also find the `@media (max-width: 380px)` block and if it has `.fan-continue-outer { padding: 8px 10px 0; }`, replace it with:
```css
.fan-continue-outer {
  position: sticky;
  bottom: 12px;
  z-index: 100;
  background: rgba(5, 5, 5, 0.72);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 50px;
  padding: 10px 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.6);
  max-width: 240px;
}
```

- [ ] **Step 3: Verify manually on mobile viewport**

Open DevTools → toggle device toolbar → select iPhone SE or similar. Select 3 cards and verify the "Continuar" button is visible and sticky.

- [ ] **Step 4: Commit**

```bash
git add src/App.css
git commit -m "fix(mobile): make fan Continuar button sticky and always visible"
```

---

### Task 4: App.jsx — localStorage user persistence

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add a helper constant for the localStorage key**

Near the top of `App.jsx`, after the imports, add:

```js
const ZOLTAR_USER_KEY = 'zoltar_user';
```

- [ ] **Step 2: Update `handleNewConsultation` to save user data before reload**

Find `handleNewConsultation` (around line 1053):

```js
const handleNewConsultation = () => {
  stopSpeech();
  stopAmbient();
  window.location.reload();
};
```

Replace with:

```js
const handleNewConsultation = () => {
  stopSpeech();
  stopAmbient();
  // Persist user identity for next consultation (skips name + birth date steps)
  try {
    if (userName) {
      localStorage.setItem(ZOLTAR_USER_KEY, JSON.stringify({
        userName,
        birthDate: birthDate.day ? birthDate : null,
        birthNarrative: birthDate.day ? birthNarrative : null,
      }));
    }
  } catch (e) { /* storage not available */ }
  window.location.reload();
};
```

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: save user name/birthdate to localStorage on new consultation"
```

---

### Task 5: App.jsx — Skip "Permitir" step + load saved user data

**Files:**
- Modify: `src/App.jsx`

This task removes `portalEntrance` phase and threshold step 0, and loads saved user data.

- [ ] **Step 1: Update `handleSelectLanguage` to skip portalEntrance**

Find `handleSelectLanguage` (around line 486):

```js
const handleSelectLanguage = (lang) => {
  setLanguage(lang);
  setPhase('portalEntrance');
  setCanProceed(false);
  trackEvent('session_started', { language: lang, is_guest: !authSession }, authSession);
  const welcomeMsg = I18N[lang].greetings[Math.floor(Math.random() * I18N[lang].greetings.length)];
  speakText(welcomeMsg, lang, () => setCanProceed(true));
};
```

Replace with:

```js
const handleSelectLanguage = (lang) => {
  setLanguage(lang);
  trackEvent('session_started', { language: lang, is_guest: !authSession }, authSession);
  // Speak greeting as ambient — do NOT wait for it before advancing
  const welcomeMsg = I18N[lang].greetings[Math.floor(Math.random() * I18N[lang].greetings.length)];
  speakText(welcomeMsg, lang);

  // Load persisted user data (from a previous "Nueva consulta")
  let startStep = 1;
  try {
    const saved = JSON.parse(localStorage.getItem(ZOLTAR_USER_KEY) || 'null');
    if (saved?.userName) {
      setUserName(saved.userName);
      if (saved.birthDate?.day) {
        setBirthDate(saved.birthDate);
        if (saved.birthNarrative) setBirthNarrative(saved.birthNarrative);
        startStep = 3; // skip name + birthdate → go to reason
      } else {
        startStep = 2; // skip name only → go to birthdate
      }
    }
  } catch (e) { /* ignore */ }

  setPhase('threshold');
  setThresholdStep(startStep);
  setCanProceed(true);
};
```

- [ ] **Step 2: Remove `_doEnterPortal` and `handleEnterPortalGated`**

Find and delete both functions (approx lines 410–428):

```js
// Lógica interna de entrada al portal (sin gate)
const _doEnterPortal = useCallback(() => { ... }, [...]);

// Portal es libre — sin cobro ni verificación de créditos
const handleEnterPortalGated = useCallback(() => { ... }, [_doEnterPortal]);
```

Delete both.

- [ ] **Step 3: Remove the `portalEntrance` JSX block**

Find this block (around line 1109):

```jsx
) : phase === 'portalEntrance' ? (
  <div className="portal-entrance-content transparent-layer" ...>
    <p className="welcome-text">...</p>
    {canProceed && (
      <button ... onClick={handleEnterPortalGated}>
        {translations.ui.enter_portal}
      </button>
    )}
  </div>
) : null}
```

Delete it. The ternary chain before it ends at `): null}`.

- [ ] **Step 4: Remove threshold step 0 render block**

Find in the `{phase === 'threshold' && (...)}` block the `{thresholdStep === 0 && (...)}` render (around line 1194–1223):

```jsx
{thresholdStep === 0 && (
  <>
    <p className="welcome-text">...</p>
    {canProceed && (
      <div ...>
        ...
        <button ... onClick={handleStart}>{translations.ui.allow}</button>
      </div>
    )}
    <div style={{ marginTop: '30px' }}>
      <button ... onClick={() => setShowInfoPopup(true)}>
        {translations.ui.what_is_oracle}
      </button>
    </div>
  </>
)}
```

Delete this entire block. The "what is oracle" popup and `showInfoPopup` state can remain (used elsewhere) — just remove the trigger button.

- [ ] **Step 5: Update `handleStart` call site**

`handleStart` is now called from step 1 (name) indirectly via `handleNextThreshold`. But `handleStart` itself initiates the consultation cost logic. With the new flow, `handleStart` should be triggered when the user first enters the name step.

Find `handleNextThreshold` — the first thing it does at step 1 is validate name. We need `handleStart` to be called ONCE when entering the threshold, not on button click from step 0.

Call `handleStart()` inside `handleSelectLanguage`, right before `setPhase('threshold')`:

```js
// In handleSelectLanguage, just before setPhase('threshold'):
// Note: handleStart is async, but we don't await it — it sets loading state internally
handleStart();
```

Wait — actually `handleStart` sets `thresholdStep(1)` and transitions phase. That conflicts. Let me re-read `handleStart`:

```js
const handleStart = async () => {
  const cost = CREDIT_COSTS.consultation;
  if (authSession && (credits ?? 0) >= cost) {
    // deduct credits
    setConsultTier('standard');
  } else {
    setConsultTier(null);
  }
  setIsFading(true);
  speakText(sessionTexts.askName, language);
  setTimeout(() => {
    setThresholdStep(1);
    setIsFading(false);
  }, Math.floor(Math.random() * 2000) + 3000);
};
```

`handleStart` currently sets thresholdStep(1) with a 3-5s fade delay. This would override our `startStep`. We need to separate the "credit deduction" logic from the "navigate to step 1" logic.

Better approach: Extract credit handling from `handleStart` into a new helper called at the start of `handleSelectLanguage`:

```js
const handleSelectLanguage = (lang) => {
  setLanguage(lang);
  trackEvent('session_started', { language: lang, is_guest: !authSession }, authSession);
  speakText(I18N[lang].greetings[Math.floor(Math.random() * I18N[lang].greetings.length)], lang);

  // Handle credit deduction (previously done in handleStart step 0)
  const cost = CREDIT_COSTS.consultation;
  if (authSession && (credits ?? 0) >= cost) {
    deductCredits(authSession, 'consultation').then(result => {
      if (result.ok) {
        setCredits(result.credits);
        flashCredit(-cost);
        setConsultTier('standard');
      } else {
        setConsultTier(null);
      }
    }).catch(() => setConsultTier(null));
  } else {
    setConsultTier(null);
  }

  // Load saved user data
  let startStep = 1;
  try {
    const saved = JSON.parse(localStorage.getItem(ZOLTAR_USER_KEY) || 'null');
    if (saved?.userName) {
      setUserName(saved.userName);
      if (saved.birthDate?.day) {
        setBirthDate(saved.birthDate);
        if (saved.birthNarrative) setBirthNarrative(saved.birthNarrative);
        startStep = 3;
      } else {
        startStep = 2;
      }
    }
  } catch (e) { /* ignore */ }

  setPhase('threshold');
  setThresholdStep(startStep);
  setCanProceed(true);
};
```

And `handleStart` can be kept for reference but is no longer called anywhere (or deleted).

- [ ] **Step 6: Delete `handleStart` function**

`handleStart` (approx lines 495–531) is no longer needed. Delete it entirely.

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx
git commit -m "feat: skip 'Permitir' step — go directly to name input after language selection"
```

---

### Task 6: App.jsx — Birth date optional

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Update `handleNextThreshold` to allow skipping birth date**

Find `handleNextThreshold` (around line 533). The step 2 validation block:

```js
if (thresholdStep === 2) {
  const { day, month, year } = birthDate;
  if (!day || !month || !year) { showToast(...); return; }
  ...
}
```

Change it so that if ALL three fields are empty, it skips validation and advances (treating it as a deliberate skip). The new logic:

```js
if (thresholdStep === 2) {
  const { day, month, year } = birthDate;
  const hasAnyField = day || month || year;
  if (hasAnyField) {
    // Partially filled — validate fully
    if (!day || !month || !year) {
      showToast(translations.ui.birthdate_placeholder || 'Ingresa tu fecha de nacimiento completa', 'warning');
      return;
    }
    const d = Number(day), m = Number(month), y = Number(year);
    if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > new Date().getFullYear()) {
      showToast('Fecha inválida. Verifica día (1-31), mes (1-12) y año.', 'warning');
      return;
    }
    // Valid date — generate narrative
    const narrative = generateBirthNarrative(d, m, y, language);
    setBirthNarrative(narrative);
  }
  // If all fields empty (skipped): leave birthDate = {} and birthNarrative = null — valid
}
```

- [ ] **Step 2: Add a skip handler function**

After `handleNextThreshold`, add:

```js
const handleSkipBirthDate = () => {
  setBirthDate({ day: '', month: '', year: '' });
  setBirthNarrative(null);
  setIsFading(true);
  setCanProceed(false);
  speakText(
    (I18N[language]?.sessionTexts?.askReason || '').replace('{name}', userName),
    language,
    () => setCanProceed(true)
  );
  setTimeout(() => {
    setThresholdStep(3);
    setIsFading(false);
  }, Math.floor(Math.random() * 2000) + 3000);
};
```

- [ ] **Step 3: Add skip button to the birth date UI block**

Find `{thresholdStep === 2 && (...)}` (around line 1239). After the existing "Continuar" button, add:

```jsx
<button
  onClick={handleSkipBirthDate}
  style={{
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,215,0,0.45)',
    fontSize: '0.8rem',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontStyle: 'italic',
    letterSpacing: '0.5px',
    marginTop: '8px',
    fontFamily: 'inherit',
  }}
  onMouseEnter={(e) => { e.target.style.color = 'rgba(255,215,0,0.75)'; }}
  onMouseLeave={(e) => { e.target.style.color = 'rgba(255,215,0,0.45)'; }}
>
  {translations.ui.skip_birth_date}
</button>
```

- [ ] **Step 4: Update `handleGoToAstralAlignment` to skip astral phase when no birth date**

Find `handleGoToAstralAlignment` (around line 667). At the very start of the function body, add:

```js
const handleGoToAstralAlignment = async () => {
  // If user skipped birth date → skip astral alignment entirely
  if (!birthDate.day) {
    handleStartRevelation();
    return;
  }
  // ... existing code continues unchanged
  setLoading(true);
  ...
};
```

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: birth date is now optional — skip goes directly to revelation"
```

---

### Task 7: App.jsx — Remove "Ir a las cartas" step

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Update `handleNextThreshold` to advance from step 4 directly to synchrony**

Find in `handleNextThreshold` the section that handles advancing after validation. The step logic currently reads:

```js
setTimeout(() => {
  if (thresholdStep < 5) {
    setThresholdStep(thresholdStep + 1);
  } else {
    setPhase('synchrony');
    setVibe('revelation_gold');
    setShowSynchronyPopup(true);
    setCanProceed(false);
    speakText(translations.ui.call_p1.replace(/"/g, ''), language, () => setCanProceed(true));
  }
  setIsFading(false);
}, Math.floor(Math.random() * 2000) + 3000);
```

Change `thresholdStep < 5` to `thresholdStep < 4`:

```js
setTimeout(() => {
  if (thresholdStep < 4) {
    setThresholdStep(thresholdStep + 1);
  } else {
    // After dichotomy (step 4), go directly to synchrony — skip step 5
    setPhase('synchrony');
    setVibe('revelation_gold');
    setShowSynchronyPopup(true);
    setCanProceed(false);
    speakText(translations.ui.call_p1.replace(/"/g, ''), language, () => setCanProceed(true));
  }
  setIsFading(false);
}, Math.floor(Math.random() * 2000) + 3000);
```

- [ ] **Step 2: Remove the `thresholdStep === 5` render block**

Find in the `{phase === 'threshold' && (...)}` JSX the block:

```jsx
{thresholdStep === 5 && (
  <>
    <p className="welcome-text">
      <TypewriterText text={`"${sessionTexts.askQuestion}"`} speed={45} />
    </p>
    <button className="start-button" onClick={handleNextThreshold} style={{ marginTop: '2rem' }}>
      {translations.ui.choose_cards}
    </button>
  </>
)}
```

Delete this entire block.

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: remove 'Ir a las cartas' step — dichotomy goes directly to card synchrony"
```

---

### Task 8: App.jsx — Scroll to top on revelation stage change

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add scroll-to-top useEffect**

In `App.jsx`, after the existing `useEffect` blocks (around line 206), add:

```js
// Scroll to top when a new card revelation stage begins
useEffect(() => {
  if (phase === 'revelation' && revealedStage > 0) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}, [revealedStage, phase]);
```

- [ ] **Step 2: Commit**

```bash
git add src/App.jsx
git commit -m "feat: scroll to top when a new card revelation is shown"
```

---

### Task 9: Deploy to production

- [ ] **Step 1: Push to GitHub**

```bash
git push
```

Vercel auto-deploys on push. Wait ~30s for build to complete.

- [ ] **Step 2: Smoke-test on production**

1. Open `https://www.cosmic-guidance.com`
2. Select language → confirm you land on name input (no "Permitir" button)
3. Enter name → birth date step → click "Prefiero no indicar" → confirm goes to reason
4. Complete reason + dichotomy → confirm goes directly to synchrony/cards (no "Elegir Cartas" button)
5. Select 3 cards → confirm goes directly to revelation (no astral chart since no birth date)
6. At anchoring → click "Nueva consulta" → select language → confirm name/date are pre-filled and you land on step 3
7. Open `/terms` and `/privacy` → confirm scrolling works
8. On mobile: select 3 cards → confirm "Continuar" button is sticky and visible
9. In revelation: click "Continuar al siguiente misterio" → confirm page scrolls to top

---

## Self-Review

**Spec coverage check:**
- ✅ Change 1 (localStorage): Task 4 + Task 5
- ✅ Change 2 (skip Permitir): Task 5
- ✅ Change 3 (birth date optional): Tasks 1 + 6
- ✅ Change 4 (skip "ir a las cartas"): Task 7
- ✅ Change 5 (terms scroll): Task 2
- ✅ Change 6 (mobile button): Task 3
- ✅ Change 7 (scroll to top): Task 8

**Placeholder scan:** No TBDs or "similar to" references found.

**Type consistency:**
- `ZOLTAR_USER_KEY` defined in Task 4, used in Task 5 ✅
- `handleSkipBirthDate` defined and used in Task 6 ✅
- `translations.ui.skip_birth_date` added in Task 1, referenced in Task 6 ✅
- `birthDate.day` used consistently as the "has birth date" check ✅

**Note on Task 5 / handleStart removal:** `handleStart` contains credit deduction logic that is being inlined into `handleSelectLanguage`. The old `handleStart` set `thresholdStep(1)` inside a 3-5s timeout — that behavior is intentionally removed. Credit deduction now happens asynchronously (fire-and-forget) without blocking the UI.
