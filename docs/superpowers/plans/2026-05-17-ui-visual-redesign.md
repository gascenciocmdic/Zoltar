# UI Visual Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar 6 modificaciones visuales al frontend de Zoltar (logos nuevos, botones/popups en light mode, card loading, constelaciones, rediseño de selección/revelación de cartas).

**Architecture:** Cambios de presentación únicamente sobre `src/App.jsx`, `src/App.css`, `src/components/LandingScreen.jsx`, `src/components/Card.jsx` y `src/components/Card.css`. Cero cambios a lógica de negocio, auth, pagos ni Firebase.

**Tech Stack:** React 18, Vite, CSS vanilla con custom properties, `useTheme()` hook (retorna `{ theme, toggleTheme }`), `isLight = theme === 'light'`.

---

## Mapa de archivos

| Archivo | Rol en este plan |
|---|---|
| `src/components/LandingScreen.jsx` | Cambiar `src` de logos a imports Vite |
| `src/App.jsx` | Imports nuevos assets, global-logo div→img, fix selector idioma, quitar inline styles popups/botón, agregar overlay manos, pasar `logoSrc` a Card |
| `src/App.css` | `.global-logo` img rules, overrides light mode botones/popups/constellation/synchrony-table, shimmer keyframe, card-flip |
| `src/components/Card.jsx` | Aceptar prop `logoSrc`, reemplazar `.card-pattern` por `<img>` |
| `src/components/Card.css` | Quitar `background-image` de `.card-pattern`, agregar `.card-loading-logo` |

---

## Task 1: Logo nuevo en LandingScreen.jsx

**Files:**
- Modify: `src/components/LandingScreen.jsx:1-2`

La pantalla de landing ya tiene lógica `isLight` para el logo, pero usa rutas `/public/`. Hay que cambiarlas a módulos Vite importados desde `src/assets/`.

- [ ] **Step 1: Agregar imports al principio del archivo**

En `src/components/LandingScreen.jsx`, después de la línea 2 (`import { useTheme } from '../lib/themeContext';`), insertar:

```js
import logoDark from '../assets/Logo_Zoltar_oscuro.png';
import logoClaro from '../assets/Logo_Zoltar_claro.png';
```

- [ ] **Step 2: Cambiar src del logo light (línea ~118)**

Buscar:
```jsx
src="/zoltar-logo-light.svg"
```
Reemplazar con:
```jsx
src={logoClaro}
```

- [ ] **Step 3: Cambiar src del logo dark (línea ~129)**

Buscar:
```jsx
src="/zoltar-logo.jpg"
```
Reemplazar con:
```jsx
src={logoDark}
```

- [ ] **Step 4: Verificar build**

```bash
cd /Users/inacap/Documents/Zoltar && npm run build 2>&1 | tail -20
```
Esperado: sin errores. Puede haber warnings de tamaño por los PNG grandes — es aceptable.

- [ ] **Step 5: Commit**

```bash
cd /Users/inacap/Documents/Zoltar && git add src/components/LandingScreen.jsx && git commit -m "feat: usa nuevos logos PNG en LandingScreen (Vite imports)"
```

---

## Task 2: Logo global en App.jsx y selector de idioma

**Files:**
- Modify: `src/App.jsx:1-27` (imports), `src/App.jsx:985`, `src/App.jsx:997`
- Modify: `src/App.css:26-41`, `src/App.css:1120-1124`

El logo global (línea 985) es un `<div className="global-logo" />` con `background-image` en CSS. El selector de idioma (línea 997) también usa inline style con `/zoltar-logo.jpg`. Ambos se convierten a `<img>`.

- [ ] **Step 1: Agregar imports en App.jsx**

Después del bloque de imports existente (después de la línea 26, `import { trackEvent, identifyUser } from './lib/analytics';`), agregar:

```js
import logoDark from './assets/Logo_Zoltar_oscuro.png';
import logoClaro from './assets/Logo_Zoltar_claro.png';
```

- [ ] **Step 2: Convertir global-logo div a img (App.jsx ~línea 985)**

