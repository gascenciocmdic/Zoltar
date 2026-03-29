# Oráculo de Vidas Pasadas - PWA MVP

Bienvenido al Oráculo. Esta es una Progressive Web App diseñada para ofrecer una experiencia mística y reveladora sobre vidas pasadas, utilizando el modelo de los 3 cerebros de "El Guía".

## Tecnologías Utilizadas
- **Frontend**: React + Vite
- **Gráficos**: Three.js + React Three Fiber (Vortex WebGL)
- **IA**: Gemini 1.5 Pro/Flash API
- **PWA**: Vite PWA Plugin (Offline & Installable)

## Requisitos
- Node.js (v20 o superior)
- Gemini API Key (Opcional para el flujo de prueba local)

## Instalación y Ejecución
1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
3. Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

## Estructura del Proyecto
- `src/vortex/`: Componentes y shaders del vórtex visual.
- `src/api/`: Puente para la comunicación con Gemini.
- `src/data/`: Fuente de verdad técnica para el oráculo (Cartas).
- `src/components/`: Componentes de UI (Cartas, Modales).

## Contribución y Datos
Para actualizar las interpretaciones de las cartas, modifica el archivo `src/data/cards.js` con el contenido real de tus fuentes.
