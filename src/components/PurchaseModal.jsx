import { useState, useEffect } from 'react';
import { PACKAGES } from '../lib/credits';

const PADDLE_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;

let paddleReady = false;

function initPaddle() {
  if (paddleReady || !PADDLE_TOKEN || typeof window === 'undefined') return;
  if (!window.Paddle) return;
  window.Paddle.Initialize({ token: PADDLE_TOKEN });
  paddleReady = true;
}

/**
 * Modal de compra de créditos vía Paddle.
 *
 * Props:
 *   isOpen          boolean
 *   onClose         () => void
 *   session         Supabase session object
 *   reason          string | null
 *   onSaveState     () => void  ← guardar estado antes de que Paddle redirija al success URL
 */
export default function PurchaseModal({ isOpen, onClose, session, reason, onSaveState, language = 'es' }) {
  const [loading, setLoading] = useState(null);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!isOpen) return;
    // Intentar inicializar Paddle cuando se abre el modal
    if (window.Paddle) {
      initPaddle();
    } else {
      // Si el script aún no cargó, esperar
      const check = setInterval(() => {
        if (window.Paddle) { initPaddle(); clearInterval(check); }
      }, 100);
      return () => clearInterval(check);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBuy = async (pkg) => {
    if (!session) return setError('Debes iniciar sesión primero');
    if (!window.Paddle) return setError('Error al cargar el sistema de pagos. Recarga la página.');

    setLoading(pkg.id);
    setError('');

    try {
      // Obtenemos el priceId desde el servidor (nunca hardcodeado en el cliente)
      const res = await fetch('/api/paddle-checkout', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ packageId: pkg.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar el pago');

      // Guardar estado antes de que Paddle redirija al success URL
      if (onSaveState) onSaveState();

      const appUrl = window.location.origin;

      window.Paddle.Checkout.open({
        items: [{ priceId: data.priceId, quantity: 1 }],
        customData: {
          userId:    data.userId,
          packageId: data.packageId,
        },
        customer: { email: session.user.email },
        settings: {
          successUrl: `${appUrl}?payment=success&credits=${data.credits}`,
        },
      });

      // El modal de Paddle se abre encima — cerramos este modal
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
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
                {loading === pkg.id ? 'Cargando...' : 'Comprar'}
              </button>
            </div>
          ))}
        </div>

        {error && <p className="auth-error" style={{ marginTop: '12px' }}>{error}</p>}

        <p className="auth-terms">
          Pago seguro vía Paddle · Sin suscripción · Los créditos no expiran
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
