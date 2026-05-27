# UI/UX Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Apply 9 UI/UX improvements to the Zoltar tarot app: remove duplicate astral text, replace Truth/Whisper buttons with a toggle switch, improve card-selection subtitle visibility, restyle message bubbles, fix mesa image clipping, show card names in revelation (en/pt), fix mobile deepening overflow, add language flags + voice/tier pre-selection on landing, and improve the landing AI copy.

**Architecture:** All changes are frontend-only (React + CSS). No new components are created; existing components are refined. The most complex change is the Landing refactor (multi-step onboarding before entering the oracle flow). App.jsx receives the pre-selected `{ language, tier, voiceProfile }` from LandingScreen and handles the premium login gate.

**Tech Stack:** React 18 + Vite, inline styles + App.css (CSS Modules not used — global classes), LandingScreen.jsx is a self-contained presentational component.

---

## File Map

| File | Tasks |
|------|-------|
| `src/App.jsx` | T1, T6, T9 |
| `src/App.css` | T2-CSS, T3, T4, T5, T7 |
| `src/components/LandingScreen.jsx` | T8, T9 |

---

### Task 1: Remove birthNarrative text in astral_alignment (fix duplicate text)

> **Context:** The `astral_alignment` phase (shown right before revelation) renders two text blocks: a `birthNarrative.narrative` bubble and an `introspectionMessage` bubble. The user sees these as "two texts / duplicated content before revelation". Fix: hide the long narrative text from the birthNarrative bubble; keep only the zodiac header row (symbol + sign + element + ruler) and the `introspectionMessage`.

**Files:**
- Modify: `src/App.jsx` (around line 1558–1570)

- [x] **Step 1: Find the birthNarrative narrative bubble in astral_alignment**

In `src/App.jsx`, find this block (approx. lines 1558–1570):

```jsx
{birthNarrative && (
  <div className="narrative-container" style={{ margin: '0 auto 10px auto', maxWidth: '620px' }}>
    <div className="brain-bubble narrative fade-in-text astral-bubble" style={{ borderLeftColor: '#a78bfa', background: 'linear-gradient(135deg,rgba(124,58,237,0.08),rgba(20,22,28,0))' }}>
      <p className="narrative-meta" style={{ color: '#c084fc', fontSize: '0.78rem', marginBottom: '8px', letterSpacing: '1px' }}>
        ✦ {birthNarrative.element} · {birthNarrative.ruler} ✦
      </p>
      <p style={{ fontStyle: 'italic', lineHeight: '1.7', color: '#e5e4e7', margin: 0, fontSize: '0.93rem' }}>
        <span className="reveal-text">{birthNarrative.narrative}</span>
      </p>
    </div>
  </div>
)}
```

- [x] **Step 2: Remove only the narrative `<p>`, keep the meta header**

Replace the entire block above with a slim header-only version. The `narrative-container` wrapper and bubble are removed; only a small inline header remains so the zodiac sign/element isn't completely lost:

```jsx
{birthNarrative && (
  <p className="narrative-meta fade-in-text" style={{
    color: '#c084fc', fontSize: '0.78rem', letterSpacing: '1px',
    textAlign: 'center', margin: '4px 0 12px',
  }}>
    {birthNarrative.symbol} {birthNarrative.sign} · {birthNarrative.element} · {birthNarrative.ruler}
  </p>
)}
```

- [x] **Step 3: Verify visually**

Check: in `astral_alignment` phase with a birth date entered, only one text block appears (the `introspectionMessage` below the loading spinner area). The zodiac symbol/sign/element/ruler appears as a single compact line above. No `brain-bubble` text wall.

