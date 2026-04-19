import { useState } from 'react';

/**
 * Widget flotante de créditos — visible en todas las fases una vez autenticado.
 *
 * Props:
 *   user        object | null
 *   credits     number | null
 *   onBuy       () => void     ← abre PurchaseModal
 *   onLogout    () => void
 */
export default function CreditWidget({ user, credits, onBuy, onLogout }) {
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const low = credits !== null && credits < 40;

  return (
    <div className="credit-widget">
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

          <button className="credit-dd-logout" onClick={() => { setOpen(false); onLogout(); }}>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
