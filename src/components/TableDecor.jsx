import React from 'react';
import './TableDecor.css';

/**
 * Elementos decorativos sobre la mesa de tarot — vista cenital.
 *
 * `uid` evita colisiones de IDs de gradiente SVG cuando el componente
 * se renderiza en varias escenas del mismo documento HTML.
 */

/* ══════════════════════════════════════════════════════════════
   VELA ENCENDIDA (vista desde arriba)
   Cera derretida, mecha, llama y halo de luz cálida sobre la mesa
   ══════════════════════════════════════════════════════════════ */
const CandleSVG = ({ p }) => (
  <svg viewBox="0 0 260 260" width="220" height="220"
       xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
    <defs>
      {/* Halo ámbar en la mesa — muy grande, bruma suave */}
      <radialGradient id={`${p}-cgo`} cx="50%" cy="54%" r="50%">
        <stop offset="0%"   stopColor="rgba(255,215,95,0.62)"/>
        <stop offset="22%"  stopColor="rgba(255,175,50,0.44)"/>
        <stop offset="48%"  stopColor="rgba(240,120,28,0.22)"/>
        <stop offset="72%"  stopColor="rgba(210,85,15,0.09)"/>
        <stop offset="100%" stopColor="rgba(180,55,8,0.00)"/>
      </radialGradient>
      {/* Concentración interna de la llama */}
      <radialGradient id={`${p}-cgi`} cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stopColor="rgba(255,250,150,0.82)"/>
        <stop offset="35%"  stopColor="rgba(255,195,55,0.55)"/>
        <stop offset="68%"  stopColor="rgba(255,130,22,0.22)"/>
        <stop offset="100%" stopColor="rgba(255,85,10,0.00)"/>
      </radialGradient>
      {/* Pool de cera — marfil cálido */}
      <radialGradient id={`${p}-wp`} cx="42%" cy="36%" r="65%">
        <stop offset="0%"   stopColor="#fffef6"/>
        <stop offset="28%"  stopColor="#fdf4df"/>
        <stop offset="60%"  stopColor="#f2e2bc"/>
        <stop offset="100%" stopColor="#e2ce98"/>
      </radialGradient>
      {/* Superficie superior de la vela (cilindro) */}
      <radialGradient id={`${p}-ct`} cx="33%" cy="28%" r="76%">
        <stop offset="0%"   stopColor="#fffef4"/>
        <stop offset="30%"  stopColor="#f9f0d8"/>
        <stop offset="62%"  stopColor="#eee0b4"/>
        <stop offset="100%" stopColor="#d6c488"/>
      </radialGradient>
      {/* Cera líquida en el centro (fusión activa) */}
      <radialGradient id={`${p}-liq`} cx="44%" cy="40%" r="58%">
        <stop offset="0%"   stopColor="rgba(255,253,235,0.98)"/>
        <stop offset="45%"  stopColor="rgba(255,245,210,0.88)"/>
        <stop offset="100%" stopColor="rgba(248,232,180,0.72)"/>
      </radialGradient>
      {/* Llama desde arriba — cuatro capas concéntricas */}
      <radialGradient id={`${p}-flo`} cx="50%" cy="56%" r="50%">
        <stop offset="0%"   stopColor="rgba(255,255,230,0.99)"/>
        <stop offset="18%"  stopColor="rgba(255,248,135,0.92)"/>
        <stop offset="42%"  stopColor="rgba(255,168,35,0.68)"/>
        <stop offset="68%"  stopColor="rgba(255,95,12,0.30)"/>
        <stop offset="100%" stopColor="rgba(255,55,0,0.00)"/>
      </radialGradient>
      {/* Gotas de cera derramada */}
      <radialGradient id={`${p}-drp`} cx="50%" cy="25%" r="65%">
        <stop offset="0%"   stopColor="rgba(255,252,225,0.82)"/>
        <stop offset="100%" stopColor="rgba(215,195,140,0.38)"/>
      </radialGradient>
    </defs>

    {/* ── 1. HALO DE LUZ EN LA MESA (grande, anima) ── */}
    <ellipse className="candle-table-glow"
             cx="130" cy="138" rx="128" ry="120"
             fill={`url(#${p}-cgo)`}/>

    {/* ── 2. CONCENTRACIÓN INTERIOR (anima) ── */}
    <ellipse className="candle-mid-glow"
             cx="130" cy="130" rx="80" ry="76"
             fill={`url(#${p}-cgi)`}/>

    {/* ── 3. GOTEOS DE CERA ── */}
    {/* Gota principal izquierda */}
    <path d="M108,182 C104,190 102,200 103,208
             C104,214 108,217 112,213
             C115,209 114,200 111,192
             C109,186 108,183 108,182 Z"
          fill={`url(#${p}-drp)`} opacity="0.72"/>
    {/* Gota derecha */}
    <path d="M152,180 C156,188 159,197 157,205
             C156,211 152,212 149,208
             C146,204 147,196 150,188 Z"
          fill="rgba(242,225,172,0.58)"/>
    {/* Escurrido largo */}
    <path d="M117,184 C113,194 111,204 113,212
             C115,218 120,220 122,215
             C124,210 122,200 120,192 Z"
          fill="rgba(240,222,168,0.52)"/>
    {/* Gotita pequeña arriba-derecha */}
    <path d="M148,168 C152,174 154,181 152,187
             C150,192 147,193 145,189 Z"
          fill="rgba(238,220,165,0.45)"/>
    {/* Escurrido fino */}
    <path d="M125,186 C124,194 124,202 126,207
             C127,211 130,211 131,207 Z"
          fill="rgba(244,228,175,0.42)"/>

    {/* ── 4. POOL DE CERA — forma orgánica compleja ── */}
    <path d="M88,172 C80,160 78,144 82,130
             C86,116 97,108 114,105
             C131,102 148,105 158,115
             C168,125 170,140 166,155
             C162,170 150,178 136,182
             C122,186 105,183 96,176
             C92,173 89,173 88,172 Z"
          fill={`url(#${p}-wp)`}
          stroke="rgba(208,182,125,0.40)" strokeWidth="1.0"/>

    {/* Anillos de enfriamiento concéntricos dentro del pool */}
    <path d="M98,170 C91,159 90,145 93,133
             C96,121 106,114 118,112
             C130,110 142,114 148,124
             C154,134 154,149 150,161
             C146,173 136,179 124,181
             C112,183 103,175 98,170 Z"
          fill="none" stroke="rgba(236,214,158,0.42)" strokeWidth="1.0"/>
    <path d="M107,166 C102,157 101,145 104,135
             C107,125 115,119 125,118
             C135,117 144,122 148,132
             C152,142 151,155 146,164
             C141,173 132,177 122,177
             C112,177 110,170 107,166 Z"
          fill="none" stroke="rgba(248,230,172,0.35)" strokeWidth="0.7"/>

    {/* ── 5. CUERPO DE LA VELA ── */}
    {/* Reborde exterior (cera solidificada) */}
    <ellipse cx="130" cy="148" rx="40" ry="37"
             fill="none" stroke="rgba(190,165,110,0.60)" strokeWidth="4"/>

    {/* Superficie top */}
    <ellipse cx="130" cy="146" rx="38" ry="35"
             fill={`url(#${p}-ct)`}/>

    {/* Anillos de textura en la superficie */}
    <ellipse cx="130" cy="146" rx="31" ry="29"
             fill="none" stroke="rgba(228,212,170,0.32)" strokeWidth="1.0"/>
    <ellipse cx="130" cy="146" rx="23" ry="21"
             fill="none" stroke="rgba(240,226,182,0.24)" strokeWidth="0.7"/>
    <ellipse cx="130" cy="146" rx="15" ry="14"
             fill="none" stroke="rgba(248,235,192,0.18)" strokeWidth="0.5"/>

    {/* ── 6. CERA LÍQUIDA CENTRAL ── */}
    <ellipse cx="129" cy="142" rx="17" ry="16"
             fill={`url(#${p}-liq)`}/>
    {/* Brillo especular sobre la cera líquida */}
    <ellipse cx="124" cy="136" rx="8" ry="5.5"
             fill="rgba(255,255,248,0.44)"
             transform="rotate(-18 124 136)"/>
    <ellipse cx="133" cy="140" rx="3.5" ry="2.5"
             fill="rgba(255,255,250,0.25)"
             transform="rotate(12 133 140)"/>

    {/* ── 7. MECHA ── */}
    {/* Tallo carbonizado (ligeramente curvo por el calor) */}
    <path d="M130,138 C130.9,133 131.7,128 131.0,122"
          stroke="#100900" strokeWidth="3.2" fill="none" strokeLinecap="round"/>
    <path d="M131.0,122 C131.4,119 131,116.5 130,115"
          stroke="#1e0e00" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
    {/* Brasa al base */}
    <circle cx="130.2" cy="115" r="4.5" fill="rgba(255,85,0,0.72)"/>
    <circle cx="130.2" cy="115" r="2.8" fill="rgba(255,195,35,0.88)"/>
    <circle cx="130.2" cy="115" r="1.2" fill="rgba(255,255,200,0.80)"/>

    {/* ── 8. LLAMA (desde arriba) — 4 capas ── */}
    {/* Capa exterior (anima lento) */}
    <ellipse className="flame-glow"
             cx="129" cy="113" rx="22" ry="20"
             fill={`url(#${p}-flo)`}/>
    {/* Capa media naranja (anima medio) */}
    <ellipse className="flame-mid"
             cx="129" cy="112" rx="13" ry="12"
             fill="rgba(255,228,88,0.94)"/>
    {/* Núcleo brillante (anima rápido) */}
    <ellipse className="flame-core"
             cx="129" cy="111.5" rx="6.5" ry="6"
             fill="rgba(255,255,195,0.99)"/>
    {/* Centro blanco puro (anima muy rápido) */}
    <ellipse className="flame-inner"
             cx="129" cy="112" rx="2.8" ry="2.5"
             fill="white"/>
  </svg>
);

