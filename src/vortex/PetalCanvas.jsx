/**
 * PetalCanvas — pétalos realistas de flores púrpura que caen y danzan.
 * Forma orgánica con bezier, gradiente punta→base, venas y brillo interior.
 * Ráfagas de viento periódicas para movimiento armónico y pacífico.
 */
import React, { useRef, useEffect } from 'react';

/* ── Paleta por especie de flor ─────────────────────────────────
   Cada variante tiene:
     r/g/b  → color medio del pétalo
     tr/tg/tb → tono de la punta (más claro, desaturado)
     br/bg/bb → tono de la base (más oscuro, saturado)
     vr/vg/vb → tono de las venas (entre punta y tono)
──────────────────────────────────────────────────────────────── */
const VARIANTS = [
  // Clematis púrpura profundo
  { r:100, g:38,  b:168,  tr:175, tg:118, tb:228, br:68, bg:18,  bb:128, vr:195, vg:148, vb:240 },
  // Violeta medio
  { r:145, g:72,  b:208,  tr:200, tg:152, tb:242, br:102,bg:42,  bb:168, vr:210, vg:170, vb:248 },
  // Cosmos malva-rosa
  { r:178, g:88,  b:192,  tr:222, tg:162, tb:235, br:132,bg:52,  bb:158, vr:232, vg:185, vb:248 },
  // Lavanda suave (Scabiosa)
  { r:188, g:138, b:228,  tr:228, tg:202, tb:250, br:148,bg:92,  bb:198, vr:238, vg:218, vb:255 },
  // Lila pálido
  { r:200, g:158, b:234,  tr:234, tg:212, tb:252, br:158,bg:112, bb:202, vr:242, vg:228, vb:255 },
  // Iris azul-violeta
  { r:112, g:78,  b:208,  tr:178, tg:152, tb:240, br:72, bg:38,  bb:168, vr:195, vg:172, vb:248 },
  // Magenta-púrpura (Verbena)
  { r:158, g:52,  b:182,  tr:210, tg:138, tb:228, br:112,bg:22,  bb:142, vr:222, vg:162, vb:242 },
  // Blanco lavanda (Syringa)
  { r:212, g:182, b:238,  tr:244, tg:228, tb:254, br:172,bg:138, bb:212, vr:252, vg:242, vb:255 },
];

function mkPetal(W, H, startInView = true) {
  const v = VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
  return {
    x:  Math.random() * W,
    y:  startInView ? Math.random() * H : -15 - Math.random() * 100,
    vx: (Math.random() - 0.5) * 0.36,
    vy: 0.16 + Math.random() * 0.28,
    rot:  Math.random() * Math.PI * 2,
    dRot: (Math.random() - 0.5) * 0.020,
    /* Tamaño — ~45 % más pequeño que la versión anterior */
    pw: 2.2 + Math.random() * 3.6,   // semi-ancho  2.2 – 5.8 px
    ph: 4.5 + Math.random() * 7.0,   // semi-alto   4.5 – 11.5 px
    /* Asimetría orgánica */
    aL: 0.86 + Math.random() * 0.28,
    aR: 0.86 + Math.random() * 0.28,
    /* Curvatura de la vena central */
    vc: (Math.random() - 0.5) * 1.8,
    /* Colores */
    r:v.r, g:v.g, b:v.b,
    tr:v.tr, tg:v.tg, tb:v.tb,
    br:v.br, bg:v.bg, bb:v.bb,
    vr:v.vr, vg:v.vg, vb:v.vb,
    alpha: 0.28 + Math.random() * 0.42,
    /* Movimiento */
    swayPhase: Math.random() * Math.PI * 2,
    swayAmp:   0.10 + Math.random() * 0.20,
    swayFreq:  0.32 + Math.random() * 0.52,
    windLag:   0.22 + Math.random() * 1.1,
    windScale: 0.42 + Math.random() * 0.62,
    cwx: 0,
    cwy: 0,
  };
}

