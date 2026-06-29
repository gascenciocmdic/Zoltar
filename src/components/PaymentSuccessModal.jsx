import { useEffect, useState } from 'react';
import { I18N } from '../data/translations';
import { useTheme } from '../lib/themeContext';

export default function PaymentSuccessModal({
  isOpen, purchasedCredits, newBalance, isVerifying, onContinue, language
}) {
  const [dots, setDots] = useState('');
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const t = (I18N[language] || I18N.es).ui;

  useEffect(() => {
    if (!isVerifying) return;
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(id);
  }, [isVerifying]);

  if (!isOpen) return null;

  const balanceLabelColor = isLight ? 'rgba(45,37,64,0.5)' : 'rgba(255,255,255,0.5)';
  const balanceSubColor = isLight ? 'rgba(45,37,64,0.35)' : 'rgba(255,255,255,0.35)';
  const gemColor = isLight ? 'rgba(45,37,64,0.4)' : 'rgba(255,255,255,0.5)';
  const numberColor = isLight ? '#b8860b' : '#ffd700';
  const balanceBg = isLight
    ? 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.06))'
    : 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))';
  const balanceBorder = isLight
    ? '1px solid rgba(16,185,129,0.25)'
    : '1px solid rgba(16,185,129,0.3)';
  const spinnerBorder = isLight
    ? '3px solid rgba(124,111,160,0.15)'
    : '3px solid rgba(255,215,0,0.2)';
  const spinnerTop = isLight ? '3px solid #7c6fa0' : '3px solid #ffd700';

  if (isVerifying) {
    return (
      <div className="auth-overlay">
        <div className="auth-modal" style={{ maxWidth: '380px' }}>
          <div className="auth-icon" style={{ fontSize: '3rem' }}>⏳</div>
          <h2 className="auth-title">{t.payment_verifying}{dots}</h2>
          <p className="auth-subtitle" style={{ marginTop: '8px' }}>
            Procesando tu pago con Paddle
          </p>
          <div style={{
            margin: '20px auto', width: '48px', height: '48px',
            border: spinnerBorder, borderTop: spinnerTop,
            borderRadius: '50%', animation: 'spin 1s linear infinite',
          }} />
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

        <div style={{
          background: balanceBg,
          border: balanceBorder,
          borderRadius: '14px', padding: '18px', margin: '16px 0', textAlign: 'center',
        }}>
          <p style={{
            fontSize: '0.8rem', color: balanceLabelColor, marginBottom: '6px',
            textTransform: 'uppercase', letterSpacing: '1px',
          }}>
            {t.payment_success_balance}
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
            <span style={{ fontSize: '3rem', fontWeight: 800, color: numberColor }}>
              {newBalance ?? '…'}
            </span>
            <span style={{ fontSize: '1.1rem', color: gemColor }}>💎</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: balanceSubColor, marginTop: '4px' }}>
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
