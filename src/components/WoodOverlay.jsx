import React from 'react';

/**
 * WoodOverlay — SVG superpuesto sobre la mesa de madera.
 *
 * Usa feDisplacementMap + feTurbulence para que las juntas entre
 * tablones sean ONDULADAS e irregulares en lugar de líneas rectas.
 * También añade veta interna, nudos complejos y arañazos.
 *
 * `uid` evita colisiones de IDs entre múltiples instancias.
 */
export default function WoodOverlay({ uid = 'wo' }) {
  const d  = `${uid}-disp`;   // filtro de desplazamiento fuerte (juntas)
  const g  = `${uid}-grain`;  // filtro suave (veta, arañazos)
  const dk = `${uid}-darkn`;  // filtro oscurecedor para nudos

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
      viewBox="0 0 1200 700"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* ── Desplazamiento fuerte para juntas de tablones ── */}
        <filter id={d} x="-8%" y="-8%" width="116%" height="116%"
                colorInterpolationFilters="sRGB">
          <feTurbulence type="turbulence"
                        baseFrequency="0.005 0.016"
                        numOctaves="4" seed="9" result="turb"/>
          <feDisplacementMap in="SourceGraphic" in2="turb"
                             scale="32"
                             xChannelSelector="R" yChannelSelector="G"/>
        </filter>

        {/* ── Desplazamiento suave para veta y arañazos ── */}
        <filter id={g} x="-6%" y="-6%" width="112%" height="112%"
                colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise"
                        baseFrequency="0.009 0.55"
                        numOctaves="5" seed="17" result="turb"/>
          <feDisplacementMap in="SourceGraphic" in2="turb"
                             scale="14"
                             xChannelSelector="R" yChannelSelector="G"/>
        </filter>

        {/* ── Para nudos: desplazamiento localizado ── */}
        <filter id={dk} x="-15%" y="-15%" width="130%" height="130%"
                colorInterpolationFilters="sRGB">
          <feTurbulence type="turbulence"
                        baseFrequency="0.02 0.05"
                        numOctaves="3" seed="3" result="turb"/>
          <feDisplacementMap in="SourceGraphic" in2="turb"
                             scale="10"
                             xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>

      {/* ════════════════════════════════════════════════
          JUNTAS ENTRE TABLONES — anchuras y espaciados
          irregulares para romper la simetría matemática
          ════════════════════════════════════════════════ */}
      <g filter={`url(#${d})`}>
        {/* Cada tablón tiene: línea principal oscura + penumbra más ancha */}
        {/* Tablón 0→158 */}
        <rect x="0"   y="0" width="2.8" height="700" fill="rgba(0,0,0,0.64)"/>
        <rect x="2.8" y="0" width="7"   height="700" fill="rgba(12,6,1,0.36)"/>
        {/* Tablón 158→302 */}
        <rect x="158" y="0" width="2.5" height="700" fill="rgba(0,0,0,0.58)"/>
        <rect x="160.5" y="0" width="6" height="700" fill="rgba(10,5,1,0.30)"/>
        {/* Tablón 302→448 */}
        <rect x="302" y="0" width="3"   height="700" fill="rgba(0,0,0,0.62)"/>
        <rect x="305" y="0" width="7"   height="700" fill="rgba(14,7,2,0.32)"/>
        {/* Tablón 448→588 */}
        <rect x="448" y="0" width="2.2" height="700" fill="rgba(0,0,0,0.55)"/>
        <rect x="450.2" y="0" width="5.5" height="700" fill="rgba(9,4,1,0.27)"/>
        {/* Tablón 588→738 */}
        <rect x="588" y="0" width="2.8" height="700" fill="rgba(0,0,0,0.60)"/>
        <rect x="590.8" y="0" width="6.5" height="700" fill="rgba(12,6,1,0.30)"/>
        {/* Tablón 738→878 */}
        <rect x="738" y="0" width="2.5" height="700" fill="rgba(0,0,0,0.57)"/>
        <rect x="740.5" y="0" width="6" height="700" fill="rgba(10,5,1,0.28)"/>
        {/* Tablón 878→1025 */}
        <rect x="878" y="0" width="3"   height="700" fill="rgba(0,0,0,0.62)"/>
        <rect x="881" y="0" width="7"   height="700" fill="rgba(13,6,1,0.33)"/>
        {/* Tablón 1025→1162 */}
        <rect x="1025" y="0" width="2.3" height="700" fill="rgba(0,0,0,0.55)"/>
        <rect x="1027.3" y="0" width="5.5" height="700" fill="rgba(9,4,1,0.26)"/>
        {/* Borde derecho */}
        <rect x="1197" y="0" width="3"   height="700" fill="rgba(0,0,0,0.60)"/>
      </g>

      {/* ════════════════════════════════════════════════
          VETA DE LA MADERA — líneas horizontales onduladas
          dentro de cada tablón, como anillos anuales
          ════════════════════════════════════════════════ */}
      <g filter={`url(#${g})`} opacity="0.16">
        {/* Líneas de veta a intervalos semi-irregulares */}
        {[22, 42, 65, 84, 108, 128, 150, 172, 196, 216,
          238, 260, 282, 305, 326, 348, 370, 394, 415,
          436, 460, 482, 505, 527, 548, 572, 594, 616,
          638, 660, 682].map((y, i) => (
          <rect key={i}
            x="0" y={y}
            width="1200"
            height={i % 5 === 0 ? 1.8 : i % 3 === 0 ? 1.2 : 0.7}
            fill={`rgba(0,0,0,${i % 5 === 0 ? 0.24 : i % 3 === 0 ? 0.16 : 0.10})`}
          />
        ))}
      </g>

      {/* ════════════════════════════════════════════════
          NUDOS DE MADERA — deformación orgánica visible
          ════════════════════════════════════════════════ */}
      <g filter={`url(#${dk})`}>
        {/* Nudo 1 — grande, tablón izq-centro */}
        <ellipse cx="228" cy="188" rx="32" ry="20"
                 fill="none" stroke="rgba(12,6,1,0.52)" strokeWidth="4"
                 transform="rotate(-10 228 188)"/>
        <ellipse cx="228" cy="188" rx="24" ry="15"
                 fill="rgba(8,4,1,0.38)"
                 transform="rotate(-10 228 188)"/>
        <ellipse cx="228" cy="188" rx="16" ry="10"
                 fill="rgba(5,2,0,0.28)"
                 transform="rotate(-10 228 188)"/>
        <ellipse cx="228" cy="188" rx="8"  ry="5"
                 fill="rgba(3,1,0,0.20)"
                 transform="rotate(-10 228 188)"/>
        {/* Vetas irradiando del nudo */}
        <path d="M200,172 C210,178 218,182 228,188 C238,194 248,198 260,202"
              stroke="rgba(8,4,1,0.22)" strokeWidth="1.2" fill="none"/>
        <path d="M196,200 C208,196 218,192 228,188 C238,184 248,180 262,178"
              stroke="rgba(8,4,1,0.18)" strokeWidth="0.9" fill="none"/>

        {/* Nudo 2 — mediano, tablón derecha */}
        <ellipse cx="868" cy="412" rx="26" ry="16"
                 fill="none" stroke="rgba(11,5,1,0.46)" strokeWidth="3.5"
                 transform="rotate(14 868 412)"/>
        <ellipse cx="868" cy="412" rx="18" ry="11"
                 fill="rgba(7,3,0,0.32)"
                 transform="rotate(14 868 412)"/>
        <ellipse cx="868" cy="412" rx="11" ry="7"
                 fill="rgba(4,2,0,0.22)"
                 transform="rotate(14 868 412)"/>
        {/* Vetas */}
        <path d="M840,400 C852,406 860,410 868,412 C876,414 886,418 900,420"
              stroke="rgba(7,3,0,0.20)" strokeWidth="1.0" fill="none"/>

        {/* Nudo 3 — pequeño, tablón centro */}
        <ellipse cx="545" cy="575" rx="18" ry="11"
                 fill="none" stroke="rgba(10,5,1,0.40)" strokeWidth="3"
                 transform="rotate(-18 545 575)"/>
        <ellipse cx="545" cy="575" rx="12" ry="8"
                 fill="rgba(6,3,0,0.28)"
                 transform="rotate(-18 545 575)"/>
        <ellipse cx="545" cy="575" rx="7"  ry="5"
                 fill="rgba(3,2,0,0.18)"
                 transform="rotate(-18 545 575)"/>

        {/* Nudo 4 — muy pequeño, tablón izq */}
        <ellipse cx="382" cy="318" rx="12" ry="8"
                 fill="none" stroke="rgba(9,4,1,0.36)" strokeWidth="2.5"
                 transform="rotate(22 382 318)"/>
        <ellipse cx="382" cy="318" rx="8"  ry="5"
                 fill="rgba(5,2,0,0.24)"
                 transform="rotate(22 382 318)"/>

        {/* Nudo 5 — tablón extremo derecho */}
        <ellipse cx="1090" cy="250" rx="20" ry="13"
                 fill="none" stroke="rgba(10,5,1,0.42)" strokeWidth="3"
                 transform="rotate(-6 1090 250)"/>
        <ellipse cx="1090" cy="250" rx="13" ry="8"
                 fill="rgba(6,3,0,0.28)"
                 transform="rotate(-6 1090 250)"/>
        <ellipse cx="1090" cy="250" rx="7"  ry="5"
                 fill="rgba(3,1,0,0.18)"
                 transform="rotate(-6 1090 250)"/>
      </g>

      {/* ════════════════════════════════════════════════
          ARAÑAZOS Y FISURAS — imperfecciones de uso
          ════════════════════════════════════════════════ */}
      <g filter={`url(#${g})`} opacity="0.55">
        {/* Fisura larga diagonal */}
        <path d="M132,345 C152,340 172,346 194,340 C208,336 218,340 234,336"
              stroke="rgba(0,0,0,0.22)" strokeWidth="1.3" fill="none"
              strokeLinecap="round"/>
        {/* Arañazo medio */}
        <path d="M642,238 C660,234 680,240 702,234 C718,230 730,235 748,230"
              stroke="rgba(0,0,0,0.18)" strokeWidth="1.0" fill="none"
              strokeLinecap="round"/>
        {/* Fisura en tablón derecho */}
        <path d="M344,478 C362,473 382,480 404,474 C422,470 436,474 454,470"
              stroke="rgba(0,0,0,0.16)" strokeWidth="0.9" fill="none"
              strokeLinecap="round"/>
        {/* Pequeño rasguño */}
        <path d="M892,318 C905,314 920,318 935,314"
              stroke="rgba(0,0,0,0.14)" strokeWidth="0.8" fill="none"
              strokeLinecap="round"/>
        {/* Fisura corta */}
        <path d="M1060,520 C1068,516 1078,520 1090,517"
              stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" fill="none"
              strokeLinecap="round"/>
        {/* Vieja rotura horizontal */}
        <path d="M488,148 C502,144 518,148 536,143 C550,140 562,144 578,141"
              stroke="rgba(0,0,0,0.12)" strokeWidth="0.7" fill="none"
              strokeLinecap="round"/>
      </g>
    </svg>
  );
}
