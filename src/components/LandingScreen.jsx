import { useState, useEffect } from 'react';
import { useTheme } from '../lib/themeContext';
import { startAmbientMusic, initSpeech } from '../utils/speech';
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
        title: '44 Cartas del Destino',
        desc: 'Cada carta es un portal. Un arquetipo que despierta la memoria dormida de quién fuiste.',
      },
      {
        icon: '✨',
        title: 'Presencia Ancestral',
        desc: 'Una guía sensible que teje tu historia con palabras vivas, únicas para tu alma.',
      },
      {
        icon: '🔊',
        title: 'La Voz que Recuerda',
        desc: 'Cierra los ojos. Tu lectura llega susurrada por una voz que conoce tu eternidad.',
      },
    ],
    cta: '✦ Iniciar mi lectura',
    hook: '100 créditos gratis al registrarte · Sin tarjeta requerida',
    configure_title: 'Elige la voz de tu Oráculo',
    voice_subtitle: 'Selecciona la energía que guiará tu lectura',
    standard_section: 'Estándar',
    premium_section: 'Premium ✨',
    std_voices: [
      { id: 'std_masculine', label: '🗣 Masculino', desc: 'El aliento profundo del cosmos' },
      { id: 'std_feminine',  label: '🗣 Femenina',  desc: 'La voz etérea del universo' },
    ],
    voices: [
      { id: 'masculine_1', label: '🌌 Eric, Default',  desc: 'Voz masculina natural y serena' },
      { id: 'masculine_2', label: '🔮 Zoltar, Calm',   desc: 'Voz grave, profunda y mística' },
      { id: 'feminine_1',  label: '🌸 Jane, Smooth',   desc: 'Voz femenina etérea y sanadora' },
      { id: 'feminine_2',  label: '💜 Lly, Empathy',   desc: 'Voz femenina cálida y compasiva' },
    ],
    begin_btn: '✦ Comenzar',
    begin_premium_btn: '✦ Comenzar Premium',
    premium_voice_note: 'Requiere cuenta · consume 100 créditos',
    premium_cta: 'Experiencia Premium ✨',
    premium_desc: 'Voz ElevenLabs · email con tu síntesis · requiere cuenta',
    packages: [
      { label: 'Iniciado',   credits: '150 cr',  readings: '3 lecturas',  price: '$4.99' },
      { label: 'Explorador', credits: '400 cr',  readings: '8 lecturas',  price: '$9.99',  popular: true },
      { label: 'Oráculo',    credits: '1100 cr', readings: '22 lecturas', price: '$19.99' },
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
        title: '44 Destiny Cards',
        desc: 'Each card is a portal. An archetype that awakens the sleeping memory of who you were.',
      },
      {
        icon: '✨',
        title: 'Ancient Presence',
        desc: 'A sensitive guide that weaves your story with living words, unique to your soul.',
      },
      {
        icon: '🔊',
        title: 'The Voice That Remembers',
        desc: 'Close your eyes. Your reading arrives whispered by a voice that knows your eternity.',
      },
    ],
    cta: '✦ Start my reading',
    hook: '100 free credits when you register · No card required',
    configure_title: 'Choose your Oracle\'s voice',
    voice_subtitle: 'Select the energy that will guide your reading',
    standard_section: 'Standard',
    premium_section: 'Premium ✨',
    std_voices: [
      { id: 'std_masculine', label: '🗣 Masculine', desc: 'The deep breath of the cosmos' },
      { id: 'std_feminine',  label: '🗣 Feminine',  desc: 'The ethereal voice of the universe' },
    ],
    voices: [
      { id: 'masculine_1', label: '🌌 Eric, Default',  desc: 'Natural, serene masculine voice' },
      { id: 'masculine_2', label: '🔮 Zoltar, Calm',   desc: 'Deep, profound and mystical voice' },
      { id: 'feminine_1',  label: '🌸 Jane, Smooth',   desc: 'Ethereal, healing feminine voice' },
      { id: 'feminine_2',  label: '💜 Lly, Empathy',   desc: 'Warm, compassionate feminine voice' },
    ],
    begin_btn: '✦ Begin',
    begin_premium_btn: '✦ Begin Premium',
    premium_voice_note: 'Requires account · uses 100 credits',
    premium_cta: 'Premium Experience ✨',
    premium_desc: 'ElevenLabs voice · synthesis email · requires account',
    packages: [
      { label: 'Initiate', credits: '150 cr',  readings: '3 readings',  price: '$4.99' },
      { label: 'Explorer', credits: '400 cr',  readings: '8 readings',  price: '$9.99',  popular: true },
      { label: 'Oracle',   credits: '1100 cr', readings: '22 readings', price: '$19.99' },
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
        title: '44 Cartas do Destino',
        desc: 'Cada carta é um portal. Um arquétipo que desperta a memória adormecida de quem você foi.',
      },
      {
        icon: '✨',
        title: 'Presença Ancestral',
        desc: 'Uma guia sensível que tece sua história com palavras vivas, únicas para sua alma.',
      },
      {
        icon: '🔊',
        title: 'A Voz que Lembra',
        desc: 'Feche os olhos. Sua leitura chega sussurrada por uma voz que conhece sua eternidade.',
      },
    ],
    cta: '✦ Iniciar minha leitura',
    hook: '100 créditos grátis ao se registrar · Sem cartão necessário',
    configure_title: 'Escolha a voz do seu Oráculo',
    voice_subtitle: 'Selecione a energia que guiará sua leitura',
    standard_section: 'Padrão',
    premium_section: 'Premium ✨',
    std_voices: [
      { id: 'std_masculine', label: '🗣 Masculino', desc: 'O sopro profundo do cosmos' },
      { id: 'std_feminine',  label: '🗣 Feminino',  desc: 'A voz etérea do universo' },
    ],
    voices: [
      { id: 'masculine_1', label: '🌌 Eric, Default',  desc: 'Voz masculina natural e serena' },
      { id: 'masculine_2', label: '🔮 Zoltar, Calm',   desc: 'Voz grave, profunda e mística' },
      { id: 'feminine_1',  label: '🌸 Jane, Smooth',   desc: 'Voz feminina etérea e curadora' },
      { id: 'feminine_2',  label: '💜 Lly, Empathy',   desc: 'Voz feminina calorosa e compassiva' },
    ],
    begin_btn: '✦ Começar',
    begin_premium_btn: '✦ Começar Premium',
    premium_voice_note: 'Requer conta · consome 100 créditos',
    premium_cta: 'Experiência Premium ✨',
    premium_desc: 'Voz ElevenLabs · e-mail com síntese · requer conta',
    packages: [
      { label: 'Iniciante',  credits: '150 cr',  readings: '3 leituras',  price: '$4.99' },
      { label: 'Explorador', credits: '400 cr',  readings: '8 leituras',  price: '$9.99',  popular: true },
      { label: 'Oráculo',    credits: '1100 cr', readings: '22 leituras', price: '$19.99' },
    ],
    most_popular: 'MAIS POPULAR',
    footer: 'Experiência de entretenimento digital. As leituras são geradas por IA para fins de exploração pessoal e não constituem aconselhamento profissional.',
    terms: 'Termos',
    privacy: 'Privacidade',
  },
};