/* ── Dibuja un pétalo orgánico realista ─────────────────────── */
function drawPetal(ctx, p) {
  const { pw: w, ph: h, aL, aR, alpha } = p;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);

  /* ── 1. Forma del pétalo con 4 curvas cúbicas ──────────────
     Eje: punta = (0, -h) arriba  /  base = (0, +h) abajo.
     Cada lado es ligeramente distinto (aL ≠ aR) → asimetría natural. */
  ctx.beginPath();
  ctx.moveTo(0, h);                                                    // base
  ctx.bezierCurveTo(-w*0.38*aL,  h*0.72,  -w*aL,    h*0.14,
                    -w*aL*0.88, -h*0.12);                             // base → ancho izq
  ctx.bezierCurveTo(-w*aL*0.72, -h*0.46,  -w*0.20*aL, -h*0.92,
                     0,          -h);                                  // ancho izq → punta
  ctx.bezierCurveTo( w*0.20*aR, -h*0.92,   w*aR*0.72, -h*0.46,
                     w*aR*0.88, -h*0.12);                             // punta → ancho der
  ctx.bezierCurveTo( w*aR,       h*0.14,   w*0.38*aR,  h*0.72,
                     0,           h);                                  // ancho der → base
  ctx.closePath();

  /* ── 2. Relleno degradado punta→base ───────────────────────── */
  const gFill = ctx.createLinearGradient(0, -h, 0, h);
  gFill.addColorStop(0,    `rgba(${p.tr},${p.tg},${p.tb},${(alpha * 0.82).toFixed(3)})`);
  gFill.addColorStop(0.42, `rgba(${p.r},${p.g},${p.b},${alpha.toFixed(3)})`);
  gFill.addColorStop(1,    `rgba(${p.br},${p.bg},${p.bb},${(alpha * 0.78).toFixed(3)})`);
  ctx.fillStyle = gFill;
  ctx.fill();

  /* ── 3. Brillo interior — elipse central más clara ──────────
     Simula la curvatura del pétalo captando la luz. */
  ctx.save();
  ctx.globalAlpha = alpha * 0.22;
  const gHL = ctx.createLinearGradient(-w * 0.32, 0, w * 0.32, 0);
  gHL.addColorStop(0,   'rgba(255,255,255,0)');
  gHL.addColorStop(0.5, 'rgba(255,255,255,1)');
  gHL.addColorStop(1,   'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.08, w * 0.30, h * 0.62, 0, 0, Math.PI * 2);
  ctx.fillStyle = gHL;
  ctx.fill();
  ctx.restore();

  /* ── 4. Vena central ligeramente curvada ────────────────────── */
  ctx.beginPath();
  ctx.moveTo(p.vc * 0.6,  h * 0.88);
  ctx.quadraticCurveTo(p.vc, -h * 0.05, 0, -h * 0.92);
  ctx.strokeStyle = `rgba(${p.vr},${p.vg},${p.vb},0.28)`;
  ctx.lineWidth   = Math.max(0.3, w * 0.065);
  ctx.stroke();

  /* ── 5. Venas laterales (2 por lado, muy sutiles) ────────────── */
  const va = 0.14;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const y0  = h * (0.38 - i * 0.44);
      const xE  = side * w * (0.60 + i * 0.08);
      const yE  = y0 - h * (0.18 + i * 0.10);
      ctx.beginPath();
      ctx.moveTo(p.vc * 0.25, y0);
      ctx.quadraticCurveTo(side * w * 0.22, y0 - h * 0.06, xE, yE);
      ctx.strokeStyle = `rgba(${p.vr},${p.vg},${p.vb},${va})`;
      ctx.lineWidth   = Math.max(0.22, w * 0.038);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/* ── Componente principal ───────────────────────────────────── */
export default function PetalCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    const PETAL_N = 70;
    const petals  = Array.from({ length: PETAL_N }, () => mkPetal(W, H, true));

    /* ── Viento ───────────────────────────────────────────────── */
    let windX = 0, windY = 0;
    let gustActive = false, gustElapsed = 0, gustDuration = 0;
    let gustPeakX = 0, gustPeakY = 0;
    let nextGust = 2.5 + Math.random() * 5.0;

    function startGust() {
      const dir    = Math.random() > 0.5 ? 1 : -1;
      const angle  = Math.random() * 0.32 * Math.PI;
      const str    = 2.0 + Math.random() * 3.8;
      gustPeakX    = dir * Math.cos(angle) * str;
      gustPeakY    = Math.sin(angle) * 0.55 + 0.06;
      gustDuration = 1.8 + Math.random() * 2.8;
      gustElapsed  = 0;
      gustActive   = true;
    }

    let t = 0, lastTs = performance.now(), rafId;

    function tick(now) {
      rafId = requestAnimationFrame(tick);
      const dt = Math.min((now - lastTs) / 1000, 0.05);
      lastTs = now;
      t += dt;

      nextGust -= dt;
      if (nextGust <= 0 && !gustActive) {
        startGust();
        nextGust = 4.5 + Math.random() * 8.0;
      }

      if (gustActive) {
        gustElapsed += dt;
        const prog = gustElapsed / gustDuration;
        let env = prog < 0.15 ? prog / 0.15
                : prog < 0.55 ? 1.0
                : Math.max(0, 1.0 - (prog - 0.55) / 0.45);
        windX = gustPeakX * env;
        windY = gustPeakY * env;
        if (gustElapsed >= gustDuration) { gustActive = false; windX = windY = 0; }
      } else {
        windX *= 0.90;
        windY *= 0.90;
      }

      ctx.clearRect(0, 0, W, H);

      for (const p of petals) {
        const lagInv = Math.min(1, dt / p.windLag);
        p.cwx += (windX * p.windScale - p.cwx) * lagInv;
        p.cwy += (windY * p.windScale - p.cwy) * lagInv;

        const sway = Math.sin(t * p.swayFreq * Math.PI * 2 + p.swayPhase) * p.swayAmp;

        p.x   += (p.vx + sway + p.cwx) * 60 * dt;
        p.y   += (p.vy + p.cwy) * 60 * dt;
        p.rot += (p.dRot + p.cwx * 0.003) * 60 * dt;

        if (p.y > H + 20) {
          p.y  = -15 - Math.random() * 50;
          p.x  = Math.random() * W;
          p.vx = (Math.random() - 0.5) * 0.36;
          p.vy = 0.16 + Math.random() * 0.28;
        }
        if (p.x > W + 35) p.x = -35;
        if (p.x < -35)    p.x = W + 35;

        drawPetal(ctx, p);
      }
    }

    rafId = requestAnimationFrame(tick);

    const onResize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', onResize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        zIndex: 0, pointerEvents: 'none',
        background: 'linear-gradient(155deg, #f9f5ff 0%, #ede7f8 55%, #f3eeff 100%)',
      }}
    />
  );
}