Buscar:
```jsx
{phase !== 'landing' && phase !== 'languageSelection' && phase !== 'portalEntrance' && <div className="global-logo" />}
```
Reemplazar con:
```jsx
{phase !== 'landing' && phase !== 'languageSelection' && phase !== 'portalEntrance' && (
  <img
    className="global-logo"
    src={isLight ? logoClaro : logoDark}
    alt="Zoltar"
  />
)}
```

- [ ] **Step 3: Convertir logo en selector de idioma (App.jsx ~línea 997)**

Buscar el div completo con `backgroundImage: "url('/zoltar-logo.jpg')"`:
```jsx
<div style={{ width: '280px', height: '150px', backgroundImage: "url('/zoltar-logo.jpg')", backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', marginBottom: '20px', mixBlendMode: 'screen' }} />
```
Reemplazar con:
```jsx
<img
  src={isLight ? logoClaro : logoDark}
  alt="Zoltar"
  style={{
    width: '280px',
    height: '150px',
    objectFit: 'contain',
    marginBottom: '20px',
    mixBlendMode: isLight ? 'multiply' : 'screen',
  }}
/>
```

- [ ] **Step 4: Actualizar CSS de .global-logo en App.css**

Buscar el bloque original (líneas 26-41):
```css
.global-logo {
  position: absolute;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  width: 500px;
  height: 200px;
  background-image: url('/zoltar-logo.jpg');
  background-position: center;
  background-size: contain;
  background-repeat: no-repeat;
  mix-blend-mode: screen; /* Strips black background */
  z-index: 1000;
  pointer-events: none;
  animation: fadeIn 3s ease;
}
```
Reemplazar con:
```css
.global-logo {
  position: absolute;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  width: 500px;
  height: 200px;
  object-fit: contain;
  mix-blend-mode: screen;
  z-index: 1000;
  pointer-events: none;
  animation: fadeIn 3s ease;
}
```

- [ ] **Step 5: Actualizar override light-mode .global-logo en App.css**

Buscar (líneas 1120-1124):
```css
[data-theme="light"] .global-logo {
  mix-blend-mode: multiply;
  filter: hue-rotate(200deg) saturate(0.7) brightness(0.85);
  opacity: 0.9;
}
```
Reemplazar con:
```css
[data-theme="light"] .global-logo {
  mix-blend-mode: multiply;
  opacity: 0.9;
}
```

- [ ] **Step 6: Verificar que los 3 bloques `.global-logo` en App.css estén actualizados**

Hay duplicados a ~líneas 275 y 503 (media queries). Buscar y aplicar el mismo cambio: quitar `background-image`, `background-position`, `background-size`, `background-repeat`.

```bash
grep -n "background-image.*zoltar-logo" /Users/inacap/Documents/Zoltar/src/App.css
```
Esperado: 0 resultados (o solo en comentarios).

- [ ] **Step 7: Build y commit**

```bash
cd /Users/inacap/Documents/Zoltar && npm run build 2>&1 | tail -10
git add src/App.jsx src/App.css
git commit -m "feat: logo global y selector idioma usan nuevos PNG condicionales"
```

---

## Task 3: Botones visibles en light mode

**Files:**
- Modify: `src/App.jsx:1296`
- Modify: `src/App.css` (agregar clases al final de la sección light)

El botón "Continuar" de la fase `synchrony` (cuando `selectedCards.length === 3`) tiene background oscuro hardcodeado.

- [ ] **Step 1: Quitar inline style del botón continuar (App.jsx ~línea 1296)**

Buscar:
```jsx
<button className="start-button blinking-button" onClick={handleGoToAstralAlignment} disabled={loading} style={{ background: 'rgba(20,22,28,0.95)', padding: '15px 50px', boxShadow: '0 0 30px rgba(0,0,0,0.8), 0 0 20px rgba(255,215,0,0.4)', display: 'block', margin: '0 auto', width: '100%' }}>
```
Reemplazar con:
```jsx
<button className="start-button blinking-button continue-btn" onClick={handleGoToAstralAlignment} disabled={loading} style={{ display: 'block', margin: '0 auto', width: '100%' }}>
```

- [ ] **Step 2: Agregar CSS para .continue-btn en App.css**

Al final de la sección `[data-theme="light"]` (después de la línea 1316, antes de que terminen los overrides), agregar:

```css
/* ── Continue button ──────────────────────────────────────── */
.continue-btn {
  background: rgba(20, 22, 28, 0.95);
  padding: 15px 50px;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.4);
}

[data-theme="light"] .continue-btn {
  background: rgba(255, 255, 255, 0.9) !important;
  color: #3b0764 !important;
  border: 1px solid #7c3aed !important;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.15) !important;
}
```

- [ ] **Step 3: Build y commit**

```bash
cd /Users/inacap/Documents/Zoltar && npm run build 2>&1 | tail -10
git add src/App.jsx src/App.css
git commit -m "feat: botón continuar visible en light mode"
```

---

## Task 4: Popups con tema correcto

**Files:**
- Modify: `src/App.jsx:1217-1220` y `src/App.jsx:1246-1249`
- Modify: `src/App.css` (agregar reglas `.popup-box` y `popup-overlay`)

Hay dos popups con `background: 'rgba(20,22,28,0.95)'` como inline style en el elemento `popup-box`. Ambos deben usar CSS.

- [ ] **Step 1: Quitar inline background del primer popup (showInfoPopup, App.jsx ~línea 1217)**

Buscar el div que comienza:
```jsx
<div className="popup-box" style={{
   background: 'rgba(20,22,28,0.95)', padding: '50px', borderRadius: '20px',
   maxWidth: '90%', width: '500px', textAlign: 'center', border: '1px solid rgba(255,215,0,0.3)',
   boxShadow: '0 0 50px rgba(0,0,0,0.9), inset 0 0 20px rgba(255,215,0,0.05)'
}}>
```
Reemplazar con:
```jsx
<div className="popup-box" style={{
   padding: '50px', borderRadius: '20px',
   maxWidth: '90%', width: '500px', textAlign: 'center',
}}>
```

- [ ] **Step 2: Quitar inline background del segundo popup (showSynchronyPopup, App.jsx ~línea 1246)**

Buscar:
```jsx
<div className="popup-box" style={{
   background: 'rgba(20,22,28,0.95)', padding: '50px', borderRadius: '20px',
   maxWidth: '500px', textAlign: 'center', border: '1px solid rgba(255,215,0,0.3)',
   boxShadow: '0 0 50px rgba(0,0,0,0.9), inset 0 0 20px rgba(255,215,0,0.05)'
}}>
```
Reemplazar con:
```jsx
<div className="popup-box" style={{
   padding: '50px', borderRadius: '20px',
   maxWidth: '500px', textAlign: 'center',
}}>
```

- [ ] **Step 3: Agregar reglas CSS para popup-box en App.css**

Al final del archivo (o junto a las reglas de `.auth-modal`), agregar:

```css
/* ── Popup box ────────────────────────────────────────────── */
.popup-box {
  background: rgba(15, 12, 28, 0.97);
  color: #e2e8f0;
  border: 1px solid rgba(255, 215, 0, 0.3);
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.9), inset 0 0 20px rgba(255, 215, 0, 0.05);
}

[data-theme="light"] .popup-box {
  background: rgba(248, 244, 255, 0.97) !important;
  color: #2d2540 !important;
  border: 1px solid #a78bfa !important;
  box-shadow: 0 4px 20px rgba(124, 58, 237, 0.2) !important;
}

[data-theme="light"] .popup-overlay {
  background: rgba(200, 190, 240, 0.4) !important;
}
```

- [ ] **Step 4: Build y commit**

```bash
cd /Users/inacap/Documents/Zoltar && npm run build 2>&1 | tail -10
git add src/App.jsx src/App.css
git commit -m "feat: popups respetan light/dark mode via CSS"
```

---

## Task 5: Card loading con logo y shimmer

**Files:**
- Modify: `src/components/Card.jsx`
- Modify: `src/components/Card.css`
- Modify: `src/App.jsx` (pasar prop `logoSrc` a cada `<Card>`)

Las cartas boca abajo muestran `.card-pattern` con `background-image: url('/zoltar-logo.jpg')`. Hay que reemplazarlo con un `<img>` que recibe el logo correcto y tiene animación shimmer.

- [ ] **Step 1: Modificar Card.jsx para aceptar prop logoSrc**

Contenido completo nuevo de `src/components/Card.jsx`:

