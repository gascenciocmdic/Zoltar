# Spec: Zoltar UI Visual Redesign — 6 Modificaciones

**Fecha:** 2026-05-17  
**Estado:** Aprobado  
**Alcance:** Frontend únicamente — sin cambios a lógica de negocio, auth, pagos o Firebase

---

## Contexto

La app Zoltar (React + Vite) tiene un sistema de temas (`useTheme()`, `data-theme="light|dark"`). Varias partes de la UI usan estilos hardcodeados oscuros que no respetan el tema claro, y el logo debe reemplazarse por nuevas imágenes PNG. Todas las modificaciones son de presentación.

---

## Modificación 1 — Reemplazar Logo ZOLTAR

### Objetivo
Reemplazar los logos actuales (`zoltar-logo.jpg` en dark, `zoltar-logo-light.svg` en light) por los nuevos archivos PNG en `src/assets/`.

### Assets
- `src/assets/Logo_Zoltar_oscuro.png` → dark mode
- `src/assets/Logo_Zoltar_claro.png` → light mode

### Implementación
- **LandingScreen.jsx**: importar ambos logos como módulos Vite:
  ```js
  import logoDark from './assets/Logo_Zoltar_oscuro.png'
  import logoClaro from './assets/Logo_Zoltar_claro.png'
  ```
  Condicionar `src` con `isLight ? logoClaro : logoDark`.
- **App.css — `.global-logo`**: convertir el div `.global-logo` en un `<img>` renderizado en App.jsx con `src={isLight ? logoClaro : logoDark}`. El CSS de `.global-logo` pasa a controlar dimensiones y posicionamiento en lugar de `background-image`.
- **Watermark**: misma lógica condicional.
- Los archivos en `public/` (zoltar-logo.jpg, zoltar-logo-light.svg) se mantienen temporalmente para compatibilidad; no se eliminan.

### Criterio de éxito
- En dark mode se ve `Logo_Zoltar_oscuro.png` en landing y en el logo global.
- En light mode se ve `Logo_Zoltar_claro.png` en landing y en el logo global.
- No hay FOUC (flash of wrong logo) al cambiar de tema.

---

## Modificación 2 — Botones Visibles en Light Mode

### Problema
El botón "Continuar" (fase `synchrony`) y otros botones de acción tienen `background: rgba(20,22,28,0.95)` hardcodeado en inline styles de App.jsx. En light mode son invisibles.

### Implementación
- **App.jsx**: remover inline styles de background/color en botones de la fase `synchrony`. Reemplazar por clases CSS: `.action-btn`, `.continue-btn`.
- **App.css**: definir las clases con estilos dark por defecto y override light:
  ```css
  .continue-btn {
    background: rgba(20, 22, 28, 0.95);
    color: #c4b5fd;
    border: 1px solid #4c3d8f;
  }
  [data-theme="light"] .continue-btn {
    background: rgba(255, 255, 255, 0.9);
    color: #3b0764;
    border: 1px solid #7c3aed;
    box-shadow: 0 2px 8px rgba(124, 58, 237, 0.15);
  }
  ```
- Auditar todos los botones en App.jsx con inline styles de fondo oscuro y migrarlos a clases.

### Criterio de éxito
- Todos los botones de acción son legibles en ambos temas.
- Dark mode sin cambios visuales.

---

## Modificación 3 — Popups con Tema Correcto

### Problema
El popup de la fase `synchrony` (y otros) tiene `background: rgba(20,22,28,0.95)` hardcodeado como inline style en App.jsx. Siempre aparece oscuro, incluso en light mode.

### Implementación
- **App.jsx**: identificar todos los divs con inline style de background oscuro en overlays/popups. Reemplazar por clase `.popup-box`.
- **App.css**:
  ```css
  .popup-box {
    background: rgba(15, 12, 28, 0.97);
    color: #e2e8f0;
    border: 1px solid #4c3d8f;
    box-shadow: 0 0 30px rgba(124, 58, 237, 0.15);
  }
  [data-theme="light"] .popup-box {
    background: rgba(248, 244, 255, 0.97);
    color: #2d2540;
    border: 1px solid #a78bfa;
    box-shadow: 0 4px 20px rgba(124, 58, 237, 0.2);
  }
  ```
- `.popup-overlay` también recibe override light: `background: rgba(200,190,240,0.4)`.

### Criterio de éxito
- Popups en light mode tienen fondo claro y tipografía oscura.
- Dark mode sin cambios visuales perceptibles (ligera mejora de profundidad).

---

## Modificación 4 — Card Loading con Logo

### Objetivo
Las cartas en estado "cargando" / "boca abajo" (antes de ser seleccionadas) mostrarán el logo de Zoltar correspondiente al tema activo, con animación shimmer.

### Implementación
- **En el componente de carta (dentro de App.jsx o componente dedicado)**: cuando la carta está en estado `loading` o `unrevealed`, renderizar:
  ```jsx
  <img
    src={isLight ? logoClaro : logoDark}
    className="card-loading-logo"
    alt="Zoltar"
  />
  ```
- **App.css**:
  ```css
  @keyframes shimmer {
    0% { opacity: 0.5; }
    50% { opacity: 1; }
    100% { opacity: 0.5; }
  }
  .card-loading-logo {
    width: 60px;
    height: auto;
    max-height: 50px;
    object-fit: contain;
    animation: shimmer 2s ease-in-out infinite;
  }
  ```
- El resto del estilo de la carta (fondo gradiente, borde) se adapta al tema.

