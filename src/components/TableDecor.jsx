import React from 'react';
import './TableDecor.css';

/**
 * Decoración de la mesa de tarot — vista cenital (desde arriba).
 * Tres elementos: vela encendida, clúster de amatista, amuleto Ojo de Ra.
 *
 * `uid` prop evita duplicar IDs de gradientes SVG cuando el componente
 * se renderiza en más de una escena del mismo documento.
 */

/* ── Vela encendida ─────────────────────────────────────────── */
const CandleSVG = ({ p }) => (
  <svg
    viewBox="0 0 130 130"
    width="118"
    height="118"
    xmlns="http://www.w3.org/2000/svg"
    style={{ overflow: 'visible' }}
  >
    <defs>
      {/* Halo cálido sobre la madera */}
      <radialGradient id={`${p}-cg`} cx="50%" cy="52%" r="50%">
        <stop offset="0%"   stopColor="rgba(255,205,80,0.52)" />
        <stop offset="38%"  stopColor="rgba(255,150,40,0.26)" />
        <stop offset="72%"  stopColor="rgba(230,100,20,0.10)" />
        <stop offset="100%" stopColor="rgba(200,70,10,0.00)" />
      </radialGradient>
      {/* Pool de cera */}
      <radialGradient id={`${p}-wp`} cx="42%" cy="38%" r="62%">
        <stop offset="0%"   stopColor="#fffdf5" />
        <stop offset="55%"  stopColor="#f0e6c0" />
        <stop offset="100%" stopColor="#d8c898" />
      </radialGradient>
      {/* Cuerpo superior de la vela */}
      <radialGradient id={`${p}-ct`} cx="38%" cy="32%" r="68%">
        <stop offset="0%"   stopColor="#fffef8" />
        <stop offset="45%"  stopColor="#f5ead8" />
        <stop offset="100%" stopColor="#e0d0a8" />
      </radialGradient>
      {/* Llama desde arriba */}
      <radialGradient id={`${p}-fl`} cx="50%" cy="55%" r="50%">
        <stop offset="0%"   stopColor="rgba(255,255,255,0.97)" />
        <stop offset="22%"  stopColor="rgba(255,248,140,0.88)" />
        <stop offset="55%"  stopColor="rgba(255,140,20,0.60)" />
        <stop offset="100%" stopColor="rgba(255,60,0,0.00)" />
      </radialGradient>
      {/* Gota de cera */}
      <radialGradient id={`${p}-wd`} cx="50%" cy="30%" r="60%">
        <stop offset="0%"   stopColor="rgba(255,250,230,0.80)" />
        <stop offset="100%" stopColor="rgba(218,198,140,0.40)" />
      </radialGradient>
    </defs>

    {/* Halo cálido en la mesa (grande, anima) */}
    <ellipse className="candle-table-glow"
      cx="65" cy="72" rx="62" ry="58"
      fill={`url(#${p}-cg)`} />

    {/* Gotas y rastros de cera en la madera */}
    <path d="M62,93 C59,98 57,103 58,108 C59,111 62,111 64,109"
          fill={`url(#${p}-wd)`} />
    <path d="M70,91 C73,95 75,99 74,103"
          fill="rgba(225,210,160,0.45)" />
    <path d="M58,94 C54,97 52,101 54,104"
          fill="rgba(220,205,155,0.38)" />

    {/* Pool de cera — contorno irregular */}
    <path d="M42,84 C37,78 35,70 39,65 C43,60 51,58 65,59
             C79,60 88,64 90,71 C92,78 88,87 81,91
             C74,95 65,96 56,94 C49,92 44,88 42,84 Z"
          fill={`url(#${p}-wp)`} />

    {/* Cuerpo cilíndrico (top) */}
    <ellipse cx="65" cy="78" rx="17" ry="16"
             fill={`url(#${p}-ct)`}
             stroke="rgba(180,155,90,0.45)" strokeWidth="0.9" />
    {/* Rim suave */}
    <ellipse cx="65" cy="79" rx="17" ry="16"
             fill="none" stroke="rgba(120,90,30,0.28)" strokeWidth="1.8" />

    {/* Zona fundida central */}
    <ellipse cx="65" cy="77" rx="10" ry="9.5"
             fill="rgba(255,246,215,0.62)" />

    {/* Mecha carbonizada */}
    <path d="M65,73 C65.6,71 66,69 65.4,66.5"
          stroke="#1a0e00" strokeWidth="2.0" fill="none" strokeLinecap="round" />
    <circle cx="65.4" cy="66" r="1.4" fill="#0f0800" />

    {/* Nube de llama (anima) */}
    <ellipse className="flame-glow"
      cx="65" cy="67" rx="11" ry="10"
      fill={`url(#${p}-fl)`} />

    {/* Punto brillante (anima) */}
    <ellipse className="flame-core"
      cx="65" cy="66" rx="4.0" ry="3.5"
      fill="rgba(255,255,220,0.95)" />

    {/* Núcleo blanco puro (anima) */}
    <ellipse className="flame-inner"
      cx="65" cy="66.5" rx="1.8" ry="1.5"
      fill="white" />
  </svg>
);