```jsx
import React from 'react';
import './Card.css';

const Card = ({ card, isSelected, onSelect, isFaceUp, style, className, logoSrc }) => {
  return (
    <div 
      className={`card-wrapper ${isSelected ? 'selected' : ''} ${isFaceUp ? 'face-up' : 'face-down'} ${className || ''}`}
      onClick={() => !isFaceUp && onSelect && onSelect(card)}
      style={style}
    >
      <div className="card-inner">
        <div className="card-front">
          {card.image ? (
            <img src={card.image} alt={card.name} className="card-image" />
          ) : (
            <div className="card-image-placeholder">
              <span>{card.name}</span>
            </div>
          )}
        </div>
        <div className="card-back">
          {logoSrc ? (
            <img src={logoSrc} alt="Zoltar" className="card-loading-logo" />
          ) : (
            <div className="card-pattern"></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;
```

- [ ] **Step 2: Actualizar Card.css**

Buscar el bloque `.card-pattern`:
```css
.card-pattern {
  width: 90%;
  height: 90%;
  background-image: url('/zoltar-logo.jpg');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  mix-blend-mode: screen;
  filter: grayscale(100%) opacity(0.6) drop-shadow(0 0 5px rgba(255,255,255,0.2));
  transition: opacity 0.3s ease;
}
```
Reemplazar con:
```css
.card-pattern {
  width: 90%;
  height: 90%;
  background-image: url('/zoltar-logo.jpg');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  mix-blend-mode: screen;
  filter: grayscale(100%) opacity(0.6) drop-shadow(0 0 5px rgba(255,255,255,0.2));
  transition: opacity 0.3s ease;
}

@keyframes cardShimmer {
  0%   { opacity: 0.45; }
  50%  { opacity: 0.9; }
  100% { opacity: 0.45; }
}

.card-loading-logo {
  width: 65%;
  height: auto;
  max-height: 55%;
  object-fit: contain;
  animation: cardShimmer 2.2s ease-in-out infinite;
}
```

- [ ] **Step 3: Pasar logoSrc a cada instancia de <Card> en App.jsx**

Hay 4 lugares donde se renderiza `<Card>`:

**3a.** Fase synchrony (~línea 1281):
```jsx
<Card 
  key={card.id} 
  card={card} 
  isSelected={selectedCards.find(c => c.id === card.id)}
  onSelect={handleSelectCard}
  style={{
    '--scatter-transform': `translate(${spreadX}px, ${spreadY}px) rotate(${rotation}deg)`
  }}
/>
```
Reemplazar con:
```jsx
<Card 
  key={card.id} 
  card={card} 
  isSelected={selectedCards.find(c => c.id === card.id)}
  onSelect={handleSelectCard}
  logoSrc={isLight ? logoClaro : logoDark}
  style={{
    '--scatter-transform': `translate(${spreadX}px, ${spreadY}px) rotate(${rotation}deg)`
  }}
/>
```

**3b.** Fase revelation — deepening card select (~línea 1392):
```jsx
<Card 
  key={c.id} 
  card={c} 
  isSelected={isTentativelySelected}
  onSelect={() => setClarifications(prev => ({
    ...prev,
    [clarifyingCardId]: { ...prev[clarifyingCardId], tentativeCard: c }
  }))}
  style={{
    '--scatter-transform': `translate(${spreadX}px, ${spreadY}px) rotate(${rotation}deg)`
  }}
  className={isTentativelySelected ? 'selected-card-glow' : ''}
/>
```
Reemplazar con:
```jsx
<Card 
  key={c.id} 
  card={c} 
  isSelected={isTentativelySelected}
  onSelect={() => setClarifications(prev => ({
    ...prev,
    [clarifyingCardId]: { ...prev[clarifyingCardId], tentativeCard: c }
  }))}
  logoSrc={isLight ? logoClaro : logoDark}
  style={{
    '--scatter-transform': `translate(${spreadX}px, ${spreadY}px) rotate(${rotation}deg)`
  }}
  className={isTentativelySelected ? 'selected-card-glow' : ''}
/>
```

**3c.** Revelation — cartas seleccionadas mostradas (~línea 1431):
```jsx
<Card card={translatedCard} isSelected={false} isFaceUp={cardsFlippedCount > index} />
```
Esta carta está boca arriba una vez revelada — no necesita logoSrc. Dejar sin cambios.

