import { useState, useEffect, useRef } from 'react';

export default function CreditWidget({ user, credits, onBuy, onLogout, flash }) {
  const [open, setOpen]             = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [particles, setParticles]   = useState([]);
  const particleId = useRef(0);

  // Disparar animación cuando llega un flash
  useEffect(() => {
    if (!flash) return;
    const id = particleId.current++;
    setParticles(prev => [...prev, { id, amount: flash.amount }]);
    const timer = setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== id));
    }, 1800);
    return () => clearTimeout(timer);
  }, [flash]);

  if (!user) return null;

  const low = credits !== null && credits < 40;

  const handleLogoutClick = () => {
    setOpen(false);
    setConfirming(true);
  };

  const handleConfirmLogout = () => {
    setConfirming(false);
    if (onLogout) onLogout();
  };

  return (
    <>
      {/* Diálogo de confirmación de cierre de sesión */}
      {confirming && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#1a1a2e', border: '1px solid rgba(255,215,0,0.3)',
            borderRadius: '16px', padding: '32px 28px', maxWidth: '340px', width: '90%',
            textAlign: 'center', color: '#fff',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🚪</div>
            <h3 style={{ color: '#ffd700', marginBottom: '10px', fontSize: '1.2rem' }}>
              Cerrar sesión
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Está a punto de salir de su sesión. ¿Desea continuar?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setConfirming(false)}
                style={{
                  padding: '10px 24px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)',
                  background: 'transparent', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '0.9rem',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmLogout}
                style={{
                  padding: '10px 24px', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                  color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                }}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Partículas de descuento flotantes */}
      {particles.map(p => (
        <div
          key={p.id}
          className="credit-flash-particle"
          style={{ position: 'fixed', top: '18px', right: '90px', zIndex: 99998, pointerEvents: 'none' }}
        >
          <span>{p.amount} 💎</span>
        </div>
      ))}

      {/* Pill flotante */}
      <div className={`credit-widget ${particles.length > 0 ? 'credit-widget-shake' : ''}`}>
        <button
          className={`credit-pill ${low ? 'credit-pill-low' : ''}`}
          onClick={() => setOpen(!open)}
          title="Mis créditos"
        >
          <span className="credit-gem">💎</span>
          <span className="credit-count">{credits ?? '…'}</span>
        </button>

        {open && (
          <div className="credit-dropdown">
            <div className="credit-dd-header">
              <span className="credit-dd-email">{user.email}</span>
              <button className="credit-dd-close" onClick={() => setOpen(false)}>✕</button>
            </div>

            <div className="credit-dd-balance">
              <span className="credit-dd-gem">💎</span>
              <span className="credit-dd-num">{credits ?? '…'}</span>
              <span className="credit-dd-label">créditos</span>
            </div>

            <div className="credit-dd-costs">
              <div className="credit-cost-row">
                <span>Consulta completa</span><span>−40</span>
              </div>
              <div className="credit-cost-row">
                <span>Profundización</span><span>−10 c/u</span>
              </div>
              <div className="credit-cost-row">
                <span>Re-consulta</span><span>−20</span>
              </div>
            </div>

            {low && (
              <p className="credit-dd-warning">
                ⚠️ Créditos bajos — recarga para continuar
              </p>
            )}

            <button className="credit-dd-buy" onClick={() => { setOpen(false); onBuy(); }}>
              Comprar créditos
            </button>

            <button className="credit-dd-logout" onClick={handleLogoutClick}>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </>
  );
}
