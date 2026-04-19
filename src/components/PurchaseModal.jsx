import { useState } from 'react';
import { PACKAGES } from '../lib/credits';

/**
 * Modal de compra de créditos vía Stripe.
 *
 * Props:
 *   isOpen          boolean
 *   onClose         () => void
 *   session         Supabase session object
 *   reason          string | null   ← mensaje opcional del por qué se abrió
 *   onSaveState     () => void      ← guardar estado de la app antes de redirigir
 */
export default function PurchaseModal({ isOpen, onClose, session, reason, onSaveState }) {
  const [loading, setLoading] = useState(null);  // packageId cargando
  const [error,   setError]   = useState('');

  if (!isOpen) return null;

  const handleBuy = async (packageId) => {
    if (!session) return setError('Debes iniciar sesión primero');
    setLoading(packageId);
    setError('');

    try {
      const res = await fetch('/api/checkout', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ packageId }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Error al crear sesión de pago');

      // Guardar estado de la app antes de salir
      if (onSaveState) onSaveState();

      // Redirigir a Stripe Checkout
      window.location.href = data.url;
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
                onClick={() => handleBuy(pkg.id)}
                disabled={!!loading}
              >
                {loading === pkg.id ? 'Redirigiendo...' : 'Comprar'}
              </button>
            </div>
          ))}
        </div>

        {error && <p className="auth-error" style={{ marginTop: '12px' }}>{error}</p>}

        <p className="auth-terms">
          Pago seguro vía Stripe · Sin suscripción · Los créditos no expiran
        </p>
      </div>
    </div>
  );
}
