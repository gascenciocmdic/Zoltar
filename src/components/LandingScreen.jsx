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
      { id: 'masculine_1', label: '🌌 Eric, Default',  desc: 'Presencia clara y serena — guía con calma ancestral' },
      { id: 'masculine_2', label: '🔮 Zoltar, Calm',   desc: 'Eco del cosmos — profundo, hipnótico, inescrutable' },
      { id: 'feminine_1',  label: '🌸 Jane, Smooth',   desc: 'Susurro sanador — etérea como la seda del tiempo' },
      { id: 'feminine_2',  label: '💜 Lly, Empathy',   desc: 'Abrazo de luz — cálida, cercana, eternamente compasiva' },
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
    testimonials_title: '✦ Voces del Cosmos ✦',
    testimonials: [
      { text: 'Una experiencia que nunca olvidaré. La lectura tocó mi alma de manera inexplicable.', author: 'Valentina M., Buenos Aires' },
      { text: 'Las cartas describieron exactamente lo que siento pero no logro expresar con palabras.', author: 'Diego R., Ciudad de México' },
      { text: 'La voz premium fue sobrecogedora. Sentí que el oráculo me conocía desde siempre.', author: 'María L., Madrid' },
    ],
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
      { id: 'masculine_1', label: '🌌 Eric, Default',  desc: 'Clear, serene presence — guides with ancestral calm' },
      { id: 'masculine_2', label: '🔮 Zoltar, Calm',   desc: 'Echo of the cosmos — deep, hypnotic, inscrutable' },
      { id: 'feminine_1',  label: '🌸 Jane, Smooth',   desc: 'Healing whisper — ethereal as the silk of time' },
      { id: 'feminine_2',  label: '💜 Lly, Empathy',   desc: 'Embrace of light — warm, near, eternally compassionate' },
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
    testimonials_title: '✦ Voices from the Cosmos ✦',
    testimonials: [
      { text: "An experience I'll never forget. The reading touched my soul in an unexplainable way.", author: 'Emily T., New York' },
      { text: 'The cards described exactly what I feel but cannot express in words.', author: 'James P., London' },
      { text: 'The premium voice was overwhelming. It felt like the oracle had always known me.', author: 'Sofia K., Toronto' },
    ],
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
      { id: 'masculine_1', label: '🌌 Eric, Default',  desc: 'Presença clara e serena — guia com calma ancestral' },
      { id: 'masculine_2', label: '🔮 Zoltar, Calm',   desc: 'Eco do cosmos — profundo, hipnótico, inescrutável' },
      { id: 'feminine_1',  label: '🌸 Jane, Smooth',   desc: 'Sussurro que cura — etéreo como a seda do tempo' },
      { id: 'feminine_2',  label: '💜 Lly, Empathy',   desc: 'Abraço de luz — caloroso, próximo, eternamente compassivo' },
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
    testimonials_title: '✦ Vozes do Cosmos ✦',
    testimonials: [
      { text: 'Uma experiência que nunca esquecerei. A leitura tocou minha alma de forma inexplicável.', author: 'Mariana S., São Paulo' },
      { text: 'As cartas descreveram exatamente o que sinto, mas não consigo expressar em palavras.', author: 'Rafael M., Rio de Janeiro' },
      { text: 'A voz premium foi arrebatadora. Senti que o oráculo me conhecia desde sempre.', author: 'Ana F., Lisboa' },
    ],
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
  const taglineColor   = isLight ? '#6b5f8a' : '#c4b5fd'; // was #7c6fa0 — 4.30:1 (fail)
  const ctaBg          = isLight
    ? 'linear-gradient(135deg, #4a3f6e 0%, #2d5c7a 100%)' // was #7c6fa0→#5b8db8 (3.5:1 fail)
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
  const pillDescColor  = isLight ? '#6b5f8a'  : '#9ca3af'; // dark: was #6b7280 — 4.22:1 (fail)
  const priceColor     = isLight ? '#785200'  : '#ffd700'; // was #b8860b — 3.09:1 on light
  const priceSubColor  = isLight ? '#6b5f8a'  : '#9ca3af'; // was #7c6fa0 — 4.30:1 (fail)
  const priceLabelColor= isLight ? '#6b5f8a'  : '#9ca3af'; // was #9b8ab0/#6b7280 (fails both)
  const footerColor    = isLight ? '#6b5f8a'  : '#9ca3af'; // dark: #6b7280 was 4.30:1 fail
  const footerLinkColor= isLight ? '#5f5280'  : '#9ca3af'; // dark: #6b7280 was 4.30:1 fail
  const toggleBg       = isLight ? 'rgba(124,111,160,0.15)' : 'rgba(255,255,255,0.08)';
  const toggleBorder   = isLight ? 'rgba(124,111,160,0.3)'  : 'rgba(255,255,255,0.15)';
  const toggleColor    = isLight ? '#4a3560'  : '#e5e7eb';

  return (
    <>
    {/* ── Language + theme controls ─────────────────────────────────────────
        Rendered OUTSIDE the scrollable container so iOS touch-coordinate
        drift (position:absolute inside overflow:auto fixed div) never
        applies. zIndex:100001 ensures these are above every overlay. ── */}
    <div style={{
      position: 'fixed', top: 8, right: 8, zIndex: 100001,
      display: 'flex', alignItems: 'center', gap: 2,
      opacity: entered ? 0 : 1,
      transition: 'opacity 0.4s ease',
      pointerEvents: entered ? 'none' : 'auto',
    }}>
      {[
        { code: 'es', flag: '🇪🇸', label: 'ES' },
        { code: 'en', flag: '🇺🇸', label: 'EN' },
        { code: 'pt', flag: '🇧🇷', label: 'PT' },
      ].map(({ code, flag, label }) => (
        <button
          key={code}
          onClick={() => setSelectedLang(code)}
          style={{
            background: selectedLang === code
              ? (isLight ? 'rgba(124,111,160,0.28)' : 'rgba(124,58,237,0.35)')
              : (isLight ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.3)'),
            border: `1.5px solid ${selectedLang === code
              ? (isLight ? 'rgba(124,111,160,0.6)' : 'rgba(167,139,250,0.6)')
              : (isLight ? 'rgba(124,111,160,0.2)' : 'rgba(255,255,255,0.12)')}`,
            borderRadius: 10,
            minWidth: 44, minHeight: 44,
            padding: '4px 6px',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
            transition: 'background 0.2s, border-color 0.2s',
            gap: 1,
          }}
        >
          <span style={{ fontSize: 20, lineHeight: 1, display: 'block' }}>{flag}</span>
          <span style={{
            fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', lineHeight: 1,
            color: selectedLang === code
              ? (isLight ? '#4a3560' : '#ffd700')
              : (isLight ? '#9b8ab0' : 'rgba(255,255,255,0.35)'),
          }}>{label}</span>
        </button>
      ))}
      <button
        onClick={toggleTheme}
        style={{
          background: toggleBg, border: `1.5px solid ${toggleBorder}`,
          borderRadius: 10,
          minWidth: 44, minHeight: 44,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 18, color: toggleColor,
          marginLeft: 2,
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
          transition: 'background 0.2s',
        }}
      >
        {isLight ? '🌙' : '☀️'}
      </button>
    </div>

    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center',
        padding: 'max(68px, 5vh) 16px 24px',
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
              color: isPremiumVoice ? '#2d1a00' : '#fff', fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
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
            <p style={{ color: isLight ? '#785200' : '#ffd700', fontSize: 10, marginTop: 4, textAlign: 'center', fontStyle: 'italic', opacity: 0.8 }}>
              {t.premium_voice_note}
            </p>
          )}
        </div>
      )}

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

      {/* ── Pricing anchor — hidden for MVP launch ── */}

      {/* ── Testimonials ── */}
      {t.testimonials && (
        <div style={{
          width: '100%', maxWidth: 680, marginBottom: 28, padding: '0 8px',
        }}>
          <p style={{
            color: taglineColor, fontSize: 10, letterSpacing: '0.14em',
            textTransform: 'uppercase', marginBottom: 14, fontWeight: 700,
            textAlign: 'center', transition: 'color 0.4s',
          }}>
            {t.testimonials_title}
          </p>
          <div style={{
            display: 'flex', gap: 12,
            flexWrap: 'wrap', justifyContent: 'center',
          }}>
            {t.testimonials.map((item, i) => (
              <div key={i} style={{
                background: pillBg,
                border: `1px solid ${pillBorder}`,
                borderRadius: 16, padding: '14px 16px',
                flex: '1 1 190px', maxWidth: 240, minWidth: 160,
                textAlign: 'left', transition: 'background 0.4s, border-color 0.4s',
              }}>
                <p style={{
                  color: pillDescColor, fontSize: 12, lineHeight: 1.65,
                  fontStyle: 'italic', margin: '0 0 10px',
                  transition: 'color 0.4s',
                }}>
                  &ldquo;{item.text}&rdquo;
                </p>
                <p style={{
                  color: taglineColor, fontSize: 10, fontWeight: 700,
                  margin: 0, transition: 'color 0.4s',
                }}>
                  — {item.author}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

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
    </>
  );
}