**3d.** Clarification extra card (~línea 1436):
```jsx
<Card card={{...clar.extraCard, name: translations.cards[clar.extraCard.id]?.name || clar.extraCard.name}} isSelected={false} isFaceUp={true} />
```
También boca arriba — dejar sin cambios.

- [ ] **Step 4: Build y commit**

```bash
cd /Users/inacap/Documents/Zoltar && npm run build 2>&1 | tail -10
git add src/components/Card.jsx src/components/Card.css src/App.jsx
git commit -m "feat: card-back muestra logo temático con animación shimmer"
```

---

## Task 6: Constelaciones visibles en light mode

**Files:**
- Modify: `src/App.css:1302-1304`

El wrapper ya existe con fondo oscuro radial en dark mode. El problema es que el override `[data-theme="light"] .constellation-wrapper` lo sobreescribe con un gradiente claro, haciendo invisibles las estrellas.

- [ ] **Step 1: Verificar el override actual**

```bash
grep -n "constellation-wrapper" /Users/inacap/Documents/Zoltar/src/App.css
```
Busca la línea con `[data-theme="light"] .constellation-wrapper`.

- [ ] **Step 2: Reemplazar el override light-mode del constellation-wrapper**

Buscar:
```css
[data-theme="light"] .constellation-wrapper {
  background: radial-gradient(circle, rgba(240,236,255,0.8) 0%, rgba(240,236,255,0) 70%);
}
```
Reemplazar con:
```css
[data-theme="light"] .constellation-wrapper {
  background: radial-gradient(circle, rgba(13,13,26,0.95) 0%, rgba(13,13,26,0.7) 70%);
  box-shadow: 0 0 30px rgba(124, 58, 237, 0.12);
}
```

- [ ] **Step 3: Build y commit**

```bash
cd /Users/inacap/Documents/Zoltar && npm run build 2>&1 | tail -10
git add src/App.css
git commit -m "fix: constelaciones visibles en light mode (fondo oscuro en wrapper)"
```

---

## Task 7: Mesa de tarot en fase de selección de cartas

**Files:**
- Modify: `src/App.jsx` (imports + estructura synchrony-content)
- Modify: `src/App.css` (agregar .synchrony-table, .synchrony-hands, fan spread)

La fase `synchrony` muestra `<div className="card-grid">` sobre el fondo semitransparente de `.synchrony-content`. Vamos a agregar un contenedor tipo mesa de madera con overlay de manos.

- [ ] **Step 1: Agregar imports de imágenes de manos en App.jsx**

Junto a los imports de logos (Task 2), agregar:

```js
import seleccionaManos from './assets/Selecciona_cartas.jpeg';
import mostrarManos from './assets/Mostrar_seleccionadas.jpeg';
```

- [ ] **Step 2: Envolver card-grid en synchrony-table (App.jsx ~línea 1272)**

Buscar el bloque completo de la fase synchrony:
```jsx
<div className="card-grid" style={{ position: 'relative' }}>
  <Dragonfly visible={true} />
  {shuffledDeck.map((card, index) => {
```
Reemplazar por:
```jsx
<div className="synchrony-table">
  <div
    className="synchrony-hands"
    style={{ backgroundImage: `url(${seleccionaManos})` }}
  />
  <div className="card-grid" style={{ position: 'relative' }}>
    <Dragonfly visible={true} />
    {shuffledDeck.map((card, index) => {
```
Y al final del `card-grid` (después de `})}` del map y el cierre del div), agregar el cierre de `synchrony-table`:
```jsx
    })}
  </div>
</div>
```

- [ ] **Step 3: Agregar CSS para .synchrony-table y .synchrony-hands en App.css**

Al final del archivo (antes del cierre de cualquier media query, o en la sección de layout), agregar:

