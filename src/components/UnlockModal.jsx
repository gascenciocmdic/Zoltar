import { CREDIT_COSTS } from '../lib/credits.js';
import { useTheme } from '../lib/themeContext';

export default function UnlockModal({
  isOpen,
  onClose,
  onUnlock,
  authSession,
  credits,
  onShowAuth,
  onShowPurchase,
}) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (!isOpen) return null;

  const canAffordStandard = (credits ?? 0) >= CREDIT_COSTS.consultation;
  const canAffordFull = (credits ?? 0) >= CREDIT_COSTS.ancestral_ritual;
  const isLoggedIn = !!authSession;

  const overlayBg = isLight ? 'rgba(200,190,230,0.55)' : 'rgba(0,0,0,0.85)';
  const modalBg = isLight ? 'linear-gradient(145deg, #faf8ff, #f0ecff)' : '#14142b';
  const modalBorder = isLight ? '1px solid rgba(124,111,160,0.3)' : '1px solid rgba(255,215,0,0.3)';
  const closeColor = isLight ? 'rgba(45,37,64,0.4)' : '#666';
  const titleColor = isLight ? '#b8860b' : '#ffd700';
  const subtitleColor = isLight ? 'rgba(45,37,64,0.55)' : '#888';
  const stdBtnBg = isLight ? 'rgba(184,134,11,0.08)' : 'rgba(255,215,0,0.08)';
  const stdBtnBorder = isLight ? '#b8860b' : '#ffd700';
  const stdBtnColor = isLight ? '#6b4e00' : '#ffd700';
  const stdBtnSubColor = isLight ? 'rgba(45,37,64,0.5)' : '#888';
  const dividerColor = isLight ? 'rgba(124,111,160,0.2)' : 'rgba(255,255,255,0.1)';
  const linkColor = isLight ? '#7c6fa0' : '#a78bfa';
  const altLinkColor = isLight ? 'rgba(45,37,64,0.45)' : '#888';
  const buyLinkColor = isLight ? 'rgba(45,37,64,0.3)' : '#555';

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: overlayBg,
        backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 9000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: modalBg,
          border: modalBorder,
          borderRadius: '20px', padding: '28px 24px', width: '320px',
          textAlign: 'center', position: 'relative',
          boxShadow: isLight
            ? '0 0 40px rgba(124,111,160,0.2), 0 20px 60px rgba(0,0,0,0.08)'
            : '0 20px 60px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '12px', right: '16px',
            background: 'none', border: 'none', color: closeColor,
            fontSize: '1.2rem', cursor: 'pointer',
          }}
        >
          ✕
        </button>

        <div style={{ fontSize: '1.6rem', marginBottom: '8px' }}>🔮</div>
        <h3 style={{ color: titleColor, margin: '0 0 4px', fontSize: '1rem' }}>
          Desbloquea tu lectura
        </h3>
        <p style={{ color: subtitleColor, fontSize: '0.75rem', margin: '0 0 18px' }}>
          Revela las 3 cartas + síntesis final
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          <button
            onClick={() => {
              if (!isLoggedIn) { onShowAuth(); return; }
              canAffordStandard ? onUnlock('standard') : onShowPurchase();
            }}
            style={{
              background: stdBtnBg,
              border: `1px solid ${stdBtnBorder}`,
              borderRadius: '12px', padding: '12px', color: stdBtnColor,
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <strong style={{ display: 'block', marginBottom: '2px' }}>
              Estándar — {CREDIT_COSTS.consultation}💎
              {!canAffordStandard && isLoggedIn && (
                <span style={{ color: stdBtnSubColor, fontSize: '0.65rem', marginLeft: '6px' }}>
                  (tienes {credits ?? 0})
                </span>
              )}
            </strong>
            <span style={{ color: stdBtnSubColor, fontSize: '0.72rem' }}>
              Revelación completa · Profundizar a {CREDIT_COSTS.deepening}💎/carta
            </span>
          </button>

          <button
            onClick={() => {
              if (!isLoggedIn) { onShowAuth(); return; }
              canAffordFull ? onUnlock('full') : onShowPurchase();
            }}
            style={{
              background: isLight
                ? 'linear-gradient(135deg, #7c6fa0, #5b8db8)'
                : '#7c3aed',
              border: 'none', borderRadius: '12px',
              padding: '12px', color: '#fff', cursor: 'pointer',
              textAlign: 'left', position: 'relative',
            }}
          >
            <span style={{
              position: 'absolute', top: '-9px', right: '12px',
              background: isLight ? '#b8860b' : '#ffd700',
              color: isLight ? '#fff' : '#000',
              fontSize: '0.55rem',
              padding: '2px 8px', borderRadius: '8px', fontWeight: 700,
            }}>
              RECOMENDADO
            </span>
            <strong style={{ display: 'block', marginBottom: '2px' }}>
              Full — {CREDIT_COSTS.ancestral_ritual}💎
            </strong>
            <span style={{ color: isLight ? 'rgba(255,255,255,0.85)' : '#c4b5fd', fontSize: '0.72rem' }}>
              Todo incluido · Profundización gratis en las 3 cartas
            </span>
          </button>
        </div>

        <div style={{
          borderTop: `1px solid ${dividerColor}`, paddingTop: '12px',
          display: 'flex', flexDirection: 'column', gap: '6px',
        }}>
          {!isLoggedIn && (
            <button
              onClick={onShowAuth}
              style={{
                background: 'none', border: 'none', color: linkColor,
                cursor: 'pointer', fontSize: '0.75rem',
              }}
            >
              🎁 Registrarme y obtener 100💎 gratis
            </button>
          )}
          {!isLoggedIn && (
            <button
              onClick={onShowAuth}
              style={{ background: 'none', border: 'none', color: altLinkColor, cursor: 'pointer', fontSize: '0.72rem' }}
            >
              Ya tengo cuenta — iniciar sesión
            </button>
          )}
          {isLoggedIn && (
            <button
              onClick={onShowPurchase}
              style={{ background: 'none', border: 'none', color: buyLinkColor, cursor: 'pointer', fontSize: '0.68rem' }}
            >
              💳 Comprar créditos
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