/* ══════════════════════════════════════════════════════════════
   CLÚSTER DE AMATISTA (vista cenital)
   Roca matriz, múltiples cristales, facetas y destellos
   ══════════════════════════════════════════════════════════════ */
const AmethystSVG = ({ p }) => (
  <svg viewBox="0 0 160 140" width="148" height="130"
       xmlns="http://www.w3.org/2000/svg">
    <defs>
      {/* Roca matriz (gris-marrón rugosa) */}
      <radialGradient id={`${p}-rock`} cx="50%" cy="55%" r="58%">
        <stop offset="0%"   stopColor="#3e2e1c"/>
        <stop offset="45%"  stopColor="#2a1e10"/>
        <stop offset="80%"  stopColor="#1c1208"/>
        <stop offset="100%" stopColor="#100c05"/>
      </radialGradient>
      {/* Cristal principal — violeta profundo */}
      <radialGradient id={`${p}-am1`} cx="33%" cy="22%" r="74%">
        <stop offset="0%"   stopColor="#eeccff"/>
        <stop offset="18%"  stopColor="#c888f8"/>
        <stop offset="42%"  stopColor="#9040d8"/>
        <stop offset="68%"  stopColor="#6820ac"/>
        <stop offset="100%" stopColor="#3c0a72"/>
      </radialGradient>
      {/* Cristal secundario — púrpura medio */}
      <radialGradient id={`${p}-am2`} cx="60%" cy="28%" r="66%">
        <stop offset="0%"   stopColor="#ddb0ff"/>
        <stop offset="30%"  stopColor="#a868ec"/>
        <stop offset="62%"  stopColor="#7828c0"/>
        <stop offset="100%" stopColor="#4c1090"/>
      </radialGradient>
      {/* Cristal pequeño — lila más claro */}
      <radialGradient id={`${p}-am3`} cx="48%" cy="34%" r="60%">
        <stop offset="0%"   stopColor="#e0c4ff"/>
        <stop offset="38%"  stopColor="#ba88f4"/>
        <stop offset="75%"  stopColor="#8844cc"/>
        <stop offset="100%" stopColor="#5822a8"/>
      </radialGradient>
    </defs>

    {/* ── SOMBRA EN LA MESA ── */}
    <ellipse cx="80" cy="108" rx="74" ry="30"
             fill="rgba(0,0,0,0.45)"/>

    {/* ── ROCA MATRIZ IZQUIERDA ── */}
    <path d="M12,102 C8,90 10,78 16,70 C22,62 32,58 44,59
             C56,60 62,66 64,76 C66,86 62,96 56,102
             C50,108 40,110 30,108 C20,106 14,100 12,102 Z"
          fill={`url(#${p}-rock)`} opacity="0.92"/>
    {/* Textura de la roca */}
    <path d="M22,78 Q28,74 34,78 Q40,82 36,87"
          fill="rgba(255,255,255,0.07)"/>
    <path d="M48,90 Q54,88 58,92"
          fill="rgba(255,255,255,0.05)"/>
    <circle cx="18" cy="95" r="3" fill="rgba(0,0,0,0.22)"/>
    <circle cx="55" cy="86" r="2" fill="rgba(0,0,0,0.18)"/>

    {/* ── ROCA MATRIZ DERECHA ── */}
    <path d="M148,100 C152,88 150,76 144,68 C138,60 128,56 116,57
             C104,58 98,64 96,74 C94,84 98,94 104,100
             C110,106 120,108 130,106 C140,104 146,98 148,100 Z"
          fill={`url(#${p}-rock)`} opacity="0.88"/>
    <path d="M138,74 Q132,70 128,75 Q124,80 128,84"
          fill="rgba(255,255,255,0.06)"/>
    <circle cx="142" cy="94" r="2.5" fill="rgba(0,0,0,0.20)"/>

    {/* ── CRISTAL: pequeño fondo-izquierda ── */}
    <path d="M26,68 L38,34 L50,37 L54,66 L42,73 Z"
          fill={`url(#${p}-am3)`}
          stroke="rgba(205,165,255,0.55)" strokeWidth="0.7"/>
    {/* Faceta iluminada */}
    <path d="M38,34 L45,50 L38,60" fill="rgba(255,255,255,0.20)"/>
    {/* Borde oscuro (sombra de faceta) */}
    <path d="M38,34 L32,52 L38,60" fill="rgba(80,30,130,0.18)"/>
    <line x1="39" y1="35" x2="43" y2="42"
          stroke="rgba(255,255,255,0.62)" strokeWidth="1.8" strokeLinecap="round"/>

    {/* ── CRISTAL: mediano fondo-derecha ── */}
    <path d="M110,66 L124,26 L138,30 L142,64 L128,72 Z"
          fill={`url(#${p}-am2)`}
          stroke="rgba(215,175,255,0.52)" strokeWidth="0.8"/>
    <path d="M124,26 L132,46 L124,58" fill="rgba(255,255,255,0.18)"/>
    <path d="M124,26 L116,46 L124,58" fill="rgba(70,20,120,0.20)"/>
    <line x1="125" y1="27" x2="130" y2="36"
          stroke="rgba(255,255,255,0.58)" strokeWidth="2.0" strokeLinecap="round"/>
    {/* Bandeo de color interno */}
    <path d="M127,40 Q132,44 136,48"
          stroke="rgba(130,70,200,0.28)" strokeWidth="1.0" fill="none"/>
    <path d="M125,50 Q130,54 134,56"
          stroke="rgba(120,60,188,0.22)" strokeWidth="0.8" fill="none"/>

    {/* ── CRISTAL: pequeño extremo-derecha ── */}
    <path d="M132,70 L140,42 L150,46 L152,68 L144,75 Z"
          fill={`url(#${p}-am3)`}
          stroke="rgba(198,158,250,0.48)" strokeWidth="0.6"/>
    <path d="M140,42 L145,54 L140,62" fill="rgba(255,255,255,0.15)"/>
    <line x1="141" y1="43" x2="144" y2="50"
          stroke="rgba(255,255,255,0.48)" strokeWidth="1.4" strokeLinecap="round"/>

    {/* ── CRISTAL: centro-derecha, mediano ── */}
    <path d="M84,68 L96,22 L112,28 L114,66 L100,74 L84,70 Z"
          fill={`url(#${p}-am1)`}
          stroke="rgba(222,182,255,0.58)" strokeWidth="0.9"/>
    <path d="M96,22 L106,46 L96,62"  fill="rgba(255,255,255,0.24)"/>
    <path d="M96,22 L88,46 L96,62"   fill="rgba(60,10,110,0.20)"/>
    <path d="M106,46 L112,28 L114,50" fill="rgba(200,160,255,0.12)"/>
    <line x1="97" y1="23" x2="103" y2="32"
          stroke="rgba(255,255,255,0.65)" strokeWidth="2.2" strokeLinecap="round"/>
    {/* Zonas de color */}
    <path d="M99,35 Q104,38 108,42"
          stroke="rgba(140,80,210,0.30)" strokeWidth="1.0" fill="none"/>
    <path d="M97,46 Q102,50 106,52"
          stroke="rgba(130,68,200,0.24)" strokeWidth="0.8" fill="none"/>

    {/* ── CRISTAL: CENTRAL PRINCIPAL (más alto) ── */}
    <path d="M54,70 L68,4 L86,9 L90,68 L76,78 L58,74 Z"
          fill={`url(#${p}-am1)`}
          stroke="rgba(228,188,255,0.65)" strokeWidth="1.1"/>
    {/* Facetas principales */}
    <path d="M68,4 L78,32 L68,58"   fill="rgba(255,255,255,0.28)"/>
    <path d="M68,4 L60,32 L68,58"   fill="rgba(55,10,105,0.22)"/>
    <path d="M78,32 L86,9 L90,42"   fill="rgba(210,170,255,0.14)"/>
    <path d="M60,30 L54,70"
          stroke="rgba(180,140,235,0.38)" strokeWidth="0.7" fill="none"/>
    <path d="M78,30 L90,50"
          stroke="rgba(200,165,252,0.32)" strokeWidth="0.6" fill="none"/>
    {/* Bandeo interno horizontal */}
    <path d="M62,20 Q68,18 74,22"
          stroke="rgba(120,68,195,0.30)" strokeWidth="0.9" fill="none"/>
    <path d="M60,32 Q68,30 76,34"
          stroke="rgba(110,58,185,0.24)" strokeWidth="0.8" fill="none"/>
    <path d="M59,46 Q68,44 77,48"
          stroke="rgba(100,50,175,0.20)" strokeWidth="0.7" fill="none"/>
    {/* Inclusiones internas (burbujas) */}
    <circle cx="71" cy="38" r="1.5" fill="rgba(185,145,255,0.52)"/>
    <circle cx="67" cy="52" r="1.0" fill="rgba(200,160,255,0.42)"/>
    {/* Reflejo especular primario */}
    <line x1="69" y1="5"  x2="76" y2="16"
          stroke="rgba(255,255,255,0.75)" strokeWidth="2.8" strokeLinecap="round"/>
    {/* Secundario */}
    <line x1="67" y1="9"  x2="72" y2="16"
          stroke="rgba(255,255,255,0.42)" strokeWidth="1.6" strokeLinecap="round"/>

    {/* ── DESTELLOS PUNTIFORMES ── */}
    <circle cx="69" cy="5"   r="2.8" fill="white" opacity="0.94"/>
    <circle cx="97" cy="23"  r="2.0" fill="white" opacity="0.82"/>
    <circle cx="39" cy="35"  r="1.6" fill="white" opacity="0.74"/>
    <circle cx="125" cy="27" r="1.4" fill="white" opacity="0.68"/>
    <circle cx="141" cy="43" r="1.1" fill="white" opacity="0.60"/>
    <circle cx="74"  cy="14" r="0.9" fill="white" opacity="0.55"/>
  </svg>
);

