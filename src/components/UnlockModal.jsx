import { CREDIT_COSTS } from '../lib/credits.js';

export default function UnlockModal({
  isOpen,
  onClose,
  onUnlock,
  authSession,
  credits,
  onShowAuth,
  onShowPurchase,
}) {
  if (!isOpen) return null;

  const canAffordStandard = (credits ?? 0) >= CREDIT_COSTS.consultation;
  const canAffordFull = (credits ?? 0) >= CREDIT_COSTS.ancestral_ritual;
  const isLoggedIn = !!authSession;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 9000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#14142b', border: '1px solid rgba(255,215,0,0.3)',
          borderRadius: '20px', padding: '28px 24px', width: '320px',
          textAlign: 'center', position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '12px', right: '16px',
            background: 'none', border: 'none', color: '#666',
            fontSize: '1.2rem', cursor: 'pointer',
          }}
        >
          ✕
        </button>

        <div style={{ fontSize: '1.6rem', marginBottom: '8px' }}>🔮</div>
        <h3 style={{ color: '#ffd700', margin: '0 0 4px', fontSize: '1rem' }}>
          Desbloquea tu lectura
        </h3>
        <p style={{ color: '#888', fontSize: '0.75rem', margin: '0 0 18px' }}>
          Revela las 3 cartas + síntesis final
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          <button
            onClick={() => {
              if (!isLoggedIn) { onShowAuth(); return; }
              canAffordStandard ? onUnlock('standard') : onShowPurchase();
            }}
            style={{
              background: 'rgba(255,215,0,0.08)', border: '1px solid #ffd700',
              borderRadius: '12px', padding: '12px', color: '#ffd700',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <strong style={{ display: 'block', marginBottom: '2px' }}>
              Estándar — {CREDIT_COSTS.consultation}💎
              {!canAffordStandard && isLoggedIn && (
                <span style={{ color: '#888', fontSize: '0.65rem', marginLeft: '6px' }}>
                  (tienes {credits ?? 0})
                </span>
              )}
            </strong>
            <span style={{ color: '#888', fontSize: '0.72rem' }}>
              Revelación completa · Profundizar a {CREDIT_COSTS.deepening}💎/carta
            </span>
          </button>

          <button
            onClick={() => {
              if (!isLoggedIn) { onShowAuth(); return; }
              canAffordFull ? onUnlock('full') : onShowPurchase();
            }}
            style={{
              background: '#7c3aed', border: 'none', borderRadius: '12px',
              padding: '12px', color: '#fff', cursor: 'pointer',
              textAlign: 'left', position: 'relative',
            }}
          >
            <span style={{
              position: 'absolute', top: '-9px', right: '12px',
              background: '#ffd700', color: '#000', fontSize: '0.55rem',
              padding: '2px 8px', borderRadius: '8px', fontWeight: 700,
            }}>
              RECOMENDADO
            </span>
            <strong style={{ display: 'block', marginBottom: '2px' }}>
              Full — {CREDIT_COSTS.ancestral_ritual}💎
            </strong>
            <span style={{ color: '#c4b5fd', fontSize: '0.72rem' }}>
              Todo incluido · Profundización gratis en las 3 cartas
            </span>
          </button>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px',
          display: 'flex', flexDirection: 'column', gap: '6px',
        }}>
          {!isLoggedIn && (
            <button
              onClick={onShowAuth}
              style={{
                background: 'none', border: 'none', color: '#a78bfa',
                cursor: 'pointer', fontSize: '0.75rem',
              }}
            >
              🎁 Registrarme y obtener 100💎 gratis
            </button>
          )}
          {!isLoggedIn && (
            <button
              onClick={onShowAuth}
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.72rem' }}
            >
              Ya tengo cuenta — iniciar sesión
            </button>
          )}
          {isLoggedIn && (
            <button
              onClick={onShowPurchase}
              style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.68rem' }}
            >
              💳 Comprar créditos
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
