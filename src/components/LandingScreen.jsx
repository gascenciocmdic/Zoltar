import { useState, useEffect } from 'react';

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

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '20px 16px',
        background: 'linear-gradient(180deg, rgba(5,0,15,0.85) 0%, rgba(5,0,15,0.7) 100%)',
        backdropFilter: 'blur(4px)',
        opacity: entered ? 0 : 1,
        transition: 'opacity 0.4s ease',
        overflowY: 'auto',
      }}
    >
      {/* Logo */}
      <div style={{
        width: 220, height: 110,
        backgroundImage: "url('/zoltar-logo.jpg')",
        backgroundSize: 'contain', backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        mixBlendMode: 'screen',
        marginBottom: 8,
        filter: 'drop-shadow(0 0 24px rgba(255,215,0,0.4))',
      }} />

      {/* Title */}
      <h1 style={{
        color: '#ffd700', fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
        fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
        textAlign: 'center', margin: '0 0 12px',
        textShadow: '0 0 40px rgba(255,215,0,0.5)',
        fontFamily: 'Georgia, serif',
      }}>
        El Oráculo de Vidas Pasadas
      </h1>

      {/* Rotating tagline */}
      <p style={{
        color: '#c4b5fd', fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
        fontStyle: 'italic', textAlign: 'center', marginBottom: 40,
        minHeight: '1.8em',
        opacity: taglineVisible ? 1 : 0,
        transform: taglineVisible ? 'translateY(0)' : 'translateY(-6px)',
        transition: 'opacity 0.4s, transform 0.4s',
        fontFamily: 'Georgia, serif',
      }}>
        {TAGLINES[taglineIdx]}
      </p>

      {/* CTA principal */}
      <button
        onClick={handleCTA}
        style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #1d4ed8 100%)',
          border: '1px solid rgba(167,139,250,0.4)',
          borderRadius: 50, padding: '16px 48px',
          color: '#fff', fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
          fontWeight: 700, cursor: 'pointer', letterSpacing: '0.06em',
          boxShadow: '0 0 40px rgba(124,58,237,0.5), 0 4px 20px rgba(0,0,0,0.5)',
          transition: 'transform 0.15s, box-shadow 0.15s',
          fontFamily: 'inherit',
          marginBottom: 12,
          animation: 'pulseBtn 2.5s ease-in-out infinite',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.04)';
          e.currentTarget.style.boxShadow = '0 0 60px rgba(124,58,237,0.7), 0 4px 24px rgba(0,0,0,0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 0 40px rgba(124,58,237,0.5), 0 4px 20px rgba(0,0,0,0.5)';
        }}
      >
        ✦ Iniciar mi lectura
      </button>

      {/* Free credits hook */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        color: '#6ee7b7', fontSize: 13, marginBottom: 40,
        fontWeight: 600,
      }}>
        <span>🎁</span>
        <span>100 créditos gratis al registrarte · Sin tarjeta requerida</span>
      </div>

      {/* Feature pills */}
      <div style={{
        display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center',
        maxWidth: 680, marginBottom: 32,
      }}>
        {FEATURES.map((f) => (
          <div key={f.title} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,215,0,0.12)',
            borderRadius: 14, padding: '16px 20px', flex: '1 1 180px', maxWidth: 200,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
            <div style={{ color: '#e5e7eb', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
              {f.title}
            </div>
            <div style={{ color: '#6b7280', fontSize: 12, lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Pricing anchor */}
      <div style={{
        display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center',
        marginBottom: 24,
      }}>
        {[
          { label: 'Iniciado', credits: '150 cr', price: '$4.99' },
          { label: 'Explorador', credits: '400 cr', price: '$9.99', popular: true },
          { label: 'Oráculo', credits: '1100 cr', price: '$19.99' },
        ].map((pkg) => (
          <div key={pkg.label} style={{
            background: pkg.popular ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${pkg.popular ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 12, padding: '10px 18px', textAlign: 'center', minWidth: 100,
            position: 'relative',
          }}>
            {pkg.popular && (
              <div style={{
                position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                background: '#7c3aed', color: '#fff', fontSize: 10, fontWeight: 700,
                padding: '2px 10px', borderRadius: 99, letterSpacing: '0.06em', whiteSpace: 'nowrap',
              }}>
                MÁS POPULAR
              </div>
            )}
            <div style={{ color: '#ffd700', fontWeight: 800, fontSize: 16 }}>{pkg.price}</div>
            <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }}>{pkg.credits}</div>
            <div style={{ color: '#6b7280', fontSize: 10, marginTop: 1 }}>{pkg.label}</div>
          </div>
        ))}
      </div>

      {/* Footer micro-copy */}
      <p style={{ color: '#374151', fontSize: 11, textAlign: 'center', maxWidth: 360, lineHeight: 1.6 }}>
        Experiencia de entretenimiento digital. Las lecturas son generadas por IA
        con fines de exploración personal, no constituyen asesoramiento profesional.{' '}
        <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#4b5563' }}>
          Términos
        </a>
        {' · '}
        <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#4b5563' }}>
          Privacidad
        </a>
      </p>

      <style>{`
        @keyframes pulseBtn {
          0%, 100% { box-shadow: 0 0 40px rgba(124,58,237,0.5), 0 4px 20px rgba(0,0,0,0.5); }
          50% { box-shadow: 0 0 60px rgba(124,58,237,0.75), 0 4px 24px rgba(0,0,0,0.6); }
        }
      `}</style>
    </div>
  );
}