// ── Helper sub-components ─────────────────────────────────────────────────────

function SectionDivider({ label, isLight, taglineColor, isPremium = false }) {
  const lineColor = isLight
    ? (isPremium ? 'rgba(184,134,11,0.25)' : 'rgba(124,111,160,0.2)')
    : (isPremium ? 'rgba(255,215,0,0.18)'  : 'rgba(255,255,255,0.1)');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <div style={{ flex: 1, height: 1, background: lineColor }} />
      <span style={{
        color: isPremium
          ? (isLight ? '#b8860b' : '#ffd700')
          : taglineColor,
        fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: lineColor }} />
    </div>
  );
}

function VoiceCard({ voice, isSelected, isPremium, isLight, pillTitleColor, pillDescColor, onSelect }) {
  const parts = voice.label.split(' ');
  const icon = parts[0];
  const name = parts.slice(1).join(' ');

  const selectedBg     = isPremium
    ? (isLight ? 'rgba(184,134,11,0.18)'    : 'rgba(255,215,0,0.12)')
    : (isLight ? 'rgba(124,111,160,0.22)'   : 'rgba(124,58,237,0.22)');
  const unselectedBg   = isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.04)';
  const selectedBorder = isPremium
    ? (isLight ? 'rgba(184,134,11,0.75)'    : 'rgba(255,215,0,0.65)')
    : (isLight ? 'rgba(124,111,160,0.75)'   : 'rgba(167,139,250,0.75)');
  const unselectedBorder = isLight ? 'rgba(124,111,160,0.15)' : 'rgba(255,255,255,0.1)';
  const selectedShadow = isPremium
    ? (isLight ? '0 4px 20px rgba(184,134,11,0.22)' : '0 4px 20px rgba(255,215,0,0.2)')
    : (isLight ? '0 4px 20px rgba(124,111,160,0.25)' : '0 4px 20px rgba(124,58,237,0.3)');

  return (
    <div
      onClick={() => onSelect(voice.id)}
      style={{
        background: isSelected ? selectedBg : unselectedBg,
        border: `2px solid ${isSelected ? selectedBorder : unselectedBorder}`,
        borderRadius: 16, padding: '14px 12px',
        cursor: 'pointer', textAlign: 'center',
        transition: 'all 0.2s',
        boxShadow: isSelected ? selectedShadow : 'none',
      }}
    >
      <div style={{ fontSize: 26, marginBottom: 5 }}>{icon}</div>
      <div style={{ color: pillTitleColor, fontWeight: 700, fontSize: 12 }}>{name}</div>
      <div style={{ color: pillDescColor, fontSize: 10, marginTop: 3, lineHeight: 1.4 }}>{voice.desc}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function LandingScreen({ onEnter }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const [taglineIdx, setTaglineIdx] = useState(0);
  const [taglineVisible, setTaglineVisible] = useState(true);
  const [entered, setEntered] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en'); // default English
  const [step, setStep] = useState('landing'); // 'landing' | 'configure'
  const [selectedVoice, setSelectedVoice] = useState('std_masculine');

  // Detect if the chosen voice requires ElevenLabs (premium tier)
  const STD_VOICE_IDS = ['std_masculine', 'std_feminine'];
  const isPremiumVoice = !STD_VOICE_IDS.includes(selectedVoice);

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
    // Must call audio APIs synchronously within the user gesture to satisfy
    // browser autoplay policy — BEFORE the animation setTimeout.
    initSpeech();
    startAmbientMusic();
    if (isPremiumVoice) {
      setTimeout(() => onEnter({ language: selectedLang, tier: 'premium', voiceProfile: selectedVoice }), 400);
    } else {
      setTimeout(() => onEnter({ language: selectedLang, tier: 'standard', voiceProfile: null }), 400);
    }
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
      {/* ── Configure step — voice selection only ── */}
      {step === 'configure' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '80px 20px 40px',
          background: bg, backdropFilter: 'blur(8px)',
          overflowY: 'auto',
        }}>
          {/* Back button */}
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

          {/* Title */}
          <h2 style={{
            color: titleColor, fontSize: 'clamp(1.05rem, 3vw, 1.45rem)',
            fontWeight: 700, letterSpacing: '0.06em',
            marginBottom: 6, fontFamily: "'Cinzel', serif", textAlign: 'center',
          }}>
            {t.configure_title}
          </h2>
          <p style={{
            color: taglineColor, fontSize: 13, fontStyle: 'italic',
            marginBottom: 28, textAlign: 'center',
          }}>
            {t.voice_subtitle}
          </p>

          {/* ── Voice sections ── */}
          <div style={{ width: '100%', maxWidth: 400, marginBottom: 24 }}>

            {/* Standard section */}
            <SectionDivider label={t.standard_section} isLight={isLight} taglineColor={taglineColor} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {t.std_voices.map(voice => (
                <VoiceCard
                  key={voice.id}
                  voice={voice}
                  isSelected={selectedVoice === voice.id}
                  isPremium={false}
                  isLight={isLight}
                  pillTitleColor={pillTitleColor}
                  pillDescColor={pillDescColor}
                  onSelect={setSelectedVoice}
                />
              ))}
            </div>

            {/* Premium section */}
            <SectionDivider label={t.premium_section} isLight={isLight} taglineColor={taglineColor} isPremium />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {t.voices.map(voice => (
                <VoiceCard
                  key={voice.id}
                  voice={voice}
                  isSelected={selectedVoice === voice.id}
                  isPremium
                  isLight={isLight}
                  pillTitleColor={pillTitleColor}
                  pillDescColor={pillDescColor}
                  onSelect={setSelectedVoice}
                />
              ))}
            </div>
          </div>

          {/* Adaptive begin button */}
          <button
            onClick={handleBegin}
            style={{
              background: isPremiumVoice
                ? (isLight
                    ? 'linear-gradient(135deg, #b8860b 0%, #d4a017 100%)'
                    : 'linear-gradient(135deg, #b8860b 0%, #ffd700 100%)')
                : ctaBg,
              border: `1px solid ${isPremiumVoice
                ? (isLight ? 'rgba(184,134,11,0.5)' : 'rgba(255,215,0,0.45)')
                : ctaBorder}`,
              borderRadius: 50, padding: '15px 48px',
              color: '#fff', fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
              fontWeight: 700, cursor: 'pointer', letterSpacing: '0.06em',
              boxShadow: isPremiumVoice
                ? (isLight ? '0 0 32px rgba(184,134,11,0.35)' : '0 0 32px rgba(255,215,0,0.35)')
                : ctaShadow,
              fontFamily: 'inherit',
              marginBottom: 8,
              transition: 'background 0.25s, box-shadow 0.25s',
            }}
          >
            {isPremiumVoice ? t.begin_premium_btn : t.begin_btn}
          </button>
          {isPremiumVoice && (
            <p style={{ color: isLight ? '#b8860b' : '#ffd700', fontSize: 10, marginTop: 4, textAlign: 'center', fontStyle: 'italic', opacity: 0.8 }}>
              {t.premium_voice_note}
            </p>
          )}
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
        fontFamily: "'Cinzel', serif",
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
        fontFamily: "'Cormorant Garamond', Georgia, serif",
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
            <div style={{ color: hookColor, fontWeight: 600, fontSize: 12, marginTop: 3, transition: 'color 0.4s' }}>{pkg.readings}</div>
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
