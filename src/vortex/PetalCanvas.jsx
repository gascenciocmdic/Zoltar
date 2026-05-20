/**
 * PetalCanvas — pétalos de flores púrpura que danzan libremente.
 * Ráfagas de viento periódicas los agitan de modo orgánico y armónico.
 * Usado como fondo del modo claro en lugar del shader de vórtex.
 */
import React, { useRef, useEffect } from 'react';

/* ── Paleta de púrpuras ──────────────────────────────────────── */
const COLORS = [
  [142,  68, 200],   // púrpura medio
  [171, 112, 220],   // lavanda saturada
  [196, 155, 235],   // lavanda clara
  [120,  40, 180],   // púrpura profundo
  [210, 170, 240],   // malva suave
  [155,  85, 205],   // violeta
  [180, 130, 230],   // orquídea
  [230, 200, 250],   // lila palísimo
  [100,  30, 160],   // uva oscura
  [250, 210, 255],   // blanco violáceo
];

function mkPetal(w, h, startInView = true) {
  const [r, g, b] = COLORS[Math.floor(Math.random() * COLORS.length)];
  return {
    x:     Math.random() * w,
    y:     startInView ? Math.random() * h : -20 - Math.random() * 120,
    vx:    (Math.random() - 0.5) * 0.38,   // deriva horizontal suave
    vy:    0.18 + Math.random() * 0.32,    // caída lenta
    rot:   Math.random() * Math.PI * 2,
    dRot:  (Math.random() - 0.5) * 0.022, // rotación continua
    w:     4 + Math.random() * 9,          // semi-eje menor del pétalo
    h:     7 + Math.random() * 16,         // semi-eje mayor del pétalo
    r, g, b,
    alpha:    0.22 + Math.random() * 0.45,
    swayPhase: Math.random() * Math.PI * 2,
    swayAmp:   0.12 + Math.random() * 0.22,  // amplitud del balanceo lateral
    swayFreq:  0.35 + Math.random() * 0.55,  // Hz del balanceo
    windLag:   0.25 + Math.random() * 1.2,   // segundos en alcanzar la ráfaga
    windScale: 0.45 + Math.random() * 0.65,  // cuánto reacciona al viento
    cwx: 0,   // viento personal actual X
    cwy: 0,   // viento personal actual Y
  };
}

function drawPetal(ctx, p) {
  ctx.save();
  ctx.globalAlpha = p.alpha;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);

  /* Pétalo: elipse elongada */
  ctx.beginPath();
  ctx.ellipse(0, 0, p.w, p.h, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
  ctx.fill();

  /* Vena central tenue — da profundidad */
  ctx.beginPath();
  ctx.moveTo(0, -p.h * 0.72);
  ctx.lineTo(0,  p.h * 0.72);
  ctx.strokeStyle = `rgba(255,255,255,0.16)`;
  ctx.lineWidth = Math.max(0.5, p.w * 0.07);
  ctx.stroke();

  ctx.restore();
}

export default function PetalCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    const PETAL_N = 65;
    const petals = Array.from({ length: PETAL_N }, () => mkPetal(W, H, true));

    /* ── Estado global del viento ──────────────────────────── */
    let windX = 0, windY = 0;       // velocidades actuales (píxeles/frame)
    let gustActive = false;
    let gustElapsed  = 0;
    let gustDuration = 0;
    let gustPeakX = 0, gustPeakY = 0;
    let nextGust = 2.5 + Math.random() * 5.0; // segundos hasta la 1.ª ráfaga

    function startGust() {
      const dir = Math.random() > 0.5 ? 1 : -1;
      const angle = (Math.random() * 0.35) * Math.PI; // casi horizontal
      const strength = 2.2 + Math.random() * 4.0;
      gustPeakX = dir * Math.cos(angle) * strength;
      gustPeakY = Math.sin(angle) * 0.6 + 0.08;
      gustDuration = 1.8 + Math.random() * 2.8;
      gustElapsed  = 0;
      gustActive   = true;
    }

    let t = 0;
    let lastTs = performance.now();
    let rafId;

    function tick(now) {
      rafId = requestAnimationFrame(tick);
      const dt = Math.min((now - lastTs) / 1000, 0.05); // segundos
      lastTs = now;
      t += dt;

      /* Temporizador de ráfagas */
      nextGust -= dt;
      if (nextGust <= 0 && !gustActive) {
        startGust();
        nextGust = 4.5 + Math.random() * 8.0;
      }

      /* Envolvente del viento global */
      if (gustActive) {
        gustElapsed += dt;
        const p = gustElapsed / gustDuration;
        let env;
        if      (p < 0.15) env = p / 0.15;                  // ataque suave
        else if (p < 0.55) env = 1.0;                        // meseta
        else               env = 1.0 - (p - 0.55) / 0.45;   // decaimiento largo
        env = Math.max(0, env);
        windX = gustPeakX * env;
        windY = gustPeakY * env;
        if (gustElapsed >= gustDuration) {
          gustActive = false;
          windX = 0;
          windY = 0;
        }
      } else {
        /* Disipación post-ráfaga */
        windX *= 0.90;
        windY *= 0.90;
      }

      ctx.clearRect(0, 0, W, H);

      for (const p of petals) {
        /* Cada pétalo "alcanza" el viento global con su propio retraso */
        const lagInv = Math.min(1, dt / p.windLag);
        p.cwx += (windX * p.windScale - p.cwx) * lagInv;
        p.cwy += (windY * p.windScale - p.cwy) * lagInv;

        /* Balanceo orgánico independiente */
        const sway = Math.sin(t * p.swayFreq * Math.PI * 2 + p.swayPhase) * p.swayAmp;

        /* Movimiento */
        p.x += (p.vx + sway + p.cwx) * 60 * dt;
        p.y += (p.vy + p.cwy) * 60 * dt;

        /* Rotación: el viento la acelera levemente */
        p.rot += (p.dRot + p.cwx * 0.003) * 60 * dt;

        /* Reaparece desde arriba cuando sale por el borde inferior */
        if (p.y > H + 30) {
          p.y  = -20 - Math.random() * 60;
          p.x  = Math.random() * W;
          p.vx = (Math.random() - 0.5) * 0.38;
          p.vy = 0.18 + Math.random() * 0.32;
        }
        if (p.x > W + 40) p.x = -40;
        if (p.x < -40)    p.x = W + 40;

        drawPetal(ctx, p);
      }
    }

    rafId = requestAnimationFrame(tick);

    const onResize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width:  '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        /* Fondo lavanda muy suave — como pergamino iluminado */
        background: 'linear-gradient(160deg, #f8f4ff 0%, #ede8f8 50%, #f2eeff 100%)',
      }}
    />
  );
}
