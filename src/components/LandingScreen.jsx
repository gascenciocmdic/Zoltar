import { useState, useEffect } from 'react';
import { useTheme } from '../lib/themeContext';
import logoDark from '../assets/Logo_Zoltar_oscuro.png';
import logoClaro from '../assets/Logo_Zoltar_claro.png';

const LANDING_I18N = {
  es: {
    title: 'El Oráculo de Vidas Pasadas',
    taglines: [
      'Descubre quién fuiste.',
      'Tus vidas pasadas te hablan.',
      'El misterio de tu alma espera.',
    ],
    features: [
      {
        icon: '🃏',
        title: '44 Cartas Arcanas',
        desc: 'Mazo propio inspirado en arquetipos de vidas pasadas. Cada carta abre una memoria diferente.',
      },
      {
        icon: '✨',
        title: 'Guía Espiritual IA',
        desc: 'Una presencia sensible, empática y sanadora que construye una narrativa única para tu alma.',
      },
      {
        icon: '🔊',
        title: 'Voz del Oráculo',
        desc: 'Tu lectura es narrada por una voz etérea. Cierra los ojos y déjate guiar.',
      },
    ],
    cta: '✦ Iniciar mi lectura',
    hook: '100 créditos gratis al registrarte · Sin tarjeta requerida',
    configure_title: '✦ Configura tu experiencia',
    reading_label: 'Lectura',
    voice_label: 'Voz',
    begin_btn: '✦ Comenzar',
    tiers: [
      { id: 'standard', label: 'Estándar',   credits: '40 cr',  desc: '3 cartas · voz del sistema' },
      { id: 'full',     label: 'Completa',   credits: '65 cr',  desc: '+ profundización · voz sistema' },
      { id: 'premium',  label: 'Premium ✨', credits: '100 cr', desc: 'voz premium · email incluido' },
    ],
    voices: [
      { id: 'masculine', label: '🌌 Masculina', desc: 'Energías del universo' },
      { id: 'feminine',  label: '🌸 Femenina',  desc: 'Espíritu ancestral' },
    ],
    voice_premium_note: 'La voz ElevenLabs se activa con el tier Premium',
    packages: [
      { label: 'Iniciado',   credits: '150 cr',  price: '$4.99' },
      { label: 'Explorador', credits: '400 cr',  price: '$9.99',  popular: true },
      { label: 'Oráculo',    credits: '1100 cr', price: '$19.99' },
    ],
    most_popular: 'MÁS POPULAR',
    footer: 'Experiencia de entretenimiento digital. Las lecturas son generadas por IA con fines de exploración personal, no constituyen asesoramiento profesional.',
    terms: 'Términos',
    privacy: 'Privacidad',
  },
  en: {
    title: 'The Oracle of Past Lives',
    taglines: [
      'Discover who you were.',
      'Your past lives speak to you.',
      'The mystery of your soul awaits.',
    ],
    features: [
      {
        icon: '🃏',
        title: '44 Arcane Cards',
        desc: 'A unique deck inspired by past-life archetypes. Each card opens a different memory.',
      },
      {
        icon: '✨',
        title: 'AI Spiritual Guide',
        desc: 'A sensitive, empathetic, healing presence that builds a unique narrative for your soul.',
      },
      {
        icon: '🔊',
        title: 'Oracle Voice',
        desc: 'Your reading is narrated by an ethereal voice. Close your eyes and let yourself be guided.',
      },
    ],
    cta: '✦ Start my reading',
    hook: '100 free credits when you register · No card required',
    configure_title: '✦ Configure your experience',
    reading_label: 'Reading',
    voice_label: 'Voice',
    begin_btn: '✦ Begin',
    tiers: [
      { id: 'standard', label: 'Standard',   credits: '40 cr',  desc: '3 cards · system voice' },
      { id: 'full',     label: 'Full',       credits: '65 cr',  desc: '+ deepening · system voice' },
      { id: 'premium',  label: 'Premium ✨', credits: '100 cr', desc: 'premium voice · email included' },
    ],
    voices: [
      { id: 'masculine', label: '🌌 Masculine', desc: 'Universe energies' },
      { id: 'feminine',  label: '🌸 Feminine',  desc: 'Ancestral spirit' },
    ],
    voice_premium_note: 'ElevenLabs voice activates with the Premium tier',
    packages: [
      { label: 'Initiate', credits: '150 cr',  price: '$4.99' },
      { label: 'Explorer', credits: '400 cr',  price: '$9.99',  popular: true },
      { label: 'Oracle',   credits: '1100 cr', price: '$19.99' },
    ],
    most_popular: 'MOST POPULAR',
    footer: 'Digital entertainment experience. Readings are AI-generated for personal exploration and do not constitute professional advice.',
    terms: 'Terms',
    privacy: 'Privacy',
  },
  pt: {
    title: 'O Oráculo de Vidas Passadas',
    taglines: [
      'Descubra quem você foi.',
      'Suas vidas passadas falam com você.',
      'O mistério da sua alma espera.',
    ],
    features: [
      {
        icon: '🃏',
        title: '44 Cartas Arcanas',
        desc: 'Um baralho próprio inspirado em arquétipos de vidas passadas. Cada carta abre uma memória diferente.',
      },
      {
        icon: '✨',
        title: 'Guia Espiritual IA',
        desc: 'Uma presença sensível, empática e curadora que constrói uma narrativa única para sua alma.',
      },
      {
        icon: '🔊',
        title: 'Voz do Oráculo',
        desc: 'Sua leitura é narrada por uma voz etérea. Feche os olhos e deixe-se guiar.',
      },
    ],
    cta: '✦ Iniciar minha leitura',
    hook: '100 créditos grátis ao se registrar · Sem cartão necessário',
    configure_title: '✦ Configure sua experiência',
    reading_label: 'Leitura',
    voice_label: 'Voz',
    begin_btn: '✦ Começar',
    tiers: [
      { id: 'standard', label: 'Iniciante',  credits: '40 cr',  desc: '3 cartas · voz do sistema' },
      { id: 'full',     label: 'Completo',   credits: '65 cr',  desc: '+ aprofundamento · voz sistema' },
      { id: 'premium',  label: 'Premium ✨', credits: '100 cr', desc: 'voz premium · e-mail incluído' },
    ],
    voices: [
      { id: 'masculine', label: '🌌 Masculina', desc: 'Energias do universo' },
      { id: 'feminine',  label: '🌸 Feminina',  desc: 'Espírito ancestral' },
    ],
    voice_premium_note: 'A voz ElevenLabs é ativada com o tier Premium',
    packages: [
      { label: 'Iniciante',  credits: '150 cr',  price: '$4.99' },
      { label: 'Explorador', credits: '400 cr',  price: '$9.99',  popular: true },
      { label: 'Oráculo',    credits: '1100 cr', price: '$19.99' },
    ],
    most_popular: 'MAIS POPULAR',
    footer: 'Experiência de entretenimento digital. As leituras são geradas por IA para fins de exploração pessoal e não constituem aconselhamento profissional.',
    terms: 'Termos',
    privacy: 'Privacidade',
  },
};

