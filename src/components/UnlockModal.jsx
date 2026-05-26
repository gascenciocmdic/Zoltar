import { useState } from 'react';
import { CREDIT_COSTS } from '../lib/credits.js';
import { useTheme } from '../lib/themeContext';

// The 4 ElevenLabs premium voices — same IDs as api/tts.js VOICE_IDS
const PREMIUM_VOICES = {
  es: [
    { id: 'masculine_1', emoji: '🌌', name: 'Eric, Default',  desc: 'Voz masculina natural y serena' },
    { id: 'masculine_2', emoji: '🔮', name: 'Zoltar, Calm',   desc: 'Voz grave, profunda y mística' },
    { id: 'feminine_1',  emoji: '🌸', name: 'Jane, Smooth',   desc: 'Voz femenina etérea y sanadora' },
    { id: 'feminine_2',  emoji: '💜', name: 'Lly, Empathy',   desc: 'Voz femenina cálida y compasiva' },
  ],
  en: [
    { id: 'masculine_1', emoji: '🌌', name: 'Eric, Default',  desc: 'Natural, serene masculine voice' },
    { id: 'masculine_2', emoji: '🔮', name: 'Zoltar, Calm',   desc: 'Deep, profound and mystical voice' },
    { id: 'feminine_1',  emoji: '🌸', name: 'Jane, Smooth',   desc: 'Ethereal, healing feminine voice' },
    { id: 'feminine_2',  emoji: '💜', name: 'Lly, Empathy',   desc: 'Warm, compassionate feminine voice' },
  ],
  pt: [
    { id: 'masculine_1', emoji: '🌌', name: 'Eric, Default',  desc: 'Voz masculina natural e serena' },
    { id: 'masculine_2', emoji: '🔮', name: 'Zoltar, Calm',   desc: 'Voz grave, profunda e mística' },
    { id: 'feminine_1',  emoji: '🌸', name: 'Jane, Smooth',   desc: 'Voz feminina etérea e curadora' },
    { id: 'feminine_2',  emoji: '💜', name: 'Lly, Empathy',   desc: 'Voz feminina calorosa e compassiva' },
  ],
};

