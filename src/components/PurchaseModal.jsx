import { useState } from 'react';
import { PACKAGES } from '../lib/credits';

/**
 * Modal de compra de créditos vía LemonSqueezy.
 *
 * Props:
 *   isOpen          boolean
 *   onClose         () => void
 *   session         Supabase session object
 *   reason          string | null
 *   onSaveState     () => void  ← guardar estado antes del redirect
 */
export default function PurchaseModal({ isOpen, onClose, session, reason }) {
  const [loading, setLoading] = useState(null);
  const [error,   setError]   = useState('');

  if (!isOpen) return null;

  const handleBuy = async (pkg) => {
    if (!session) return setError('Debes iniciar sesión primero');

    setLoading(pkg.id);
    setError('');

    try {
      const res = await fetch('/api/lemonsqueezy-checkout', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ packageId: pkg.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar el pago');

      // Redirigir al checkout alojado de LemonSqueezy
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err.message);
      setLoading(null);
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="purchase-modal" onClick={e => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose}>✕</button>

        <div className="auth-icon">✨</div>
        <h2 className="auth-title">Recargar el Oráculo</h2>

        {reason && (
          <p className="purchase-reason">{reason}</p>
        )}

        <div className="purchase-packages">
          {PACKAGES.map(pkg => (
            <div
              key={pkg.id}
              className={`purchase-card ${pkg.popular ? 'purchase-card-popular' : ''}`}
            >
              {pkg.popular && <div className="purchase-badge">⭐ Más popular</div>}

              <div className="purchase-card-name">{pkg.name}</div>
              <div className="purchase-card-credits">
                <span className="credit-gem">💎</span> {pkg.credits}
              </div>
              <div className="purchase-card-subs">{pkg.consultations}</div>
              <div className="purchase-card-price">{pkg.price_display}</div>

              <button
                className="purchase-btn"
                onClick={() => handleBuy(pkg)}
                disabled={!!loading}
              >
                {loading === pkg.id ? 'Redirigiendo...' : 'Comprar'}
              </button>
            </div>
          ))}
        </div>

        {error && <p className="auth-error" style={{ marginTop: '12px' }}>{error}</p>}

        <p className="auth-terms">
          Pago seguro vía LemonSqueezy · Sin suscripción · Los créditos no expiran
          <br />
          <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#ffd700' }}>
            Términos y Condiciones
          </a>
          {' · '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#ffd700' }}>
            Privacidad
          </a>
        </p>
      </div>
    </div>
  );
}