/* ── Clúster de amatista ─────────────────────────────────── */
const AmethystSVG = ({ p }) => (
  <svg
    viewBox="0 0 106 94"
    width="100"
    height="88"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <radialGradient id={`${p}-am1`} cx="38%" cy="30%" r="66%">
        <stop offset="0%"   stopColor="#dda0f2" />
        <stop offset="40%"  stopColor="#a855f7" />
        <stop offset="80%"  stopColor="#7c3aed" />
        <stop offset="100%" stopColor="#5b21b6" />
      </radialGradient>
      <radialGradient id={`${p}-am2`} cx="62%" cy="35%" r="62%">
        <stop offset="0%"   stopColor="#e0b0ff" />
        <stop offset="50%"  stopColor="#9333ea" />
        <stop offset="100%" stopColor="#6d28d9" />
      </radialGradient>
      <radialGradient id={`${p}-am3`} cx="48%" cy="42%" r="58%">
        <stop offset="0%"   stopColor="#c084fc" />
        <stop offset="55%"  stopColor="#7e22ce" />
        <stop offset="100%" stopColor="#581c87" />
      </radialGradient>
    </defs>

    {/* Sombra en la mesa */}
    <ellipse cx="53" cy="58" rx="46" ry="30" fill="rgba(0,0,0,0.40)" />

    {/* Cristal pequeño inferior-centro */}
    <polygon points="53,66 62,55 67,63 60,72 46,72 41,63"
             fill={`url(#${p}-am3)`}
             stroke="#9333ea" strokeWidth="0.6" />

    {/* Cristal izquierdo */}
    <polygon points="20,52 31,24 44,30 46,55 36,62 22,57"
             fill={`url(#${p}-am1)`}
             stroke="#a855f7" strokeWidth="0.7" />

    {/* Cristal derecho */}
    <polygon points="86,50 84,24 72,26 66,52 74,60 87,56"
             fill={`url(#${p}-am2)`}
             stroke="#9333ea" strokeWidth="0.7" />

    {/* Cristal central (más grande, más alto) */}
    <polygon points="53,5 68,19 70,46 53,57 36,46 38,19"
             fill={`url(#${p}-am1)`}
             stroke="#c084fc" strokeWidth="0.9" />

    {/* Líneas de faceta internas — cristal central */}
    <path d="M53,5 L61,28 L53,42" fill="rgba(220,180,255,0.30)" />
    <path d="M53,5 L45,28 L53,42" fill="rgba(180,140,230,0.20)" />
    <path d="M38,19 L53,30" stroke="rgba(210,170,255,0.35)" strokeWidth="0.5" fill="none" />
    <path d="M68,19 L53,30" stroke="rgba(210,170,255,0.35)" strokeWidth="0.5" fill="none" />

    {/* Faceta cristal izquierdo */}
    <path d="M31,24 L38,41 L44,30" fill="rgba(220,180,255,0.22)" />

    {/* Faceta cristal derecho */}
    <path d="M84,24 L78,41 L72,30" fill="rgba(200,160,255,0.20)" />

    {/* Reflejos especulares */}
    <path d="M53,6 L59,14" stroke="rgba(255,255,255,0.60)"
          strokeWidth="2.0" strokeLinecap="round" fill="none" />
    <path d="M31,25 L36,31" stroke="rgba(255,255,255,0.48)"
          strokeWidth="1.6" strokeLinecap="round" fill="none" />
    <path d="M83,25 L78,31" stroke="rgba(255,255,255,0.44)"
          strokeWidth="1.4" strokeLinecap="round" fill="none" />

    {/* Destellos puntiformes */}
    <circle cx="54" cy="7"  r="2.0" fill="white" opacity="0.88" />
    <circle cx="32" cy="26" r="1.3" fill="white" opacity="0.72" />
    <circle cx="82" cy="27" r="1.1" fill="white" opacity="0.65" />
    <circle cx="65" cy="22" r="0.9" fill="white" opacity="0.55" />
  </svg>
);