### Criterio de éxito
- Cartas en estado loading muestran el logo correcto según el tema.
- Animación shimmer suave, no distractora.

---

## Modificación 5 — Constelaciones Visibles en Light Mode

### Problema
`ConstellationCanvas.jsx` dibuja estrellas blancas sobre canvas transparente. En light mode el fondo blanco de la página hace las estrellas invisibles.

### Solución elegida: Wrapper CSS (opción A)
Envolver `<ConstellationCanvas />` en un div con background oscuro que se aplica siempre, sin modificar la lógica del canvas.

### Implementación
- **App.jsx** (o donde se renderiza ConstellationCanvas): envolver en:
  ```jsx
  <div className="constellation-wrapper">
    <ConstellationCanvas ... />
  </div>
  ```
- **App.css**:
  ```css
  .constellation-wrapper {
    background: #0d0d1a;
    border-radius: 12px;
    overflow: hidden;
  }
  ```
- No se modifican internals de `ConstellationCanvas.jsx`.

### Criterio de éxito
- Las constelaciones son visibles tanto en dark como en light mode.
- El canvas mantiene su comportamiento existente sin cambios.

---

## Modificación 6 — Rediseño Selección y Revelación de Cartas

### Objetivo
Transformar la fase `synchrony` (selección) y la pantalla de revelación para evocar una mesa de tarot real con manos, basado en las imágenes de referencia.

### Enfoque elegido: B — CSS avanzado con imágenes de fondo

#### Selección de cartas (`synchrony`)
- **Contenedor principal**: fondo de mesa de madera oscura usando `Selecciona_cartas.jpeg` como `background-image` con overlay oscuro semitransparente, O gradiente CSS que simula madera (`linear-gradient(135deg, #2c1a08, #3d2510, #1a0c04)`).
- **Decisión**: usar gradiente CSS (no la imagen directa) para evitar carga pesada y mantener el aspecto mágico/estilizado.
- **Abanico de cartas**: CSS `transform: rotate()` + `translateX()` aplicado a cada carta según su índice. Las cartas existentes (`spreadX`, `spreadY`, `rotation` seed-based) se mantienen pero se refuerza el efecto abanico.
- **Overlay de manos**: `Selecciona_cartas.jpeg` como imagen posicionada en la parte inferior del contenedor (position: absolute, bottom: 0), con gradient fade hacia arriba, para simular que las manos del usuario extienden las cartas. Altura ~30% del contenedor.
- **Dragonfly**: se mantiene sin cambios.
- **Mobile**: a ≤480px el abanico se reduce, las cartas se apilan en 2 filas si son muchas.

#### Revelación de cartas
- **Contenedor**: `Mostrar_seleccionadas.jpeg` como background con overlay violeta semitransparente.
- **Animación flip**: las cartas reveladas tienen animación CSS `rotateY(180deg)` para simular que una mano las gira. Duración 0.6s, ease-in-out.
- **Cartas reveladas**: fondo degradado violeta profundo con el símbolo/imagen de la carta.

#### CSS específico
```css
.synchrony-table {
  background: linear-gradient(135deg, #2c1a08, #3d2510, #1a0c04);
  border-radius: 16px;
  padding: 24px 16px;
  position: relative;
  overflow: hidden;
  min-height: 300px;
}
.synchrony-hands {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 35%;
  /* background-image se setea via inline style en JSX: style={{ backgroundImage: `url(${seleccionaManos})` }} */
  mask-image: linear-gradient(to bottom, transparent, black 60%);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 60%);
  opacity: 0.5;
  pointer-events: none;
}
.revelation-cloth {
  /* background-image se setea via inline style en JSX: style={{ backgroundImage: `url(${mostrarManos})` }} */
  background-size: cover;
  background-position: center;
}
.card-flip {
  transition: transform 0.6s ease-in-out;
  transform-style: preserve-3d;
}
.card-flip.revealed {
  transform: rotateY(180deg);
}
```

#### Importación de assets en JSX
```js
import seleccionaManos from './assets/Selecciona_cartas.jpeg'
import mostrarManos from './assets/Mostrar_seleccionadas.jpeg'
```

### Criterio de éxito
- La fase de selección evoca visualmente una mesa de tarot.
- La revelación tiene animación de flip fluida.
- Responsive: funciona en iPhone SE (375px) y pantallas grandes.
- La libélula (Dragonfly) sigue visible y funcional.

---

## Archivos a modificar

| Archivo | Modificaciones |
|---|---|
| `src/App.jsx` | Logo condicional global, clases CSS en botones/popups, imports assets, overlay manos, flip animation |
| `src/App.css` | Variables logo, overrides light mode (botones, popups, tabla), shimmer, constellation-wrapper, synchrony-table, card-flip |
| `src/components/LandingScreen.jsx` | Logo condicional src |
| `src/components/ConstellationCanvas.jsx` | Sin cambios (wrapper en App.jsx) |

## Archivos NO modificados

- Lógica de negocio (auth, pagos, créditos)
- Firebase / Supabase / Stripe
- Sistema de fases (App.jsx lógica)
- Dragonfly.jsx

---

## Estimación

| Modificación | Complejidad | Estimado |
|---|---|---|
| 1 · Logo | Baja | 30 min |
| 2 · Botones | Baja | 20 min |
| 3 · Popups | Baja | 20 min |
| 4 · Card Loading | Media | 45 min |
| 5 · Constelaciones | Baja | 15 min |
| 6 · Selección/Revelación | Alta | 2-3 h |
| **Total** | | **~5 h** |