export default function UnlockModal({
  isOpen,
  onClose,
  onUnlock,
  authSession,
  credits,
  onShowAuth,
  onShowPurchase,
  translations,
  language = 'es',
}) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [selectedTier,  setSelectedTier]  = useState(null); // 'standard'|'full'|'premium'
  const [selectedVoice, setSelectedVoice] = useState(null); // 'masculine'|'feminine'

  if (!isOpen) return null;

  const canAffordStandard = (credits ?? 0) >= CREDIT_COSTS.consultation;
  const canAffordFull     = (credits ?? 0) >= CREDIT_COSTS.ancestral_ritual;
  const canAffordPremium  = (credits ?? 0) >= CREDIT_COSTS.premium_ritual;
  const isLoggedIn        = !!authSession;

  const canConfirm = selectedTier !== null &&
    (selectedTier !== 'premium' || selectedVoice !== null);

  const handleConfirm = () => {
    if (!isLoggedIn)    { onShowAuth(); return; }
    if (!canConfirm)    return;

    const affordMap = { standard: canAffordStandard, full: canAffordFull, premium: canAffordPremium };
    if (!affordMap[selectedTier]) { onShowPurchase(); return; }

    onUnlock(selectedTier, selectedVoice);
    setSelectedTier(null);
    setSelectedVoice(null);
  };

  // ── Styles ────────────────────────────────────────────────────────────
  const overlayBg  = isLight ? 'rgba(200,190,230,0.55)' : 'rgba(0,0,0,0.85)';
  const modalBg    = isLight ? 'linear-gradient(145deg, #faf8ff, #f0ecff)' : '#14142b';
  const modalBorder= isLight ? '1px solid rgba(124,111,160,0.3)' : '1px solid rgba(255,215,0,0.3)';
  const closeColor = isLight ? 'rgba(45,37,64,0.4)' : '#666';
  const titleColor = isLight ? '#b8860b' : '#ffd700';
  const subColor   = isLight ? 'rgba(45,37,64,0.55)' : '#888';
  const divColor   = isLight ? 'rgba(124,111,160,0.2)' : 'rgba(255,255,255,0.1)';
  const linkColor  = isLight ? '#7c6fa0' : '#a78bfa';
  const buyColor   = isLight ? 'rgba(45,37,64,0.3)' : '#555';

  const tierBtn = (tier, label, sub, recommended = false) => {
    const active   = selectedTier === tier;
    const costMap  = { standard: CREDIT_COSTS.consultation, full: CREDIT_COSTS.ancestral_ritual, premium: CREDIT_COSTS.premium_ritual };
    const cost     = costMap[tier];
    const affordMap= { standard: canAffordStandard, full: canAffordFull, premium: canAffordPremium };
    const affordable = affordMap[tier];

    const bg = active
      ? (tier === 'premium'
          ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
          : tier === 'full'
          ? (isLight ? 'linear-gradient(135deg,#7c6fa0,#5b8db8)' : '#7c3aed')
          : (isLight ? 'rgba(184,134,11,0.15)' : 'rgba(255,215,0,0.15)'))
      : (isLight ? 'rgba(184,134,11,0.05)' : 'rgba(255,255,255,0.03)');

    const border = active
      ? (tier === 'premium' ? '1px solid #a855f7' : tier === 'full' ? '1px solid #7c3aed' : `1px solid ${isLight ? '#b8860b' : '#ffd700'}`)
      : `1px solid ${isLight ? 'rgba(124,111,160,0.2)' : 'rgba(255,255,255,0.08)'}`;

    const textColor = active && (tier === 'premium' || tier === 'full') ? '#fff' : (isLight ? '#6b4e00' : '#ffd700');
    const descColor = active && (tier === 'premium' || tier === 'full') ? 'rgba(255,255,255,0.75)' : subColor;

    return (
      <button
        onClick={() => {
          if (!isLoggedIn) { onShowAuth(); return; }
          if (!affordable) { onShowPurchase(); return; }
          setSelectedTier(tier);
          if (tier !== 'premium') setSelectedVoice(null);
        }}
        style={{
          background: bg, border, borderRadius: 12, padding: '11px 14px',
          color: textColor, cursor: 'pointer', textAlign: 'left',
          transition: 'all 0.2s', position: 'relative', width: '100%',
        }}
      >
        {recommended && (
          <span style={{
            position: 'absolute', top: -9, right: 12,
            background: isLight ? '#b8860b' : '#ffd700',
            color: isLight ? '#fff' : '#000',
            fontSize: '0.55rem', padding: '2px 8px',
            borderRadius: 8, fontWeight: 700,
          }}>RECOMENDADO</span>
        )}
        <strong style={{ display: 'block', marginBottom: 2, fontSize: '0.88rem' }}>
          {label} — {cost}💎
          {!affordable && isLoggedIn && (
            <span style={{ color: subColor, fontSize: '0.65rem', marginLeft: 6 }}>
              (tienes {credits ?? 0})
            </span>
          )}
        </strong>
        <span style={{ color: descColor, fontSize: '0.72rem' }}>{sub}</span>
      </button>
    );
  };

  const voices = PREMIUM_VOICES[language] || PREMIUM_VOICES.es;

  const voiceCard = ({ id, emoji, name, desc }) => {
    const active = selectedVoice === id;
    return (
      <button
        key={id}
        onClick={() => setSelectedVoice(id)}
        style={{
          background: active
            ? (isLight ? 'rgba(124,58,237,0.18)' : 'linear-gradient(135deg,#7c3aed,#a855f7)')
            : (isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.04)'),
          border: `1.5px solid ${active
            ? (isLight ? 'rgba(124,58,237,0.7)' : '#a855f7')
            : (isLight ? 'rgba(124,111,160,0.2)' : 'rgba(255,255,255,0.1)')}`,
          borderRadius: 10, padding: '10px 8px', cursor: 'pointer',
          color: active ? (isLight ? '#4a1d96' : '#fff') : subColor,
          textAlign: 'center', transition: 'all 0.2s',
          boxShadow: active ? (isLight ? '0 2px 12px rgba(124,58,237,0.2)' : '0 2px 12px rgba(168,85,247,0.3)') : 'none',
        }}
      >
        <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>{emoji}</div>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, marginBottom: 2,
          color: active ? (isLight ? '#4a1d96' : '#fff') : (isLight ? '#2d2540' : '#e5e7eb') }}>{name}</div>
        <div style={{ fontSize: '0.62rem', opacity: 0.8, lineHeight: 1.3 }}>{desc}</div>
      </button>
    );
  };

  const ui = translations?.ui || {};

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: overlayBg,
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: modalBg, border: modalBorder,
          borderRadius: 20, padding: '28px 24px', width: 320,
          textAlign: 'center', position: 'relative',
          boxShadow: isLight
            ? '0 0 40px rgba(124,111,160,0.2), 0 20px 60px rgba(0,0,0,0.08)'
            : '0 20px 60px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => { onClose(); setSelectedTier(null); setSelectedVoice(null); }}
          style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', color: closeColor, fontSize: '1.2rem', cursor: 'pointer' }}
        >✕</button>

        <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>🔮</div>
        <h3 style={{ color: titleColor, margin: '0 0 4px', fontSize: '1rem' }}>
          Desbloquea tu lectura
        </h3>
        <p style={{ color: subColor, fontSize: '0.75rem', margin: '0 0 16px' }}>
          Revela las 3 cartas + síntesis final
        </p>

        {/* ── Tier selection ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {tierBtn('standard', 'Estándar', `Revelación completa · Profundizar a ${CREDIT_COSTS.deepening}💎/carta`)}
          {tierBtn('full',     'Full',     'Todo incluido · Profundización gratis en las 3 cartas', true)}
          {tierBtn('premium',  `${ui.premium_tier_name || 'Premium'} ✨`, `${ui.premium_tier_desc || 'Voz premium · Email incluido'} · Profundización gratis`)}
        </div>

        {/* ── Voice selection (only when Premium selected) ── */}
        {selectedTier === 'premium' && (
          <div style={{ marginBottom: 12, animation: 'fadeIn 0.3s ease' }}>
            <p style={{ color: subColor, fontSize: '0.72rem', margin: '0 0 8px' }}>
              {ui.voice_choose || 'Elige tu voz premium'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {voices.map(v => voiceCard(v))}
            </div>
          </div>
        )}

        {/* ── Confirm button ── */}
        {selectedTier && (
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            style={{
              width: '100%', borderRadius: 12, padding: '11px 0',
              fontWeight: 700, fontSize: '0.85rem', cursor: canConfirm ? 'pointer' : 'not-allowed',
              marginBottom: 10, border: 'none',
              background: canConfirm
                ? (selectedTier === 'premium' ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : selectedTier === 'full' ? (isLight ? 'linear-gradient(135deg,#7c6fa0,#5b8db8)' : '#7c3aed') : (isLight ? '#b8860b' : '#ffd700'))
                : 'rgba(255,255,255,0.1)',
              color: canConfirm ? (selectedTier === 'standard' && !isLight ? '#000' : '#fff') : subColor,
              transition: 'all 0.2s',
            }}
          >
            Confirmar — {selectedTier === 'standard' ? CREDIT_COSTS.consultation : selectedTier === 'full' ? CREDIT_COSTS.ancestral_ritual : CREDIT_COSTS.premium_ritual}💎
          </button>
        )}

        {/* ── Footer links ── */}
        <div style={{ borderTop: `1px solid ${divColor}`, paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {!isLoggedIn && (
            <button onClick={onShowAuth} style={{ background: 'none', border: 'none', color: linkColor, cursor: 'pointer', fontSize: '0.75rem' }}>
              🎁 Registrarme y obtener 100💎 gratis
            </button>
          )}
          {!isLoggedIn && (
            <button onClick={onShowAuth} style={{ background: 'none', border: 'none', color: subColor, cursor: 'pointer', fontSize: '0.72rem' }}>
              Ya tengo cuenta — iniciar sesión
            </button>
          )}
          {isLoggedIn && (
            <button onClick={onShowPurchase} style={{ background: 'none', border: 'none', color: buyColor, cursor: 'pointer', fontSize: '0.68rem' }}>
              💳 Comprar créditos
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