/* ── Amuleto — Ojo de Ra (medallón dorado) ───────────────── */
const AmuletSVG = ({ p }) => (
  <svg
    viewBox="0 0 116 116"
    width="108"
    height="108"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <radialGradient id={`${p}-ab`} cx="37%" cy="33%" r="72%">
        <stop offset="0%"   stopColor="#d4a72c" />
        <stop offset="35%"  stopColor="#a0760e" />
        <stop offset="72%"  stopColor="#7a5508" />
        <stop offset="100%" stopColor="#523705" />
      </radialGradient>
      <radialGradient id={`${p}-ag`} cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stopColor="rgba(255,235,110,0.38)" />
        <stop offset="60%"  stopColor="rgba(255,200,60,0.10)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.00)" />
      </radialGradient>
      <radialGradient id={`${p}-ge`} cx="40%" cy="38%" r="62%">
        <stop offset="0%"   stopColor="#301040" />
        <stop offset="50%"  stopColor="#1a0828" />
        <stop offset="100%" stopColor="#0a0414" />
      </radialGradient>
    </defs>

    {/* Eslabones de cadena (parciales, caídos sobre la mesa) */}
    <ellipse cx="10" cy="60" rx="8.0" ry="4.8"
             fill="none" stroke="rgba(185,148,38,0.72)" strokeWidth="1.6"
             transform="rotate(-28 10 60)" />
    <ellipse cx="19" cy="55" rx="7.0" ry="4.2"
             fill="none" stroke="rgba(185,148,38,0.62)" strokeWidth="1.4"
             transform="rotate(12 19 55)" />
    <ellipse cx="27" cy="58" rx="6.5" ry="3.8"
             fill="none" stroke="rgba(185,148,38,0.55)" strokeWidth="1.2"
             transform="rotate(-18 27 58)" />
    <ellipse cx="34" cy="54" rx="5.5" ry="3.4"
             fill="none" stroke="rgba(185,148,38,0.45)" strokeWidth="1.0"
             transform="rotate(8 34 54)" />

    {/* Sombra del disco */}
    <ellipse cx="63" cy="64" rx="40" ry="38" fill="rgba(0,0,0,0.48)" />

    {/* Disco del medallón */}
    <circle cx="59" cy="59" r="40" fill={`url(#${p}-ab)`} />

    {/* Brillo suave sobre el metal */}
    <circle cx="59" cy="59" r="40" fill={`url(#${p}-ag)`} />

    {/* Anillos grabados concéntricos */}
    <circle cx="59" cy="59" r="40" fill="none"
            stroke="rgba(255,218,0,0.48)" strokeWidth="2.4" />
    <circle cx="59" cy="59" r="34" fill="none"
            stroke="rgba(255,200,50,0.28)" strokeWidth="1.2" />
    <circle cx="59" cy="59" r="28" fill="none"
            stroke="rgba(255,185,30,0.20)" strokeWidth="0.8" />

    {/* Marcas decorativas cada 45° */}
    {[0,45,90,135,180,225,270,315].map((deg, i) => {
      const rad = (deg * Math.PI) / 180;
      const x1 = 59 + Math.cos(rad) * 34;
      const y1 = 59 + Math.sin(rad) * 34;
      const x2 = 59 + Math.cos(rad) * 40;
      const y2 = 59 + Math.sin(rad) * 40;
      return (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="rgba(255,215,0,0.38)" strokeWidth="1.0" />
      );
    })}

    {/* Ojo de Ra — forma exterior */}
    <path d="M36,57 Q44,46 59,48 Q74,46 82,57 Q74,68 59,66 Q44,68 36,57 Z"
          fill="rgba(255,215,0,0.10)"
          stroke="rgba(255,215,0,0.62)" strokeWidth="1.3" />

    {/* Iris */}
    <circle cx="59" cy="57" r="10"
            fill={`url(#${p}-ge)`}
            stroke="rgba(255,215,0,0.52)" strokeWidth="1.1" />

    {/* Pupila */}
    <circle cx="59" cy="57" r="5" fill="rgba(10,3,20,0.95)" />

    {/* Reflejo en la pupila */}
    <ellipse cx="57" cy="55" rx="1.8" ry="1.4"
             fill="rgba(255,255,200,0.45)" transform="rotate(-20 57 55)" />

    {/* Marca de lágrima (Ojo de Ra) */}
    <path d="M59,67 Q57,73 54,79 Q53,82 55,84"
          stroke="rgba(255,200,30,0.52)" strokeWidth="1.3"
          fill="none" strokeLinecap="round" />

    {/* Líneas alares (extensiones del ojo) */}
    <path d="M36,57 Q30,53 22,51"
          stroke="rgba(255,200,30,0.38)" strokeWidth="0.9"
          fill="none" strokeLinecap="round" />
    <path d="M82,57 Q88,53 96,51"
          stroke="rgba(255,200,30,0.38)" strokeWidth="0.9"
          fill="none" strokeLinecap="round" />

    {/* Brillos especulares del metal */}
    <path d="M40,43 Q47,38 56,39"
          stroke="rgba(255,248,190,0.38)" strokeWidth="2.8"
          fill="none" strokeLinecap="round" />
    <path d="M38,46 Q43,41 50,42"
          stroke="rgba(255,248,190,0.22)" strokeWidth="1.8"
          fill="none" strokeLinecap="round" />
  </svg>
);

/* ── Componente principal ────────────────────────────────── */
export default function TableDecor({ uid = 'a' }) {
  return (
    <div className="table-decor" aria-hidden="true">
      <div className="td-item td-candle">
        <CandleSVG p={uid} />
      </div>
      <div className="td-item td-amethyst">
        <AmethystSVG p={uid} />
      </div>
      <div className="td-item td-amulet">
        <AmuletSVG p={uid} />
      </div>
    </div>
  );
}