- [x] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "fix(astral): hide birthNarrative long text, keep compact zodiac header"
```

---

### Task 2: Truth/Whisper — replace choice buttons with a pill toggle switch

> **Context:** In `threshold` step 4, the user picks between "Verdad Directa" and "Susurro Metafórico" using two separate `.choice-button` elements. Replace with a single pill-shaped toggle switch (the active side slides). The "Continuar" button stays below.

**Files:**
- Modify: `src/App.jsx` (around lines 1375–1382)
- Modify: `src/App.css` (add `.dichotomy-toggle` styles, keep `.dichotomy-buttons` intact for backwards-compat)

- [x] **Step 1: Replace JSX for thresholdStep 4**

Find this block in `src/App.jsx` (approx. lines 1375–1382):

```jsx
{thresholdStep === 4 && (
  <>
    <p className="welcome-text"><TypewriterText text={`"${sessionTexts.askDichotomy}"`} speed={45} /></p>
    <div className="dichotomy-buttons">
      <button className={`choice-button ${dichotomousChoice === 'direct' ? 'selected' : ''}`} onClick={() => setDichotomousChoice('direct')}>{translations.ui.direct_truth}</button>
      <button className={`choice-button ${dichotomousChoice === 'metaphor' ? 'selected' ? ''}`} onClick={() => setDichotomousChoice('metaphor')}>{translations.ui.metaphoric_whisper}</button>
    </div>
    <button className="start-button" onClick={handleNextThreshold} disabled={!dichotomousChoice}>{translations.ui.continue}</button>
  </>
)}
```

Replace with:

```jsx
{thresholdStep === 4 && (
  <>
    <p className="welcome-text"><TypewriterText text={`"${sessionTexts.askDichotomy}"`} speed={45} /></p>
    <div className="dichotomy-toggle">
      <button
        className={`dichotomy-option${dichotomousChoice === 'direct' ? ' dichotomy-active' : ''}`}
        onClick={() => setDichotomousChoice('direct')}
      >
        🔍 {translations.ui.direct_truth}
      </button>
      <button
        className={`dichotomy-option${dichotomousChoice === 'metaphor' ? ' dichotomy-active' : ''}`}
        onClick={() => setDichotomousChoice('metaphor')}
      >
        🌸 {translations.ui.metaphoric_whisper}
      </button>
    </div>
    <button className="start-button" onClick={handleNextThreshold} disabled={!dichotomousChoice}>{translations.ui.continue}</button>
  </>
)}
```

- [x] **Step 2: Add CSS for the toggle switch**

Add these rules at the end of `src/App.css` (before the final `@keyframes fadeIn` added by the premium feature):

```css
/* ── Dichotomy toggle (Truth / Whisper) ──────────────────── */
.dichotomy-toggle {
  display: inline-flex;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 50px;
  padding: 4px;
  gap: 0;
  margin: 1.5rem auto 1.75rem;
}

.dichotomy-option {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.55);
  padding: 10px 22px;
  border-radius: 46px;
  font-size: 0.88rem;
  font-family: inherit;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: background 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;
  white-space: nowrap;
}

.dichotomy-option.dichotomy-active {
  background: rgba(124, 58, 237, 0.85);
  color: #fff;
  box-shadow: 0 2px 12px rgba(124, 58, 237, 0.5);
}

[data-theme="light"] .dichotomy-toggle {
  background: rgba(100, 80, 160, 0.07);
  border-color: rgba(100, 80, 160, 0.2);
}

[data-theme="light"] .dichotomy-option {
  color: rgba(45, 37, 64, 0.5);
}

