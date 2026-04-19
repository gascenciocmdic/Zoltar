import { useEffect, useState } from 'react';
import { I18N } from '../data/translations';

/**
 * Modal de confirmación de pago exitoso.
 *
 * Props:
 *   isOpen           boolean
 *   purchasedCredits number   — créditos que se acreditaron
 *   newBalance       number   — saldo actualizado
 *   isVerifying      boolean  — true mientras espera el webhook
 *   onContinue       () => void
 *   language         string
 */
export default function PaymentSuccessModal({
  isOpen, purchasedCredits, newBalance, isVerifying, onContinue, language
}) {
  const [dots, setDots] = useState('');
  const t = (I18N[language] || I18N.es).ui;

  // Animación de puntos suspensivos mientras verifica
  useEffect(() => {
    if (!isVerifying) return;
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(id);
  }, [isVerifying]);

  if (!isOpen) return null;

  if (isVerifying) {
    return (
      <div className="auth-overlay">
        <div className="auth-modal" style={{ maxWidth: '380px' }}>
          <div className="auth-icon" style={{ fontSize: '3rem' }}>⏳</div>
          <h2 className="auth-title">{t.payment_verifying}{dots}</h2>
          <p className="auth-subtitle" style={{ marginTop: '8px' }}>
            Procesando tu pago con Stripe
          </p>
          <div style={{ margin: '20px auto', width: '48px', height: '48px',
            border: '3px solid rgba(255,215,0,0.2)', borderTop: '3px solid #ffd700',
            borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-overlay">
      <div className="auth-modal" style={{ maxWidth: '420px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '10px', animation: 'bounceIn 0.6s ease' }}>
          ✨
        </div>

        <h2 className="auth-title" style={{ fontSize: '1.6rem', color: '#10b981' }}>
          {t.payment_success_title}
        </h2>

        <p className="auth-subtitle">
          {(t.payment_success_body || '').replace('{credits}', purchasedCredits)}
        </p>

        {/* Saldo actualizado */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '14px', padding: '18px', margin: '16px 0', textAlign: 'center'
        }}>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '6px',
            textTransform: 'uppercase', letterSpacing: '1px' }}>
            {t.payment_success_balance}
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
            <span style={{ fontSize: '3rem', fontWeight: 800, color: '#ffd700' }}>
              {newBalance ?? '…'}
            </span>
            <span style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.5)' }}>💎</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>
            +{purchasedCredits} créditos acreditados
          </p>
        </div>

        <button className="auth-btn-primary" onClick={onContinue}
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)', marginTop: '4px' }}>
          {t.payment_success_btn} →
        </button>
      </div>
    </div>
  );
}
