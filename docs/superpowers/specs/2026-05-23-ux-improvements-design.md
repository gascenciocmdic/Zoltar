# UX Improvements — Zoltar Oracle
**Date:** 2026-05-23  
**Status:** Approved

## Overview
Seven targeted UX improvements to streamline the consultation flow, fix scroll bugs, and improve mobile experience.

---

## Change 1 — "Nueva consulta" preserves user data
**File:** `src/App.jsx` — `handleNewConsultation`

- Before `window.location.reload()`, save `{ userName, birthDate }` to `localStorage` key `zoltar_user`.
- On app mount (in `handleSelectLanguage` or a dedicated useEffect), load saved data.
- If saved `userName` + `birthDate` both exist: set state, then go directly to `thresholdStep = 3` (reason).
- If only `userName` saved: set state, go to `thresholdStep = 2` (birthdate).
- Saved language is NOT preserved — user always selects language first.

---

## Change 2 — Skip "Permitir" step after landing
**File:** `src/App.jsx` — `handleSelectLanguage`

- Remove the `portalEntrance` phase: `handleSelectLanguage` sets `phase = 'threshold'` and `thresholdStep = 1` directly (instead of going to `portalEntrance`).
- Remove the `threshold` step 0 render block (the greeting + "Permitir" button). `thresholdStep` starts at 1.
- The `portalEntrance` phase JSX can be removed entirely.
- `_doEnterPortal` and `handleEnterPortalGated` can be removed.
- Initial speech: `handleSelectLanguage` speaks `sessionTexts.greeting` but does NOT wait for it before showing step 1.

---

## Change 3 — Birth date optional
**File:** `src/App.jsx` — `thresholdStep === 2` render block + `handleGoToAstralAlignment`

- Add a "skip" button below the date inputs: translates to "Prefiero no indicar" (es), "Prefer not to say" (en), "Prefiro não informar" (pt).
- On skip: `setBirthDate({ day: '', month: '', year: '' })`, `setBirthNarrative(null)`, advance to step 3 (same fade logic as handleNextThreshold).
- `handleNextThreshold` at step 2: validation only runs if at least one field has content; if all are empty, allow advancing (treat as skip).
- `handleGoToAstralAlignment` (called when 3 cards selected): if `!birthDate.day`, skip `astral_alignment` phase and call `handleStartRevelation()` directly.
- New i18n keys: `skip_birth_date` in es/en/pt.

---

## Change 4 — Skip "Ir a las cartas" step
**File:** `src/App.jsx` — `handleNextThreshold`

- Remove `thresholdStep === 5` render block.
- In `handleNextThreshold`, when `thresholdStep === 4` (dichotomy), after validation: set `phase = 'synchrony'`, show synchrony popup, speak `call_p1` — no intermediate step 5.
- Step count: 0→removed, 1=name, 2=birthdate, 3=reason, 4=dichotomy → synchrony.

---

## Change 5 — Terms & Privacy scrollable
**File:** `src/components/legal/LegalLayout.jsx`

- Add `useEffect` on mount:
  ```js
  document.body.style.overflow = 'auto';
  document.body.style.height = 'auto';
  const root = document.getElementById('root');
  if (root) { root.style.height = 'auto'; root.style.overflowY = 'auto'; }
  ```
- Cleanup on unmount: revert to `hidden` / `100vh`.

---

## Change 6 — "Continuar" button sticky on mobile
**File:** `src/App.css` — `@media (max-width: 480px)` for `.fan-continue-outer`

- Add:
  ```css
  position: sticky;
  bottom: 16px;
  z-index: 100;
  background: rgba(5,5,5,0.7);
  backdrop-filter: blur(10px);
  border-radius: 50px;
  padding: 12px 20px;
  ```
- Same rule applies to deepening's `fan-continue-outer`.

---

## Change 7 — Scroll to top on card revelation
**File:** `src/App.jsx`

- Add `useEffect`:
  ```js
  useEffect(() => {
    if (phase === 'revelation' && revealedStage > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [revealedStage, phase]);
  ```

---

## i18n additions
**File:** `src/data/translations.js`

Add `skip_birth_date` key to `ui` object in es, en, and pt:
- es: `"Prefiero no indicar mi fecha de nacimiento"`
- en: `"Prefer not to share my birth date"`
- pt: `"Prefiro não informar minha data de nascimento"`

---

## Constraints
- No changes to API files.
- No changes to CSS class structure (only add rules/override existing).
- All changes must respect the light/dark theme.
- `birthNarrative` null handling already works in synthesis email — no API changes needed.