export default function LandingScreen({ onEnter }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const [taglineIdx, setTaglineIdx] = useState(0);
  const [taglineVisible, setTaglineVisible] = useState(true);
  const [entered, setEntered] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en'); // default English
  const [step, setStep] = useState('landing'); // 'landing' | 'configure'
  const [selectedTier, setSelectedTier] = useState('standard');
  const [selectedVoice, setSelectedVoice] = useState('feminine');

  // Active translation set
  const t = LANDING_I18N[selectedLang] || LANDING_I18N.en;

  // Reset tagline position when language changes so index stays in bounds and
  // the new language's first tagline is shown immediately.
  useEffect(() => {
    setTaglineIdx(0);
    setTaglineVisible(true);
  }, [selectedLang]);

  // Cycle taglines — recreate when language changes so TAGLINES.length is correct
  useEffect(() => {
    const cycle = setInterval(() => {
      setTaglineVisible(false);
      setTimeout(() => {
        setTaglineIdx((i) => (i + 1) % t.taglines.length);
        setTaglineVisible(true);
      }, 500);
    }, 3200);
    return () => clearInterval(cycle);
  }, [selectedLang, t.taglines.length]);

  function handleCTA() {
    setStep('configure');
  }

  function handleBegin() {
    setEntered(true);
    setTimeout(() => onEnter({ language: selectedLang, tier: selectedTier, voiceProfile: selectedVoice }), 400);
  }

  // ── Theme-dependent design tokens ────────────────────────────────────────
  const bg = isLight
    ? 'linear-gradient(180deg, rgba(245,240,255,0.92) 0%, rgba(245,240,255,0.80) 100%)'
    : 'linear-gradient(180deg, rgba(5,0,15,0.85) 0%, rgba(5,0,15,0.7) 100%)';
  const titleColor     = isLight ? '#4a3560' : '#ffd700';
  const taglineColor   = isLight ? '#7c6fa0' : '#c4b5fd';
  const ctaBg          = isLight
    ? 'linear-gradient(135deg, #7c6fa0 0%, #5b8db8 100%)'
    : 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #1d4ed8 100%)';
  const ctaBorder      = isLight ? 'rgba(124,111,160,0.4)' : 'rgba(167,139,250,0.4)';
  const ctaShadow      = isLight
    ? '0 0 40px rgba(124,111,160,0.4), 0 4px 20px rgba(0,0,0,0.15)'
    : '0 0 40px rgba(124,58,237,0.5), 0 4px 20px rgba(0,0,0,0.5)';
  const ctaShadowHover = isLight
    ? '0 0 60px rgba(124,111,160,0.6), 0 4px 24px rgba(0,0,0,0.2)'
    : '0 0 60px rgba(124,58,237,0.7), 0 4px 24px rgba(0,0,0,0.6)';
  const hookColor      = isLight ? '#3a7d6e' : '#6ee7b7';
  const pillBg         = isLight ? 'rgba(255,255,255,0.7)'    : 'rgba(255,255,255,0.04)';
  const pillBorder     = isLight ? 'rgba(124,111,160,0.2)'    : 'rgba(255,215,0,0.12)';
  const pillTitleColor = isLight ? '#2d2540'  : '#e5e7eb';
  const pillDescColor  = isLight ? '#6b5f8a'  : '#6b7280';
  const priceColor     = isLight ? '#b8860b'  : '#ffd700';
  const priceSubColor  = isLight ? '#7c6fa0'  : '#9ca3af';
  const priceLabelColor= isLight ? '#9b8ab0'  : '#6b7280';
  const footerColor    = isLight ? '#7c6fa0'  : '#374151';
  const footerLinkColor= isLight ? '#5b4f8a'  : '#4b5563';
  const toggleBg       = isLight ? 'rgba(124,111,160,0.15)' : 'rgba(255,255,255,0.08)';
  const toggleBorder   = isLight ? 'rgba(124,111,160,0.3)'  : 'rgba(255,255,255,0.15)';
  const toggleColor    = isLight ? '#4a3560'  : '#e5e7eb';

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
      {/* ── Configure step — appears when user clicks Start ── */}
      {step === 'configure' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '80px 20px 32px',
          background: bg, backdropFilter: 'blur(8px)',
          overflowY: 'auto',
        }}>
          <button
            onClick={() => setStep('landing')}
            style={{
              position: 'absolute', top: 16, left: 16,
              background: 'transparent', border: 'none',
              color: taglineColor, fontSize: 24, cursor: 'pointer', lineHeight: 1,
            }}
          >
            ←
          </button>

          <h2 style={{
            color: titleColor, fontSize: 'clamp(1rem, 3vw, 1.4rem)',
            fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
            marginBottom: 24, fontFamily: 'Georgia, serif',
          }}>
            {t.configure_title}
          </h2>

          {/* Reading tier selector */}
          <div style={{ width: '100%', maxWidth: 500, marginBottom: 20 }}>
            <p style={{
              color: taglineColor, fontSize: 12, letterSpacing: '2px',
              textTransform: 'uppercase', marginBottom: 10,
              fontWeight: 700, textAlign: 'center',
            }}>
              {t.reading_label}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {t.tiers.map(tier => (
                <div
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  style={{
                    background: selectedTier === tier.id
                      ? (isLight ? 'rgba(124,111,160,0.22)' : 'rgba(124,58,237,0.22)')
                      : (isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.04)'),
                    border: `1.5px solid ${selectedTier === tier.id
                      ? (isLight ? 'rgba(124,111,160,0.7)' : 'rgba(167,139,250,0.7)')
                      : (isLight ? 'rgba(124,111,160,0.15)' : 'rgba(255,255,255,0.1)')}`,
                    borderRadius: 14, padding: '12px 14px',
                    cursor: 'pointer', textAlign: 'center',
                    flex: '1 1 120px', maxWidth: 160, transition: 'all 0.2s',
                  }}
                >
                  <div style={{ color: priceColor, fontWeight: 800, fontSize: 15 }}>{tier.credits}</div>
                  <div style={{ color: pillTitleColor, fontWeight: 700, fontSize: 12, margin: '4px 0 2px' }}>{tier.label}</div>
                  <div style={{ color: pillDescColor, fontSize: 10, lineHeight: 1.4 }}>{tier.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Voice selector */}
          <div style={{ width: '100%', maxWidth: 500, marginBottom: 20 }}>
            <p style={{
              color: taglineColor, fontSize: 12, letterSpacing: '2px',
              textTransform: 'uppercase', marginBottom: 10,
              fontWeight: 700, textAlign: 'center',
            }}>
              {t.voice_label}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {t.voices.map(voice => (
                <div
                  key={voice.id}
                  onClick={() => setSelectedVoice(voice.id)}
                  style={{
                    background: selectedVoice === voice.id
                      ? (isLight ? 'rgba(124,111,160,0.22)' : 'rgba(124,58,237,0.22)')
                      : (isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.04)'),
                    border: `1.5px solid ${selectedVoice === voice.id
                      ? (isLight ? 'rgba(124,111,160,0.7)' : 'rgba(167,139,250,0.7)')
                      : (isLight ? 'rgba(124,111,160,0.15)' : 'rgba(255,255,255,0.1)')}`,
                    borderRadius: 14, padding: '12px 20px',
                    cursor: 'pointer', textAlign: 'center',
                    flex: '1 1 140px', maxWidth: 200, transition: 'all 0.2s',
                  }}
                >
                  <div style={{ color: pillTitleColor, fontWeight: 700, fontSize: 13 }}>{voice.label}</div>
                  <div style={{ color: pillDescColor, fontSize: 11, marginTop: 4 }}>{voice.desc}</div>
                </div>
              ))}
            </div>
            {selectedTier !== 'premium' && (
              <p style={{
                color: taglineColor, fontSize: 10, fontStyle: 'italic',
                marginTop: 8, textAlign: 'center',
              }}>
                {t.voice_premium_note}
              </p>
            )}
          </div>

          <button
            onClick={handleBegin}
            style={{
              background: ctaBg, border: `1px solid ${ctaBorder}`,
              borderRadius: 50, padding: '14px 44px',
              color: '#fff', fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
              fontWeight: 700, cursor: 'pointer', letterSpacing: '0.06em',
              boxShadow: ctaShadow, fontFamily: 'inherit',
            }}
          >
            {t.begin_btn}
          </button>
        </div>
      )}

      {/* ── Top-right controls: language flags + theme toggle ── */}
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        {[
          { code: 'es', flag: '🇪🇸' },
          { code: 'en', flag: '🇺🇸' },
          { code: 'pt', flag: '🇧🇷' },
        ].map(({ code, flag }) => (
          <button
            key={code}
            onClick={() => setSelectedLang(code)}
            title={code.toUpperCase()}
            style={{
              background: selectedLang === code
                ? (isLight ? 'rgba(124,111,160,0.25)' : 'rgba(124,58,237,0.3)')
                : 'transparent',
              border: selectedLang === code
                ? `1px solid ${isLight ? 'rgba(124,111,160,0.5)' : 'rgba(167,139,250,0.5)'}`
                : '1px solid transparent',
              borderRadius: 8, width: 34, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 18, transition: 'all 0.2s',
            }}
          >
            {flag}
          </button>
        ))}
        <button
          onClick={toggleTheme}
          title={isLight ? 'Dark mode' : 'Light mode'}
          style={{
            background: toggleBg, border: `1px solid ${toggleBorder}`,
            borderRadius: 50, width: 34, height: 34,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 16, color: toggleColor, transition: 'all 0.2s',
          }}
        >
          {isLight ? '🌙' : '☀️'}
        </button>
      </div>

      {/* ── Logo ── */}
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

      {/* ── Title ── */}
      <h1 style={{
        color: titleColor, fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
        fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
        textAlign: 'center', margin: '0 0 12px',
        textShadow: isLight ? 'none' : '0 0 40px rgba(255,215,0,0.5)',
        fontFamily: 'Georgia, serif',
        transition: 'color 0.4s',
      }}>
        {t.title}
      </h1>

      {/* ── Rotating tagline ── */}
      <p style={{
        color: taglineColor, fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
        fontStyle: 'italic', textAlign: 'center', marginBottom: 40,
        minHeight: '1.8em',
        opacity: taglineVisible ? 1 : 0,
        transform: taglineVisible ? 'translateY(0)' : 'translateY(-6px)',
        transition: 'opacity 0.4s, transform 0.4s, color 0.4s',
        fontFamily: 'Georgia, serif',
      }}>
        {t.taglines[taglineIdx]}
      </p>

      {/* ── CTA button ── */}
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
        {t.cta}
      </button>

      {/* ── Free credits hook ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        color: hookColor, fontSize: 'clamp(11px, 2.8vw, 13px)', marginBottom: 28,
        fontWeight: 600, transition: 'color 0.4s', textAlign: 'center',
      }}>
        <span>🎁</span>
        <span>{t.hook}</span>
      </div>

      {/* ── Feature pills ── */}
      <div style={{
        display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center',
        width: '100%', maxWidth: 680, marginBottom: 24, padding: '0 8px',
      }}>
        {t.features.map((f) => (
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

      {/* ── Pricing anchor ── */}
      <div style={{
        display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center',
        marginBottom: 20, padding: '0 8px', width: '100%', maxWidth: 420,
      }}>
        {t.packages.map((pkg) => (
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
                {t.most_popular}
              </div>
            )}
            <div style={{ color: priceColor, fontWeight: 800, fontSize: 16, transition: 'color 0.4s' }}>{pkg.price}</div>
            <div style={{ color: priceSubColor, fontSize: 11, marginTop: 2, transition: 'color 0.4s' }}>{pkg.credits}</div>
            <div style={{ color: priceLabelColor, fontSize: 10, marginTop: 1, transition: 'color 0.4s' }}>{pkg.label}</div>
          </div>
        ))}
      </div>

      {/* ── Footer micro-copy ── */}
      <p style={{
        color: footerColor, fontSize: 11, textAlign: 'center',
        maxWidth: 360, lineHeight: 1.6, transition: 'color 0.4s',
      }}>
        {t.footer}{' '}
        <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: footerLinkColor }}>
          {t.terms}
        </a>
        {' · '}
        <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: footerLinkColor }}>
          {t.privacy}
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
