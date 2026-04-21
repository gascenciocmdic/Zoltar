import { useState } from 'react';

/**
 * Widget de referidos — muestra código único y botón de compartir.
 *
 * Props:
 *   referralCode  string
 *   onClose       () => void
 */
export default function ReferralWidget({ referralCode, onClose }) {
  const [copied, setCopied] = useState(false);

  const referralUrl = `${window.location.origin}?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const shareText = '¿Quieres descubrir tus vidas pasadas con IA? Usa mi código y recibe 25 créditos extra 🔮';

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'El Oráculo de Vidas Pasadas',
        text:  shareText,
        url:   referralUrl,
      });
    } else {
      handleCopy();
    }
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`${shareText}\n${referralUrl}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()} style={{ overflowY: 'auto', maxHeight: '90vh' }}>
        <button className="auth-close" onClick={onClose}>✕</button>

        <div className="auth-icon">🌟</div>
        <h2 className="auth-title">Invita a un alma</h2>
        <p className="auth-subtitle">
          Por cada amigo que verifique su email con tu enlace, <strong>tú ganas 50 créditos</strong> y él recibe <strong>25 de bienvenida</strong>.
        </p>

        <div className="referral-code-box">
          <span className="referral-code-label">Tu código</span>
          <span className="referral-code-value">{referralCode}</span>
        </div>

        <div className="referral-url-box">
          <span className="referral-url-text">{referralUrl}</span>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', width: '100%' }}>
          <button className="auth-btn-secondary" style={{ flex: 1 }} onClick={handleCopy}>
            {copied ? '¡Copiado! ✓' : 'Copiar enlace'}
          </button>
          <button className="auth-btn-primary" style={{ flex: 1 }} onClick={handleShare}>
            Compartir 🔮
          </button>
        </div>

        <button
          onClick={handleWhatsApp}
          style={{
            marginTop: '10px',
            width: '100%',
            padding: '12px',
            background: 'linear-gradient(135deg,#25d366,#128c7e)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '0.95rem',
            cursor: 'pointer',
            letterSpacing: '0.5px',
          }}
        >
          Invitar por WhatsApp 📱
        </button>

        <div className="referral-rewards">
          <div className="referral-reward-row">
            <span>💎 +50</span>
            <span>cuando tu referido verifica su email</span>
          </div>
          <div className="referral-reward-row">
            <span>💎 +25</span>
            <span>que recibe tu referido de bienvenida</span>
          </div>
        </div>
      </div>
    </div>
  );
}