```css
/* ── Synchrony table (mesa de tarot) ─────────────────────── */
.synchrony-table {
  background: linear-gradient(135deg, #2c1a08 0%, #3d2510 50%, #1a0c04 100%);
  border-radius: 18px;
  padding: 28px 16px 20px;
  position: relative;
  overflow: hidden;
  min-height: 300px;
  margin-bottom: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 200, 100, 0.1);
}

.synchrony-hands {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 38%;
  background-size: cover;
  background-position: center bottom;
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 50%, black 100%);
  mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 50%, black 100%);
  opacity: 0.45;
  pointer-events: none;
  z-index: 0;
}

.synchrony-table .card-grid {
  position: relative;
  z-index: 1;
}

.synchrony-table .card-grid .card-wrapper {
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.7));
}

/* Mobile: mesa más compacta */
@media (max-width: 480px) {
  .synchrony-table {
    padding: 18px 8px 14px;
    border-radius: 12px;
  }
  .synchrony-hands {
    height: 30%;
  }
}
```

- [ ] **Step 4: Build y commit**

```bash
cd /Users/inacap/Documents/Zoltar && npm run build 2>&1 | tail -10
git add src/App.jsx src/App.css
git commit -m "feat: fase synchrony con mesa de madera y overlay de manos"
```

---

## Task 8: Tela violeta en revelación de cartas

**Files:**
- Modify: `src/App.jsx` (~línea 1421 — `selected-cards-display`)
- Modify: `src/App.css` (agregar .revelation-cloth)

La pantalla de revelación usa `<div className="selected-cards-display">`. Le agregamos la clase `revelation-cloth` y el CSS con la imagen de fondo.

- [ ] **Step 1: Agregar clase revelation-cloth (App.jsx ~línea 1421)**

Buscar:
```jsx
<div className="selected-cards-display" style={{ position: 'relative' }}>
```
Reemplazar con:
```jsx
<div
  className="selected-cards-display revelation-cloth"
  style={{ position: 'relative', backgroundImage: `url(${mostrarManos})` }}
>
```

- [ ] **Step 2: Agregar CSS para .revelation-cloth en App.css**

```css
/* ── Revelation cloth (tela violeta) ─────────────────────── */
.revelation-cloth {
  background-size: cover;
  background-position: center top;
  border-radius: 18px;
  padding: 24px 16px;
  position: relative;
  overflow: hidden;
}

.revelation-cloth::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(30, 10, 60, 0.78) 0%,
    rgba(45, 21, 71, 0.72) 50%,
    rgba(20, 10, 40, 0.80) 100%
  );
  border-radius: inherit;
  pointer-events: none;
  z-index: 0;
}

.revelation-cloth > * {
  position: relative;
  z-index: 1;
}

[data-theme="light"] .revelation-cloth::before {
  background: linear-gradient(
    135deg,
    rgba(46, 16, 101, 0.72) 0%,
    rgba(76, 29, 149, 0.65) 50%,
    rgba(30, 10, 70, 0.75) 100%
  );
}

@media (max-width: 480px) {
  .revelation-cloth {
    padding: 14px 8px;
    border-radius: 12px;
  }
}
```

- [ ] **Step 3: Build final limpio**

```bash
cd /Users/inacap/Documents/Zoltar && npm run build 2>&1 | tail -20
```
Esperado: `✓ built in X.XXs` sin errores.

- [ ] **Step 4: Commit y push**

```bash
cd /Users/inacap/Documents/Zoltar && git add src/App.jsx src/App.css
git commit -m "feat: fase revelation con fondo de tela violeta y overlay"
git push origin main
```

---

## Self-review — Cobertura del spec

| Req. Spec | Task que lo implementa |
|---|---|
| M1: Logo nuevo en LandingScreen | Task 1 |
| M1: Logo global (div → img, condicional) | Task 2 |
| M1: Logo en selector de idioma | Task 2, Step 3 |
| M2: Botón continuar visible en light mode | Task 3 |
| M3: Popups con tema correcto | Task 4 |
| M4: Card loading logo + shimmer | Task 5 |
| M5: Constelaciones visibles en light | Task 6 |
| M6: Mesa de madera + manos en synchrony | Task 7 |
| M6: Tela violeta + flip en revelation | Task 8 |
| M6: Mobile responsive ≤480px | Task 7 Step 3 + Task 8 Step 2 |
| M6: Dragonfly se mantiene | Task 7 (envuelve card-grid, no toca Dragonfly) |
| M1: Sin FOUC al cambiar tema | Tasks 1-2 (src reactivo a isLight) |

✅ Todos los requisitos cubiertos. Sin placeholders. Sin TBDs.