[data-theme="light"] .dichotomy-option.dichotomy-active {
  background: rgba(100, 80, 160, 0.85);
  color: #fff;
  box-shadow: 0 2px 12px rgba(100, 80, 160, 0.35);
}
```

- [x] **Step 3: Verify visually**

Check: step 4 of threshold shows a rounded pill with two options side-by-side. Clicking one highlights it with purple background. "Continuar" button below remains disabled until a choice is made.

- [x] **Step 4: Commit**

```bash
git add src/App.jsx src/App.css
git commit -m "feat(threshold): replace choice buttons with pill toggle switch for Truth/Whisper"
```

---

### Task 3: Card selection subtitle — make text more visible

> **Context:** `.fan-subtitle` (the instruction text "Haz click en una carta y luego arrástrala..." shown below the synchrony title) is nearly invisible: `rgba(196, 181, 253, 0.75)` at 0.82rem. Make it clearly readable in both dark and light mode.

**Files:**
- Modify: `src/App.css` (`.fan-subtitle` at line 1945 and mobile override at ~line 2223)

- [x] **Step 1: Update the base `.fan-subtitle` rule**

Find (approx. line 1945):
```css
.fan-subtitle {
  font-size: 0.82rem;
  color: rgba(196, 181, 253, 0.75);
  letter-spacing: 1px;
  margin: 0;
}
```

Replace with:
```css
.fan-subtitle {
  font-size: 0.88rem;
  color: rgba(232, 220, 255, 0.92);
  letter-spacing: 0.5px;
  font-weight: 600;
  margin: 0;
  text-shadow: 0 1px 4px rgba(0,0,0,0.5);
}
```

- [x] **Step 2: Add a light-mode override**

After the `.fan-subtitle` block (before `.fan-deck`), add:

```css
[data-theme="light"] .fan-subtitle {
  color: rgba(45, 30, 80, 0.85);
  text-shadow: none;
  font-weight: 700;
}
```

- [x] **Step 3: Commit**

```bash
git add src/App.css
git commit -m "fix(css): improve card-selection subtitle visibility in dark and light mode"
```

---

### Task 4: Message boxes — restyle brain-bubble for rounded, polished look

> **Context:** `.brain-bubble` has `border-radius: 8px` which looks "too square". Increase border-radius to 18px, add soft background fills for both modes, and tighten typography.

**Files:**
- Modify: `src/App.css` (`.brain-bubble` at line 250)

- [x] **Step 1: Update `.brain-bubble` base styles**

Find (approx. line 250):
```css
.brain-bubble {
  padding: 15px 20px;
  border-radius: 8px;
  font-size: 1.05rem;
  line-height: 1.6;
  border-left: 4px solid transparent;
  width: 100%;
  box-sizing: border-box;
  text-align: center;
  font-style: italic;
  display: block;
}
```

Replace with:
```css
.brain-bubble {
  padding: 18px 24px;
  border-radius: 18px;
  font-size: 1.05rem;
  line-height: 1.7;
  border-left: 4px solid transparent;
  width: 100%;
  box-sizing: border-box;
  text-align: center;
  font-style: italic;
  display: block;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(4px);
}
```

- [x] **Step 2: Add light-mode override for brain-bubble**

Find `[data-theme="light"] .brain-bubble.narrative p,` (approx. line 1279) — add a rule just before it:

```css
[data-theme="light"] .brain-bubble {
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(124, 111, 160, 0.18);
  box-shadow: 0 2px 12px rgba(124, 58, 237, 0.06);
}
```

- [x] **Step 3: Update `.brain-bubble.narrative` mobile rule**

Find (approx. line 334):
```css
.brain-bubble.narrative {
```
Check this section exists and has `border-radius` — if so, ensure it's at least 16px. If the rule doesn't override `border-radius`, the base 18px already applies. No additional change needed.

- [x] **Step 4: Commit**

```bash
git add src/App.css
git commit -m "fix(css): restyle brain-bubble with rounder corners and polished light/dark backgrounds"
```

---

### Task 5: Mesa image — fix clipping on sides in revelation scene

> **Context:** `.revelation-cloth-scene` and `.fan-scene` both use `background-size: cover` which clips the sides of the mesa (table) PNG. Change to `background-size: contain` with a solid wood-tone background so the full image is always visible without cropping.

**Files:**
- Modify: `src/App.css` (`.revelation-cloth-scene` at line 2377 and `[data-theme="light"] .revelation-cloth-scene` at ~2404, also `background-size: cover` in `.fan-scene` at ~line 1868)

- [x] **Step 1: Fix `.revelation-cloth-scene` background-size**

Find (approx. line 2389–2393):
```css
  /* PNG de la mesa — puesto vía inline style desde App.jsx */
  background-color: #4a3820;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
```

Replace with:
```css
  /* PNG de la mesa — puesto vía inline style desde App.jsx */
  background-color: #3a2c18;
  background-size: contain;
  background-position: center center;
  background-repeat: no-repeat;
```

- [x] **Step 2: Fix the fan-scene (card selection) background too**

Search for `background-size: cover;` inside `.fan-scene` rule (approx. line 1868):
```css
  background-size: cover;
```
Replace with:
```css
  background-size: contain;
  background-position: center center;
```

Also check the light-mode rule at `[data-theme="light"] .fan-scene` and make the same change if it has `background-size: cover`.

- [x] **Step 3: Verify no other background-size: cover rules affect the mesa**

Run:
```bash
grep -n "background-size: cover" src/App.css
```

For any rule that references the mesa scenes (`fan-scene`, `revelation-cloth-scene`, `synchrony-table`), change `cover` to `contain`. Rules for `background-size: 250%` (zoom style) should NOT be changed.

- [x] **Step 4: Commit**

```bash
git add src/App.css
git commit -m "fix(css): change mesa background-size from cover to contain to prevent side clipping"
```

---

### Task 6: Card names below revealed cards (English and Portuguese only)

> **Context:** In the `revelation` phase, three selected cards are displayed. The user wants the card's translated name shown as a small label below each card, but only when `language === 'en'` or `language === 'pt'` (Spanish users read the name in the narrative text, so it's redundant there).

**Files:**
- Modify: `src/App.jsx` (approx. lines 1738–1750 — the `revelation-cards-spread` map)

- [x] **Step 1: Locate the card block in the revelation spread**

Find this block (approx. lines 1738–1749):
```jsx
return (
<div key={index} className={`revelation-card-block ${revealedStage === index + 1 ? 'active-reveal' : revealedStage > 0 ? 'dimmed' : ''}`} style={{ position: 'relative' }}>
  <div style={{ position: 'relative', zIndex: 2 }}>
    <Card card={translatedCard} isSelected={false} isFaceUp={cardsFlippedCount > index} logoSrc={isLight ? logoClaro : logoDark} />
  </div>

  {clar?.extraCard && (
    <div className="clarification-card-wrapper fade-in-text">
      <Card card={{...clar.extraCard, name: translations.cards[clar.extraCard.id]?.name || clar.extraCard.name}} isSelected={false} isFaceUp={true} />
    </div>
  )}
</div>
```

- [x] **Step 2: Add the card name label**

Replace the `return (` block with the version below (adds a `<p>` label after the Card, visible only when `cardsFlippedCount > index` and language is 'en' or 'pt'):

```jsx
return (
<div key={index} className={`revelation-card-block ${revealedStage === index + 1 ? 'active-reveal' : revealedStage > 0 ? 'dimmed' : ''}`} style={{ position: 'relative' }}>
  <div style={{ position: 'relative', zIndex: 2 }}>
    <Card card={translatedCard} isSelected={false} isFaceUp={cardsFlippedCount > index} logoSrc={isLight ? logoClaro : logoDark} />
  </div>

  {cardsFlippedCount > index && (language === 'en' || language === 'pt') && (
    <p className="reveal-card-name fade-in-text" style={{
      textAlign: 'center',
      fontSize: '0.72rem',
      fontWeight: 700,
      letterSpacing: '1.5px',
      textTransform: 'uppercase',
      color: isLight ? 'rgba(60,30,100,0.7)' : 'rgba(196,181,253,0.8)',
      margin: '6px 0 0',
      fontStyle: 'normal',
      lineHeight: 1.2,
    }}>
      {translatedCard.name}
    </p>
  )}

  {clar?.extraCard && (
    <div className="clarification-card-wrapper fade-in-text">
      <Card card={{...clar.extraCard, name: translations.cards[clar.extraCard.id]?.name || clar.extraCard.name}} isSelected={false} isFaceUp={true} />
    </div>
  )}
</div>
```

- [x] **Step 3: Verify**

With `language = 'en'` or `'pt'`: after cards flip, a small uppercase card name appears below each. With `language = 'es'`: no name label shown.

- [x] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat(revelation): show card name label below revealed cards for en/pt languages"
```

---

### Task 7: Mobile deepening — fix two-card overflow

> **Context:** When a user in the deepening phase has selected a tentative card, two cards appear in `.fan-selected-row` above the deepening fan. On mobile, the second card goes off-screen. Fix: ensure `.fan-selected-row` wraps and centers properly on small screens, and the `fan-tray-card` cards shrink to fit.

**Files:**
- Modify: `src/App.css` (`.fan-selected-row` mobile overrides, approx. lines 2198–2203 and 2308–2313)

- [x] **Step 1: Fix the first mobile breakpoint (.fan-selected-row)**

Find (approx. line 2198–2203):
```css
  .fan-selected-row {
    gap: 12px;
    min-height: 90px;
    padding: 8px 12px 4px;
  }
  .fan-tray-card .card-wrapper { width: 80px; height: 126px; }
```

Replace with:
```css
  .fan-selected-row {
    gap: 8px;
    min-height: 90px;
    padding: 8px 8px 4px;
    flex-wrap: wrap;
    justify-content: center;
    max-width: 100%;
    overflow: visible;
  }
  .fan-tray-card .card-wrapper { width: 72px; height: 113px; }
```

- [x] **Step 2: Fix the second mobile breakpoint (smaller screens)**

Find (approx. line 2308–2313):
```css
  .fan-selected-row {
```

And its adjacent `.fan-tray-card` rule. Update:
```css
  .fan-selected-row {
    gap: 6px;
    padding: 6px 4px 2px;
    flex-wrap: wrap;
    justify-content: center;
    max-width: 100%;
    overflow: visible;
  }
  .fan-tray-card .card-wrapper { width: 60px; height: 94px; }
```

- [x] **Step 3: Verify on mobile viewport (375px wide)**

With two cards selected in deepening, both cards should be visible above the fan, centered, side by side. No overflow.

- [x] **Step 4: Commit**

```bash
git add src/App.css
git commit -m "fix(mobile): center and wrap deepening selected cards to prevent overflow on small screens"
```

---

### Task 8: Landing — language flags top-right + multi-step Start flow (voice + tier)

> **Context:** The landing page needs: (1) language flag selector top-right (🇪🇸/🇺🇸/🇧🇷, defaults to English), (2) clicking "Start" shows an inline second step with voice choice (Masculina/Femenina) and tier choice (Standard 40cr / Full 65cr / Premium 100cr), (3) confirming calls `onEnter({ language, tier, voiceProfile })`. App.jsx handles the premium login gate.
>
> `LandingScreen` receives `onEnter` as a prop and currently calls `onEnter()` (no args). After this task it calls `onEnter({ language, tier, voiceProfile })`.
>
> `App.jsx` phase `'languageSelection'` currently auto-selects language. After this task: if `language` is pre-set from landing, skip directly to threshold; if `tier` is pre-set to 'premium', check login and handle auth before proceeding.

**Files:**
- Modify: `src/components/LandingScreen.jsx` — major refactor
- Modify: `src/App.jsx` — handle new `onEnter` signature; add premium-from-landing auth gate

#### Part A — LandingScreen.jsx

- [x] **Step 1: Add language and step state; add flag selector at top-right**

At the top of the component (after existing `useState` declarations), add:

```jsx
const [selectedLang, setSelectedLang] = useState('en'); // default English
const [step, setStep] = useState('landing'); // 'landing' | 'configure'
const [selectedTier, setSelectedTier] = useState('standard');
const [selectedVoice, setSelectedVoice] = useState('feminine');
```

Replace the theme toggle `<button>` block (which is `position: absolute, top:16, right:16`) with a flex row that includes both language flags AND the theme toggle:

```jsx
{/* Top-right controls: language flags + theme toggle */}
<div style={{
  position: 'absolute', top: 16, right: 16,
  display: 'flex', alignItems: 'center', gap: 8,
}}>
  {[
    { code: 'es', flag: '🇪🇸' },
    { code: 'en', flag: '🇺🇸' },
    { code: 'pt', flag: '🇧🇷' },
  ].map(({ code, flag }) => (
    <button
      key={code}
      onClick={() => setSelectedLang(code)}
      title={code.toUpperCase()}
      style={{
        background: selectedLang === code
          ? (isLight ? 'rgba(124,111,160,0.25)' : 'rgba(124,58,237,0.3)')
          : 'transparent',
        border: selectedLang === code
          ? `1px solid ${isLight ? 'rgba(124,111,160,0.5)' : 'rgba(167,139,250,0.5)'}`
          : '1px solid transparent',
        borderRadius: 8,
        width: 34, height: 34,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', fontSize: 18,
        transition: 'all 0.2s',
      }}
    >
      {flag}
    </button>
  ))}
  <button
    onClick={toggleTheme}
    title={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
    style={{
      background: toggleBg,
      border: `1px solid ${toggleBorder}`,
      borderRadius: 50, width: 34, height: 34,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', fontSize: 16,
      color: toggleColor, transition: 'all 0.2s',
    }}
  >
    {isLight ? '🌙' : '☀️'}
  </button>
</div>
```

- [x] **Step 2: Update handleCTA to go to step 'configure' instead of calling onEnter**

Replace:
```jsx
function handleCTA() {
  setEntered(true);
  setTimeout(onEnter, 400);
}
```

With:
```jsx
function handleCTA() {
  setStep('configure');
}

function handleBegin() {
  setEntered(true);
  setTimeout(() => onEnter({ language: selectedLang, tier: selectedTier, voiceProfile: selectedVoice }), 400);
}
```

- [x] **Step 3: Add conditional rendering — show configuration step when step === 'configure'**

In the return JSX, right BEFORE the `{/* Logo */}` block, add:

```jsx
{step === 'configure' && (
  <div style={{
    position: 'absolute', inset: 0, zIndex: 10,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '80px 20px 32px',
    background: bg, backdropFilter: 'blur(8px)',
  }}>
    {/* Back button */}
    <button
      onClick={() => setStep('landing')}
      style={{
        position: 'absolute', top: 16, left: 16,
        background: 'transparent', border: 'none',
        color: taglineColor, fontSize: 22, cursor: 'pointer', lineHeight: 1,
      }}
    >
      ←
    </button>

    <h2 style={{
      color: titleColor, fontSize: 'clamp(1rem, 3vw, 1.4rem)',
      fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
      marginBottom: 24, fontFamily: 'Georgia, serif',
    }}>
      ✦ Configura tu experiencia
    </h2>

    {/* Tier selection */}
    <div style={{ width: '100%', maxWidth: 500, marginBottom: 20 }}>
      <p style={{ color: taglineColor, fontSize: 12, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10, fontWeight: 700, textAlign: 'center' }}>
        Lectura
      </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {[
          { id: 'standard', label: 'Estándar', credits: '40 cr', desc: '3 cartas · voz del sistema' },
          { id: 'full',     label: 'Completa',  credits: '65 cr', desc: '+ profundización · voz del sistema' },
          { id: 'premium',  label: 'Premium ✨', credits: '100 cr', desc: '+ voz premium · email incluido' },
        ].map(t => (
          <div
            key={t.id}
            onClick={() => setSelectedTier(t.id)}
            style={{
              background: selectedTier === t.id
                ? (isLight ? 'rgba(124,111,160,0.22)' : 'rgba(124,58,237,0.22)')
                : (isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.04)'),
              border: `1.5px solid ${selectedTier === t.id
                ? (isLight ? 'rgba(124,111,160,0.7)' : 'rgba(167,139,250,0.7)')
                : (isLight ? 'rgba(124,111,160,0.15)' : 'rgba(255,255,255,0.1)')}`,
              borderRadius: 14, padding: '12px 16px',
              cursor: 'pointer', textAlign: 'center', minWidth: 120, flex: '1 1 120px', maxWidth: 160,
              transition: 'all 0.2s',
            }}
          >
            <div style={{ color: priceColor, fontWeight: 800, fontSize: 15 }}>{t.credits}</div>
            <div style={{ color: pillTitleColor, fontWeight: 700, fontSize: 12, margin: '4px 0 2px' }}>{t.label}</div>
            <div style={{ color: pillDescColor, fontSize: 10, lineHeight: 1.4 }}>{t.desc}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Voice selection */}
    <div style={{ width: '100%', maxWidth: 500, marginBottom: 28 }}>
      <p style={{ color: taglineColor, fontSize: 12, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10, fontWeight: 700, textAlign: 'center' }}>
        Voz
      </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {[
          { id: 'masculine', label: '🌌 Masculina', desc: 'Energías del universo' },
          { id: 'feminine',  label: '🌸 Femenina',  desc: 'Espíritu ancestral' },
        ].map(v => (
          <div
            key={v.id}
            onClick={() => setSelectedVoice(v.id)}
            style={{
              background: selectedVoice === v.id
                ? (isLight ? 'rgba(124,111,160,0.22)' : 'rgba(124,58,237,0.22)')
                : (isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.04)'),
              border: `1.5px solid ${selectedVoice === v.id
                ? (isLight ? 'rgba(124,111,160,0.7)' : 'rgba(167,139,250,0.7)')
                : (isLight ? 'rgba(124,111,160,0.15)' : 'rgba(255,255,255,0.1)')}`,
              borderRadius: 14, padding: '12px 20px', cursor: 'pointer',
              textAlign: 'center', flex: '1 1 140px', maxWidth: 200,
              transition: 'all 0.2s',
            }}
          >
            <div style={{ color: pillTitleColor, fontWeight: 700, fontSize: 13 }}>{v.label}</div>
            <div style={{ color: pillDescColor, fontSize: 11, marginTop: 4 }}>{v.desc}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Note: voice selection only active for Premium */}
    {selectedTier !== 'premium' && (
      <p style={{ color: taglineColor, fontSize: 11, fontStyle: 'italic', marginBottom: 16, textAlign: 'center' }}>
        La voz premium ElevenLabs se activa con el tier Premium
      </p>
    )}

    <button
      onClick={handleBegin}
      style={{
        background: ctaBg, border: `1px solid ${ctaBorder}`,
        borderRadius: 50, padding: '14px 44px',
        color: '#fff', fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
        fontWeight: 700, cursor: 'pointer', letterSpacing: '0.06em',
        boxShadow: ctaShadow, fontFamily: 'inherit',
      }}
    >
      ✦ Comenzar
    </button>
  </div>
)}
```

- [x] **Step 4: Verify**

Check: clicking "Start" on landing → shows configure panel. Selecting Standard/Full/Premium highlights the card. Selecting voice highlights it. Clicking "Comenzar" triggers the enter animation and calls `onEnter({ language, tier, voiceProfile })`.

- [x] **Step 5: Commit LandingScreen changes**

```bash
git add src/components/LandingScreen.jsx
git commit -m "feat(landing): add language flag selector and multi-step tier/voice configuration before entry"
```

#### Part B — App.jsx: handle new onEnter signature + premium auth gate

- [x] **Step 6: Find where LandingScreen's onEnter is wired up**

Search for `onEnter` in `src/App.jsx`. Find the prop passed to `<LandingScreen>` and the handler it calls. Currently it goes to `setPhase('languageSelection')` or similar.

Find where `LandingScreen` is rendered (search for `<LandingScreen`). The `onEnter` prop currently points to a function that moves to the next phase. Also find `handleSelectLanguage`.

- [x] **Step 7: Update the LandingScreen onEnter handler in App.jsx**

Find the onEnter handler (likely something like `() => setPhase('languageSelection')` or a named function). Replace with:

```jsx
const handleLandingEnter = ({ language: lang = 'en', tier = 'standard', voiceProfile: vp = 'feminine' } = {}) => {
  // Set language immediately so translations work
  setLanguage(lang);

  if (tier === 'premium') {
    // Premium requires login — gate here
    if (!authSession) {
      // Store pending landing config and open auth
      setPendingAction({ type: 'landing_premium', tier, voiceProfile: vp });
      setShowAuthModal(true);
      setPhase('threshold'); // Move past landing so auth modal can show
      return;
    }
    // Logged in — deduct premium credits and set up tier
    deductCredits(authSession, 'premium_ritual').then(result => {
      if (result.ok) {
        setCredits(result.credits);
        flashCredit(-100);
        setConsultTier('premium');
        setVoiceProfile(vp);
      } else {
        showToast(`Créditos insuficientes para Premium (necesitas 100 cr, tienes ${result.credits ?? 0}).`);
        setConsultTier(null);
      }
    }).catch(() => setConsultTier(null));
  } else if (tier === 'full') {
    if (authSession) {
      deductCredits(authSession, 'ancestral_ritual').then(result => {
        if (result.ok) {
          setCredits(result.credits);
          flashCredit(-65);
          setConsultTier('full');
        } else {
          setConsultTier('standard'); // Fallback
        }
      }).catch(() => setConsultTier('standard'));
    }
  } else {
    // Standard — deduct 40cr (same as handleSelectLanguage)
    if (authSession) {
      deductCredits(authSession, 'consultation').then(result => {
        if (result.ok) {
          setCredits(result.credits);
          flashCredit(-40);
          setConsultTier('standard');
        } else {
          setConsultTier(null);
        }
      }).catch(() => setConsultTier(null));
    }
  }

  // Set voice profile for all tiers (premium uses ElevenLabs, others Web Speech ignores it)
  setVoiceProfile(vp);

  // Move to threshold (skip languageSelection since language was chosen on landing)
  setPhase('threshold');
};
```

- [x] **Step 8: Wire handleLandingEnter to LandingScreen**

Find `<LandingScreen` in App.jsx. Update:
```jsx
<LandingScreen onEnter={handleLandingEnter} />
```

- [x] **Step 9: Handle pending landing_premium after auth**

Find the `pendingAction` handling in App.jsx (search for `pendingAction`). Locate the block that processes pending actions after auth. Add a case for `landing_premium`:

```js
if (pending?.type === 'landing_premium') {
  const { tier, voiceProfile: vp } = pending;
  deductCredits(authSession, 'premium_ritual').then(result => {
    if (result.ok) {
      setCredits(result.credits);
      flashCredit(-100);
      setConsultTier('premium');
      setVoiceProfile(vp);
    } else {
      showToast(`Créditos insuficientes para Premium.`);
    }
  });
}
```

- [x] **Step 10: Verify end-to-end**

Test: Landing → select 🇺🇸 (English) → Premium tier → click Comenzar → auth modal appears → after login → threshold screen (English) with premium tier active.
Test: Landing → Standard → Comenzar → threshold without auth modal.

- [x] **Step 11: Commit App.jsx changes**

```bash
git add src/App.jsx
git commit -m "feat(app): wire landing pre-selection (language, tier, voiceProfile) with premium auth gate"
```

---

### Task 9: Landing AI text — improve copy

> **Context:** The IA pill in FEATURES currently reads "Gemini analiza tu nombre, fecha y pregunta para construir una narrativa única e irrepetible." The user wants it to convey "guía espiritual personalizada con IA, sensible, empática, sanadora."

**Files:**
- Modify: `src/components/LandingScreen.jsx` (FEATURES array)

- [x] **Step 1: Update FEATURES array**

Find the `FEATURES` array at the top of `LandingScreen.jsx`:

```js
const FEATURES = [
  {
    icon: '🃏',
    title: '44 Cartas Arcanas',
    desc: 'Mazo propio inspirado en arquetipos de vidas pasadas. Cada carta abre una memoria diferente.',
  },
  {
    icon: '🤖',
    title: 'IA Personalizada',
    desc: 'Gemini analiza tu nombre, fecha y pregunta para construir una narrativa única e irrepetible.',
  },
  {
    icon: '🔊',
    title: 'Voz del Oráculo',
    desc: 'Tu lectura es narrada por una voz etérea. Cierra los ojos y déjate guiar.',
  },
];
```

Replace with:

```js
const FEATURES = [
  {
    icon: '🃏',
    title: '44 Cartas Arcanas',
    desc: 'Mazo propio inspirado en arquetipos de vidas pasadas. Cada carta abre una memoria diferente.',
  },
  {
    icon: '✨',
    title: 'Guía Espiritual IA',
    desc: 'Una presencia sensible, empática y sanadora que construye una narrativa única para tu alma.',
  },
  {
    icon: '🔊',
    title: 'Voz del Oráculo',
    desc: 'Tu lectura es narrada por una voz etérea. Cierra los ojos y déjate guiar.',
  },
];
```

- [x] **Step 2: Commit**

```bash
git add src/components/LandingScreen.jsx
git commit -m "fix(landing): improve AI feature pill copy to emphasize spiritual guide, empathy, healing"
```

---

## Self-Review

### Spec coverage check
1. ✅ T1 — Constellation: show only second text (introspectionMessage)
2. ✅ T1 — Before revelation: remove duplicate (same fix — birthNarrative text removed)
3. ✅ T2 — Truth/Whisper toggle switch + continue button
4. ✅ T3 — Card selection text more visible (whiter, bold)
5. ✅ T4 — Message boxes: rounded, light/dark
6. ✅ T5 — Mesa image: fix containment
7. ✅ T6 — Card names in revelation (en/pt)
8. ✅ T7 — Mobile deepening: center two cards
9. ✅ T8 — Landing flags + Start → voice/tier selection
10. ✅ T8 — Premium from landing → login + 100cr flow
11. ✅ T9 — Landing AI text improved

### Placeholder scan
- All code blocks are complete and runnable. No TBD items.

### Type consistency
- `onEnter({ language, tier, voiceProfile })` — used consistently in T8 Part A (LandingScreen) and Part B (App.jsx `handleLandingEnter`).
- `deductCredits(authSession, 'premium_ritual')` — matches existing API key used in `handleUnlock`.
- `setConsultTier('premium')`, `setVoiceProfile(vp)` — match existing state names in App.jsx.

---

## Trabajo Adicional Completado (sesión 2026-05-26)

Trabajo extra realizado durante la sesión, fuera del plan original.

### Fase 2 — UX Batch adicional (`commit 26e2456`)
- **Logo móvil**: reducción a 150px de alto + padding-top 175px en `@media (max-width: 600px)`.
- **Voces premium**: descripciones evocativas y poéticas en ES/EN/PT (ej. *"Eco del cosmos — profundo, hipnótico, inescrutable"*).
- **Testimonios**: sección de 3 testimonios por idioma en LandingScreen (tira horizontal).
- **Oracle thinking overlay**: opacidad mínima 0.05 → 0.40 en `oracleThinkingPulse` — era casi invisible.
- **Birthdate iOS**: ya estaba resuelto (`.soul-input` tiene `font-size: 16px` en móvil).

### Fase 3 — Mesa, iconos SVG, OG image (`commits ead6e83`, `c3680a7`)
- **Mesa portrait**: `@media (orientation: portrait)` aplica `background-size: cover` en fan-scene y revelation-cloth-scene — soluciona el frame incompleto en 9:16.
- **Iconos de mute**: reemplazados emojis por SVG Material Design (volume_off / volume_up).
- **CSS muerto**: eliminado `border-left: 4px solid transparent` de `.brain-bubble`.
- **OG image dinámica**: creado `api/og.jsx` (Edge runtime con `@vercel/og`/Satori) que genera imagen 1200×630 con diseño Zoltar: fondo cósmico, orbe 🔮, título ZOLTAR en dorado, subtítulo, divisor, tagline y badge URL.
- **index.html**: meta tags `og:image` y `twitter:image` apuntan a `https://www.cosmic-guidance.com/api/og`.

### WCAG AA — Auditoría de contraste (`commit 73d2ab0`)
Todos los pares de colores fallan → corregidos en 3 archivos. Todos superan ≥4.5:1 (texto normal) o ≥3:1 (texto grande/UI).

| Archivo | Correcciones |
|---------|-------------|
| `src/App.css` | 6 ocurrencias `rgba(white, 0.4)` → `0.62` (3.26→5.72:1) |
| `src/components/LandingScreen.jsx` | `taglineColor`, `ctaBg`, `pillDescColor`, `priceColor`, `priceSubColor`, `priceLabelColor`, `footerColor`, `footerLinkColor`, botón premium (blanco→`#2d1a00`), nota premium (`#b8860b`→`#785200`) |
| `src/components/UnlockModal.jsx` | `closeColor`, `titleColor`, `subColor`, `linkColor`, `buyColor`, gradiente full tier, botón confirmar |

### Bug fixes (`commits 07699b0`, `ba761ad`)
- **Testimonios desktop**: tercer testimonio se cortaba (744px > 680px contenedor). Fix: `flexWrap: wrap` + `flex: 1 1 190px` — 3 columnas en desktop, apilado en móvil.
- **Audio astral_alignment**: la voz del `waitMsg` se cortaba al aparecer la sección de constelación. Fix: encadenamiento de narración — `narrate(astralMsg)` espera el `onEnd` del `waitMsg` antes de disparar.
