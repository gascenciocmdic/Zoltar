import { useState, useEffect } from 'react';
import { useTheme } from '../lib/themeContext';
import logoDark from '../assets/Logo_Zoltar_oscuro.png';
import logoClaro from '../assets/Logo_Zoltar_claro.png';

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

const TAGLINES = [
  'Descubre quién fuiste.',
  'Tus vidas pasadas te hablan.',
  'El misterio de tu alma espera.',
];

export default function LandingScreen({ onEnter }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const [taglineIdx, setTaglineIdx] = useState(0);
  const [taglineVisible, setTaglineVisible] = useState(true);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const cycle = setInterval(() => {
      setTaglineVisible(false);
      setTimeout(() => {
        setTaglineIdx((i) => (i + 1) % TAGLINES.length);
        setTaglineVisible(true);
      }, 500);
    }, 3200);
    return () => clearInterval(cycle);
  }, []);

  function handleCTA() {
    setEntered(true);
    setTimeout(onEnter, 400);
  }

  // Theme-dependent tokens
  const bg = isLight
    ? 'linear-gradient(180deg, rgba(245,240,255,0.92) 0%, rgba(245,240,255,0.80) 100%)'
    : 'linear-gradient(180deg, rgba(5,0,15,0.85) 0%, rgba(5,0,15,0.7) 100%)';
  const titleColor = isLight ? '#4a3560' : '#ffd700';
  const taglineColor = isLight ? '#7c6fa0' : '#c4b5fd';
  const ctaBg = isLight
    ? 'linear-gradient(135deg, #7c6fa0 0%, #5b8db8 100%)'
    : 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #1d4ed8 100%)';
  const ctaBorder = isLight ? 'rgba(124,111,160,0.4)' : 'rgba(167,139,250,0.4)';
  const ctaShadow = isLight
    ? '0 0 40px rgba(124,111,160,0.4), 0 4px 20px rgba(0,0,0,0.15)'
    : '0 0 40px rgba(124,58,237,0.5), 0 4px 20px rgba(0,0,0,0.5)';
  const ctaShadowHover = isLight
    ? '0 0 60px rgba(124,111,160,0.6), 0 4px 24px rgba(0,0,0,0.2)'
    : '0 0 60px rgba(124,58,237,0.7), 0 4px 24px rgba(0,0,0,0.6)';
  const hookColor = isLight ? '#3a7d6e' : '#6ee7b7';
  const pillBg = isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.04)';
  const pillBorder = isLight ? 'rgba(124,111,160,0.2)' : 'rgba(255,215,0,0.12)';
  const pillTitleColor = isLight ? '#2d2540' : '#e5e7eb';
  const pillDescColor = isLight ? '#6b5f8a' : '#6b7280';
  const priceColor = isLight ? '#b8860b' : '#ffd700';
  const priceSubColor = isLight ? '#7c6fa0' : '#9ca3af';
  const priceLabelColor = isLight ? '#9b8ab0' : '#6b7280';
  const footerColor = isLight ? '#7c6fa0' : '#374151';
  const footerLinkColor = isLight ? '#5b4f8a' : '#4b5563';
  const toggleBg = isLight ? 'rgba(124,111,160,0.15)' : 'rgba(255,255,255,0.08)';
  const toggleBorder = isLight ? 'rgba(124,111,160,0.3)' : 'rgba(255,255,255,0.15)';
  const toggleColor = isLight ? '#4a3560' : '#e5e7eb';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center',
        padding: 'max(60px, 5vh) 16px 24px',
        background: bg,
        backdropFilter: 'blur(4px)',
        opacity: entered ? 0 : 1,
        transition: 'opacity 0.4s ease',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
        style={{
          position: 'absolute', top: 16, right: 16,
          background: toggleBg,
          border: `1px solid ${toggleBorder}`,
          borderRadius: 50, width: 40, height: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 18,
          color: toggleColor,
          transition: 'all 0.2s',
        }}
      >
        {isLight ? '🌙' : '☀️'}
      </button>

      {/* Logo */}
      <div style={{ marginBottom: 8, lineHeight: 0 }}>
        {isLight ? (
          <img
            src={logoClaro}
            alt="Zoltar"
            style={{
              width: 'clamp(200px, 55vw, 280px)',
              height: 'auto',
              display: 'block',
              filter: 'drop-shadow(0 2px 12px rgba(124,111,160,0.22))',
            }}
          />
        ) : (
          <img
            src={logoDark}
            alt="Zoltar"
            style={{
              width: 'clamp(200px, 55vw, 280px)',
              height: 'auto',
              display: 'block',
              mixBlendMode: 'screen',
              filter: 'drop-shadow(0 0 24px rgba(255,215,0,0.4))',
            }}
          />
        )}
      </div>

      {/* Title */}
      <h1 style={{
        color: titleColor, fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
        fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
        textAlign: 'center', margin: '0 0 12px',
        textShadow: isLight ? 'none' : '0 0 40px rgba(255,215,0,0.5)',
        fontFamily: 'Georgia, serif',
        transition: 'color 0.4s',
      }}>
        El Oráculo de Vidas Pasadas
      </h1>

      {/* Rotating tagline */}
      <p style={{
        color: taglineColor, fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
        fontStyle: 'italic', textAlign: 'center', marginBottom: 40,
        minHeight: '1.8em',
        opacity: taglineVisible ? 1 : 0,
        transform: taglineVisible ? 'translateY(0)' : 'translateY(-6px)',
        transition: 'opacity 0.4s, transform 0.4s, color 0.4s',
        fontFamily: 'Georgia, serif',
      }}>
        {TAGLINES[taglineIdx]}
      </p>

      {/* CTA principal */}
      <button
        onClick={handleCTA}
        style={{
          background: ctaBg,
          border: `1px solid ${ctaBorder}`,
          borderRadius: 50, padding: '16px 48px',
          color: '#fff', fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
          fontWeight: 700, cursor: 'pointer', letterSpacing: '0.06em',
          boxShadow: ctaShadow,
          transition: 'transform 0.15s, box-shadow 0.15s',
          fontFamily: 'inherit',
          marginBottom: 12,
          animation: 'pulseBtn 2.5s ease-in-out infinite',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.04)';
          e.currentTarget.style.boxShadow = ctaShadowHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = ctaShadow;
        }}
      >
        ✦ Iniciar mi lectura
      </button>

      {/* Free credits hook */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        color: hookColor, fontSize: 'clamp(11px, 2.8vw, 13px)', marginBottom: 28,
        fontWeight: 600, transition: 'color 0.4s', textAlign: 'center',
      }}>
        <span>🎁</span>
        <span>100 créditos gratis al registrarte · Sin tarjeta requerida</span>
      </div>

      {/* Feature pills */}
      <div style={{
        display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center',
        width: '100%', maxWidth: 680, marginBottom: 24, padding: '0 8px',
      }}>
        {FEATURES.map((f) => (
          <div key={f.title} style={{
            background: pillBg,
            border: `1px solid ${pillBorder}`,
            borderRadius: 14, padding: '12px 14px',
            flex: '1 1 140px', maxWidth: 200, minWidth: 120,
            textAlign: 'center', transition: 'background 0.4s, border-color 0.4s',
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{f.icon}</div>
            <div style={{ color: pillTitleColor, fontWeight: 700, fontSize: 12, marginBottom: 4, transition: 'color 0.4s' }}>
              {f.title}
            </div>
            <div style={{ color: pillDescColor, fontSize: 11, lineHeight: 1.5, transition: 'color 0.4s' }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Pricing anchor */}
      <div style={{
        display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center',
        marginBottom: 20, padding: '0 8px', width: '100%', maxWidth: 420,
      }}>
        {[
          { label: 'Iniciado', credits: '150 cr', price: '$4.99' },
          { label: 'Explorador', credits: '400 cr', price: '$9.99', popular: true },
          { label: 'Oráculo', credits: '1100 cr', price: '$19.99' },
        ].map((pkg) => (
          <div key={pkg.label} style={{
            background: pkg.popular
              ? (isLight ? 'rgba(124,111,160,0.15)' : 'rgba(124,58,237,0.15)')
              : (isLight ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.03)'),
            border: `1px solid ${pkg.popular
              ? (isLight ? 'rgba(124,111,160,0.4)' : 'rgba(167,139,250,0.4)')
              : (isLight ? 'rgba(124,111,160,0.15)' : 'rgba(255,255,255,0.08)')}`,
            borderRadius: 12, padding: '10px 18px', textAlign: 'center', minWidth: 100,
            position: 'relative', transition: 'background 0.4s, border-color 0.4s',
          }}>
            {pkg.popular && (
              <div style={{
                position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                background: isLight ? '#7c6fa0' : '#7c3aed',
                color: '#fff', fontSize: 10, fontWeight: 700,
                padding: '2px 10px', borderRadius: 99, letterSpacing: '0.06em', whiteSpace: 'nowrap',
              }}>
                MÁS POPULAR
              </div>
            )}
            <div style={{ color: priceColor, fontWeight: 800, fontSize: 16, transition: 'color 0.4s' }}>{pkg.price}</div>
            <div style={{ color: priceSubColor, fontSize: 11, marginTop: 2, transition: 'color 0.4s' }}>{pkg.credits}</div>
            <div style={{ color: priceLabelColor, fontSize: 10, marginTop: 1, transition: 'color 0.4s' }}>{pkg.label}</div>
          </div>
        ))}
      </div>

      {/* Footer micro-copy */}
      <p style={{ color: footerColor, fontSize: 11, textAlign: 'center', maxWidth: 360, lineHeight: 1.6, transition: 'color 0.4s' }}>
        Experiencia de entretenimiento digital. Las lecturas son generadas por IA
        con fines de exploración personal, no constituyen asesoramiento profesional.{' '}
        <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: footerLinkColor }}>
          Términos
        </a>
        {' · '}
        <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: footerLinkColor }}>
          Privacidad
        </a>
      </p>

      <style>{`
        @keyframes pulseBtn {
          0%, 100% { box-shadow: ${ctaShadow}; }
          50% { box-shadow: ${ctaShadowHover}; }
        }
      `}</style>
    </div>
  );
}
