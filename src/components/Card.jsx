import React from 'react';
import { useTheme } from '../lib/themeContext';
import './Card.css';

/**
 * SVG orgánico: ramas y raíces con brotes.
 * Dark mode → tallado en piedra (trazos dobles inset, fondo pizarra).
 * Light mode → bordado en hilos finos (trazos discontinuos, oro + violeta).
 */
const CardBackSVG = ({ isLight }) => {
  const s1  = isLight ? '#b8841e' : '#8898bc';   // hilo/trazo principal
  const s2  = isLight ? '#7c3aed' : '#5a6a98';   // hilo/trazo secundario
  const b1  = isLight ? '#b8841e' : '#7888ac';   // brote 1
  const b2  = isLight ? '#7c3aed' : '#4e5e8e';   // brote 2
  const sw  = isLight ? 1.1  : 1.9;             // ancho principal
  const sw2 = isLight ? 0.75 : 1.3;             // ancho secundario
  const da  = isLight ? '4 1.5'   : undefined;  // puntada bordado principal
  const da2 = isLight ? '2.5 1.5' : undefined;  // puntada secundaria

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 140 220"
      className={`card-back-svg${isLight ? ' card-back-svg-light' : ''}`}
      aria-hidden="true"
    >
      {/* ══════════════ RAMA SUPERIOR IZQUIERDA ══════════════ */}
      <path d="M 7 0 C 9 11 4 21 9 31 C 13 40 8 50 12 59"
        stroke={s1} strokeWidth={sw} fill="none" strokeLinecap="round" strokeDasharray={da}/>
      {/* sub-rama hacia el borde */}
      <path d="M 5 21 C -1 17 -1 9 1 2"
        stroke={s2} strokeWidth={sw2} fill="none" strokeLinecap="round" strokeDasharray={da2}/>
      {/* sub-rama hacia abajo-izquierda */}
      <path d="M 9 50 C 2 48 -1 55 0 63"
        stroke={s2} strokeWidth={sw2} fill="none" strokeLinecap="round" strokeDasharray={da2}/>
      {/* twig diagonal hacia el centro */}
      <path d="M 9 31 C 17 25 25 23 30 27"
        stroke={s2} strokeWidth={sw2} fill="none" strokeLinecap="round" strokeDasharray={da2}/>

      {/* ══════════════ RAMA SUPERIOR DERECHA (espejo) ══════════════ */}
      <path d="M 133 0 C 131 11 136 21 131 31 C 127 40 132 50 128 59"
        stroke={s1} strokeWidth={sw} fill="none" strokeLinecap="round" strokeDasharray={da}/>
      <path d="M 135 21 C 141 17 141 9 139 2"
        stroke={s2} strokeWidth={sw2} fill="none" strokeLinecap="round" strokeDasharray={da2}/>
      <path d="M 131 50 C 138 48 141 55 140 63"
        stroke={s2} strokeWidth={sw2} fill="none" strokeLinecap="round" strokeDasharray={da2}/>
      <path d="M 131 31 C 123 25 115 23 110 27"
        stroke={s2} strokeWidth={sw2} fill="none" strokeLinecap="round" strokeDasharray={da2}/>

      {/* ══════════════ ARCO CENTRAL SUPERIOR ══════════════ */}
      <path d="M 36 2 C 50 0 60 5 70 3 C 80 1 90 1 104 2"
        stroke={s1} strokeWidth={sw} fill="none" strokeLinecap="round" strokeDasharray={da}/>
      <path d="M 50 2 C 48 9 49 16 45 22"
        stroke={s2} strokeWidth={sw2} fill="none" strokeLinecap="round" strokeDasharray={da2}/>
      <path d="M 90 2 C 92 9 91 16 95 22"
        stroke={s2} strokeWidth={sw2} fill="none" strokeLinecap="round" strokeDasharray={da2}/>

      {/* ══════════════ TENDRIL LATERAL IZQUIERDO ══════════════ */}
      <path d="M 0 76 C 7 79 11 87 9 95 C 7 103 2 109 4 118"
        stroke={s1} strokeWidth={sw} fill="none" strokeLinecap="round" strokeDasharray={da}/>
      <path d="M 9 95 C 2 92 -1 85 0 77"
        stroke={s2} strokeWidth={sw2} fill="none" strokeLinecap="round" strokeDasharray={da2}/>
      <path d="M 4 118 C -1 116 -1 124 1 130"
        stroke={s2} strokeWidth={sw2} fill="none" strokeLinecap="round" strokeDasharray={da2}/>

      {/* ══════════════ TENDRIL LATERAL DERECHO (espejo) ══════════════ */}
      <path d="M 140 76 C 133 79 129 87 131 95 C 133 103 138 109 136 118"
        stroke={s1} strokeWidth={sw} fill="none" strokeLinecap="round" strokeDasharray={da}/>
      <path d="M 131 95 C 138 92 141 85 140 77"
        stroke={s2} strokeWidth={sw2} fill="none" strokeLinecap="round" strokeDasharray={da2}/>
      <path d="M 136 118 C 141 116 141 124 139 130"
        stroke={s2} strokeWidth={sw2} fill="none" strokeLinecap="round" strokeDasharray={da2}/>

      {/* ══════════════ RAÍZ INFERIOR IZQUIERDA ══════════════ */}
      <path d="M 7 220 C 9 209 4 199 9 189 C 13 180 8 170 12 161"
        stroke={s1} strokeWidth={sw} fill="none" strokeLinecap="round" strokeDasharray={da}/>
      <path d="M 5 199 C -1 203 -1 211 1 218"
        stroke={s2} strokeWidth={sw2} fill="none" strokeLinecap="round" strokeDasharray={da2}/>
      <path d="M 9 170 C 2 172 -1 166 0 157"
        stroke={s2} strokeWidth={sw2} fill="none" strokeLinecap="round" strokeDasharray={da2}/>
      <path d="M 9 189 C 17 195 25 197 30 193"
        stroke={s2} strokeWidth={sw2} fill="none" strokeLinecap="round" strokeDasharray={da2}/>

      {/* ══════════════ RAÍZ INFERIOR DERECHA (espejo) ══════════════ */}
      <path d="M 133 220 C 131 209 136 199 131 189 C 127 180 132 170 128 161"
        stroke={s1} strokeWidth={sw} fill="none" strokeLinecap="round" strokeDasharray={da}/>
      <path d="M 135 199 C 141 203 141 211 139 218"
        stroke={s2} strokeWidth={sw2} fill="none" strokeLinecap="round" strokeDasharray={da2}/>
      <path d="M 131 170 C 138 172 141 166 140 157"
        stroke={s2} strokeWidth={sw2} fill="none" strokeLinecap="round" strokeDasharray={da2}/>
      <path d="M 131 189 C 123 195 115 197 110 193"
        stroke={s2} strokeWidth={sw2} fill="none" strokeLinecap="round" strokeDasharray={da2}/>

      {/* ══════════════ ARCO CENTRAL INFERIOR ══════════════ */}
      <path d="M 36 218 C 50 220 60 215 70 217 C 80 219 90 219 104 218"
        stroke={s1} strokeWidth={sw} fill="none" strokeLinecap="round" strokeDasharray={da}/>
      <path d="M 50 218 C 48 211 49 204 45 198"
        stroke={s2} strokeWidth={sw2} fill="none" strokeLinecap="round" strokeDasharray={da2}/>
      <path d="M 90 218 C 92 211 91 204 95 198"
        stroke={s2} strokeWidth={sw2} fill="none" strokeLinecap="round" strokeDasharray={da2}/>

      {/* ══════════════ BROTES — parte superior ══════════════ */}
      <ellipse cx="1"   cy="2"  rx="2.4" ry="3.4" transform="rotate(-35 1 2)"    fill={b2}/>
      <ellipse cx="0"   cy="63" rx="2.1" ry="3.2" transform="rotate(12 0 63)"    fill={b2}/>
      <ellipse cx="30"  cy="26" rx="2.8" ry="1.8"                                 fill={b2}/>
      <ellipse cx="139" cy="2"  rx="2.4" ry="3.4" transform="rotate(35 139 2)"   fill={b2}/>
      <ellipse cx="140" cy="63" rx="2.1" ry="3.2" transform="rotate(-12 140 63)" fill={b2}/>
      <ellipse cx="110" cy="26" rx="2.8" ry="1.8"                                 fill={b2}/>
      <ellipse cx="45"  cy="22" rx="2.3" ry="3.1" transform="rotate(-22 45 22)"  fill={b1}/>
      <ellipse cx="95"  cy="22" rx="2.3" ry="3.1" transform="rotate(22 95 22)"   fill={b1}/>

      {/* ══════════════ BROTES — laterales ══════════════ */}
      <ellipse cx="1"   cy="130" rx="2.1" ry="3.2" transform="rotate(8 1 130)"    fill={b1}/>
      <ellipse cx="139" cy="130" rx="2.1" ry="3.2" transform="rotate(-8 139 130)" fill={b1}/>

      {/* ══════════════ BROTES — parte inferior ══════════════ */}
      <ellipse cx="1"   cy="218" rx="2.4" ry="3.4" transform="rotate(35 1 218)"    fill={b2}/>
      <ellipse cx="0"   cy="157" rx="2.1" ry="3.2" transform="rotate(-12 0 157)"   fill={b2}/>
      <ellipse cx="30"  cy="194" rx="2.8" ry="1.8"                                  fill={b2}/>
      <ellipse cx="139" cy="218" rx="2.4" ry="3.4" transform="rotate(-35 139 218)" fill={b2}/>
      <ellipse cx="140" cy="157" rx="2.1" ry="3.2" transform="rotate(12 140 157)"  fill={b2}/>
      <ellipse cx="110" cy="194" rx="2.8" ry="1.8"                                  fill={b2}/>
      <ellipse cx="45"  cy="198" rx="2.3" ry="3.1" transform="rotate(22 45 198)"   fill={b1}/>
      <ellipse cx="95"  cy="198" rx="2.3" ry="3.1" transform="rotate(-22 95 198)"  fill={b1}/>

      {/* Bordado: nudo de hilo en bifurcaciones */}
      {isLight && (
        <>
          <circle cx="9"   cy="31"  r="1.9" fill={s1} opacity="0.68"/>
          <circle cx="131" cy="31"  r="1.9" fill={s1} opacity="0.68"/>
          <circle cx="9"   cy="95"  r="1.7" fill={s1} opacity="0.6"/>
          <circle cx="131" cy="95"  r="1.7" fill={s1} opacity="0.6"/>
          <circle cx="9"   cy="189" r="1.9" fill={s1} opacity="0.68"/>
          <circle cx="131" cy="189" r="1.9" fill={s1} opacity="0.68"/>
          <circle cx="70"  cy="3"   r="1.5" fill={s2} opacity="0.55"/>
          <circle cx="70"  cy="217" r="1.5" fill={s2} opacity="0.55"/>
        </>
      )}

      {/* Tallado: puntos de esquina */}
      {!isLight && (
        <>
          <circle cx="4"   cy="4"   r="2.2" fill={s2} opacity="0.5"/>
          <circle cx="136" cy="4"   r="2.2" fill={s2} opacity="0.5"/>
          <circle cx="4"   cy="216" r="2.2" fill={s2} opacity="0.5"/>
          <circle cx="136" cy="216" r="2.2" fill={s2} opacity="0.5"/>
        </>
      )}
    </svg>
  );
};

const Card = ({ card, isSelected, onSelect, isFaceUp, style, className, logoSrc }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

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
          <CardBackSVG isLight={isLight} />
          <div className="card-back-content">
            {logoSrc ? (
              <img src={logoSrc} alt="Zoltar" className="card-loading-logo" />
            ) : (
              <div className="card-pattern"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