/* ══════════════════════════════════════════════════════════════
   AMULETO — OJO DE RA (medallón de latón envejecido)
   Vista cenital con eslabones de cadena y patina de antigüedad
   ══════════════════════════════════════════════════════════════ */
const AmuletSVG = ({ p }) => (
  <svg viewBox="0 0 165 165" width="152" height="152"
       xmlns="http://www.w3.org/2000/svg">
    <defs>
      {/* Base del disco — bronce envejecido */}
      <radialGradient id={`${p}-disc`} cx="33%" cy="28%" r="80%">
        <stop offset="0%"   stopColor="#d8aa2e"/>
        <stop offset="18%"  stopColor="#ba8c10"/>
        <stop offset="40%"  stopColor="#906808"/>
        <stop offset="64%"  stopColor="#6c4c06"/>
        <stop offset="88%"  stopColor="#4a3205"/>
        <stop offset="100%" stopColor="#2e1e02"/>
      </radialGradient>
      {/* Pátina verde-oliva en recesos */}
      <radialGradient id={`${p}-pat`} cx="68%" cy="72%" r="52%">
        <stop offset="0%"   stopColor="rgba(72,92,38,0.42)"/>
        <stop offset="42%"  stopColor="rgba(58,76,28,0.22)"/>
        <stop offset="100%" stopColor="rgba(40,58,18,0.00)"/>
      </radialGradient>
      {/* Iris del ojo */}
      <radialGradient id={`${p}-iris`} cx="40%" cy="35%" r="66%">
        <stop offset="0%"   stopColor="#5c3490"/>
        <stop offset="35%"  stopColor="#38208a"/>  {/* deep indigo */}
        <stop offset="70%"  stopColor="#1e1050"/>
        <stop offset="100%" stopColor="#0c0820"/>
      </radialGradient>
      {/* Metal de los eslabones */}
      <linearGradient id={`${p}-chain`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="#d2a428"/>
        <stop offset="30%"  stopColor="#8a6004"/>
        <stop offset="65%"  stopColor="#c08c12"/>
        <stop offset="100%" stopColor="#6a4202"/>
      </linearGradient>
      {/* Brillo especular de superficie metálica */}
      <radialGradient id={`${p}-spec`} cx="32%" cy="28%" r="55%">
        <stop offset="0%"   stopColor="rgba(255,248,185,0.45)"/>
        <stop offset="50%"  stopColor="rgba(255,230,110,0.15)"/>
        <stop offset="100%" stopColor="rgba(0,0,0,0.00)"/>
      </radialGradient>
    </defs>

    {/* ── ESLABONES DE CADENA (sección visible caída en la mesa) ── */}
    <g stroke={`url(#${p}-chain)`} fill="none">
      <ellipse cx="9"  cy="88" rx="10" ry="6"   strokeWidth="2.5" transform="rotate(-38 9 88)"/>
      <ellipse cx="18" cy="80" rx="10" ry="6"   strokeWidth="2.2" transform="rotate( 8 18 80)"/>
      <ellipse cx="27" cy="84" rx="9.5" ry="5.5" strokeWidth="2.0" transform="rotate(-28 27 84)"/>
      <ellipse cx="36" cy="76" rx="9"  cy="76" ry="5.2" strokeWidth="1.8" transform="rotate(18 36 76)"/>
      <ellipse cx="44" cy="80" rx="8.5" ry="5"  strokeWidth="1.6" transform="rotate(-14 44 80)"/>
      <ellipse cx="52" cy="74" rx="8"  ry="4.8" strokeWidth="1.5" transform="rotate(10 52 74)"/>
    </g>
    {/* Huecos oscuros en los eslabones */}
    {[
      [9,88,-38], [18,80,8], [27,84,-28], [36,76,18], [44,80,-14], [52,74,10]
    ].map(([cx,cy,rot], i) => (
      <ellipse key={i} cx={cx} cy={cy} rx={7-i*0.3} ry={4-i*0.2}
               fill="rgba(15,8,1,0.55)"
               transform={`rotate(${rot} ${cx} ${cy})`}/>
    ))}

    {/* ── SOMBRA DEL DISCO ── */}
    <ellipse cx="92" cy="94" rx="60" ry="58" fill="rgba(0,0,0,0.52)"/>

    {/* ── DISCO BASE ── */}
    <circle cx="88" cy="90" r="60" fill={`url(#${p}-disc)`}/>

    {/* Pátina de envejecimiento */}
    <circle cx="88" cy="90" r="60" fill={`url(#${p}-pat)`}/>

    {/* Brillo especular (luz desde arriba-izquierda) */}
    <circle cx="88" cy="90" r="60" fill={`url(#${p}-spec)`}/>

    {/* ── RIM EXTERIOR ELEVADO (más brillante) ── */}
    <circle cx="88" cy="90" r="60" fill="none"
            stroke="rgba(224,178,32,0.65)" strokeWidth="4.5"/>
    <circle cx="88" cy="90" r="57" fill="none"
            stroke="rgba(185,140,14,0.42)" strokeWidth="1.5"/>

    {/* ── ANILLOS GRABADOS ── */}
    <circle cx="88" cy="90" r="52" fill="none"
            stroke="rgba(95,68,8,0.60)" strokeWidth="1.4"/>
    <circle cx="88" cy="90" r="45" fill="none"
            stroke="rgba(85,60,6,0.50)" strokeWidth="1.0"/>
    <circle cx="88" cy="90" r="38" fill="none"
            stroke="rgba(75,52,5,0.44)" strokeWidth="0.8"/>
    <circle cx="88" cy="90" r="31" fill="none"
            stroke="rgba(68,46,4,0.38)" strokeWidth="0.6"/>

    {/* ── MARCAS RADIALES GRABADAS ── */}
    {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => {
      const rad = (deg * Math.PI) / 180;
      const r1 = 52, r2 = i % 3 === 0 ? 45 : 48;
      return (
        <line key={i}
          x1={88 + Math.cos(rad)*r1} y1={90 + Math.sin(rad)*r1}
          x2={88 + Math.cos(rad)*r2} y2={90 + Math.sin(rad)*r2}
          stroke={`rgba(90,64,7,${i % 3 === 0 ? 0.58 : 0.40})`}
          strokeWidth={i % 3 === 0 ? 1.4 : 0.8}
        />
      );
    })}

    {/* ── ÁREA DEL OJO (receso ovalado grabado) ── */}
    <path d="M60,88 Q69,74 88,76 Q107,74 116,88 Q107,102 88,100 Q69,102 60,88 Z"
          fill="rgba(38,22,4,0.38)"
          stroke="rgba(155,118,15,0.68)" strokeWidth="1.6"/>

    {/* Párpado superior (línea arqueada) */}
    <path d="M60,88 Q74,80 88,80 Q102,80 116,88"
          fill="none" stroke="rgba(165,128,18,0.55)" strokeWidth="1.2"/>
    {/* Párpado inferior */}
    <path d="M60,88 Q74,96 88,96 Q102,96 116,88"
          fill="none" stroke="rgba(145,108,12,0.42)" strokeWidth="0.9"/>

    {/* ── IRIS ── */}
    <circle cx="88" cy="88" r="14"
            fill={`url(#${p}-iris)`}
            stroke="rgba(155,115,14,0.62)" strokeWidth="1.3"/>
    {/* Anillos del iris */}
    <circle cx="88" cy="88" r="11" fill="none"
            stroke="rgba(95,55,130,0.42)" strokeWidth="0.9"/>
    <circle cx="88" cy="88" r="8" fill="none"
            stroke="rgba(80,42,115,0.35)" strokeWidth="0.7"/>

    {/* ── PUPILA ── */}
    <circle cx="88" cy="88" r="6.5" fill="rgba(4,2,14,0.99)"/>

    {/* Reflejo córnea (doble punto de luz) */}
    <ellipse cx="84.5" cy="84.5" rx="3" ry="2.0"
             fill="rgba(255,255,225,0.45)"
             transform="rotate(-28 84.5 84.5)"/>
    <circle cx="91" cy="85.5" r="1.0" fill="rgba(255,255,240,0.28)"/>

    {/* ── MARCA DE LÁGRIMA (símbolo de Ra) ── */}
    <path d="M88,102 Q85,110 82,116 Q81,121 83,124"
          stroke="rgba(178,138,14,0.58)" strokeWidth="1.8"
          fill="none" strokeLinecap="round"/>
    <path d="M88,102 Q89.5,107 88,111"
          stroke="rgba(158,118,10,0.38)" strokeWidth="1.0"
          fill="none" strokeLinecap="round"/>

    {/* ── EXTENSIONES ALARES ── */}
    <path d="M60,88 Q52,83 42,80"
          stroke="rgba(178,138,14,0.48)" strokeWidth="1.2"
          fill="none" strokeLinecap="round"/>
    <path d="M61,85 Q54,80 46,77"
          stroke="rgba(158,118,10,0.32)" strokeWidth="0.8"
          fill="none" strokeLinecap="round"/>
    <path d="M116,88 Q124,83 134,80"
          stroke="rgba(178,138,14,0.48)" strokeWidth="1.2"
          fill="none" strokeLinecap="round"/>
    <path d="M115,85 Q122,80 130,77"
          stroke="rgba(158,118,10,0.32)" strokeWidth="0.8"
          fill="none" strokeLinecap="round"/>

    {/* ── RAYAS DE CINCEL (marcas de fabricación) ── */}
    <path d="M52,58 Q60,52 70,54"
          stroke="rgba(255,248,185,0.22)" strokeWidth="1.5"
          fill="none" strokeLinecap="round"/>
    <path d="M50,63 Q56,57 64,59"
          stroke="rgba(255,245,180,0.14)" strokeWidth="1.0"
          fill="none" strokeLinecap="round"/>

    {/* ── MANCHAS DE PÁTINA (puntos de óxido) ── */}
    <circle cx="106" cy="66" r="2.5" fill="rgba(72,92,38,0.40)"/>
    <circle cx="98"  cy="110" r="2.0" fill="rgba(65,84,32,0.34)"/>
    <circle cx="70"  cy="104" r="2.2" fill="rgba(68,88,35,0.32)"/>
    <circle cx="112" cy="92"  r="1.5" fill="rgba(62,80,30,0.28)"/>
    <circle cx="64"  cy="72"  r="1.2" fill="rgba(70,90,36,0.25)"/>
  </svg>
);

/* ── Componente principal ───────────────────────────────── */
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
