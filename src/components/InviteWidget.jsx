import { useState } from 'react';

const APP_URL = 'https://zoltar-two.vercel.app';

export default function InviteWidget({ authSession, referralCode, inviterName }) {
  const [email, setEmail] = useState('');
  const [emailState, setEmailState] = useState('idle'); // idle | sending | sent | error
  const [copied, setCopied] = useState(false);

  const inviteLink = referralCode ? `${APP_URL}?ref=${referralCode}` : APP_URL;

  const handleSendEmail = async () => {
    if (!email.trim()) return;
    setEmailState('sending');
    try {
      const res = await fetch('/api/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail: email, referralCode: referralCode || undefined, inviterName: inviterName || undefined }),
      });
      setEmailState(res.ok ? 'sent' : 'error');
    } catch {
      setEmailState('error');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const waText = referralCode
    ? `✨ Te invito a descubrir tu lectura en Zoltar. Usa mi código ${referralCode} para obtener 25💎 extra: ${inviteLink}`
    : `✨ Descubrí Zoltar, el oráculo de vidas pasadas. Pruébalo en: ${APP_URL}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`;

  return (
    <div style={{
      textAlign: 'center', padding: '18px 16px',
      border: '1px solid rgba(255,215,0,0.2)', borderRadius: '16px',
      background: 'rgba(255,215,0,0.04)', marginTop: '32px',
    }}>
      <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>🌟</div>

      {referralCode ? (
        <>
          <p style={{ color: '#ffd700', fontSize: '0.85rem', fontWeight: 700, margin: '0 0 4px' }}>
            Invita y gana 50💎 por registro
          </p>
          <p style={{ color: '#888', fontSize: '0.72rem', margin: '0 0 12px' }}>
            Tu invitado recibe 25💎 extra al registrarse
          </p>
          <div style={{
            background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.25)',
            borderRadius: '10px', padding: '10px', marginBottom: '14px',
          }}>
            <div style={{ color: '#888', fontSize: '0.62rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Tu código
            </div>
            <div style={{ color: '#ffd700', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '6px' }}>
              {referralCode}
            </div>
          </div>
        </>
      ) : (
        <>
          <p style={{ color: '#ffd700', fontSize: '0.85rem', fontWeight: 700, margin: '0 0 4px' }}>
            ¿Conoces a alguien que necesite esta lectura?
          </p>
          <p style={{ color: '#888', fontSize: '0.72rem', margin: '0 0 14px' }}>
            Comparte Zoltar con quienes más lo necesitan
          </p>
        </>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSendEmail()}
          placeholder="correo@ejemplo.com"
          style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,215,0,0.2)',
            borderRadius: '8px', padding: '8px 10px', color: '#fff', fontSize: '0.75rem',
            outline: 'none',
          }}
        />
        <button
          onClick={handleSendEmail}
          disabled={emailState === 'sending' || emailState === 'sent'}
          style={{
            background: emailState === 'sent'
              ? 'linear-gradient(135deg,#16a34a,#15803d)'
              : emailState === 'error'
              ? 'linear-gradient(135deg,#dc2626,#b91c1c)'
              : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
            border: 'none', borderRadius: '8px', padding: '8px',
            color: '#fff', fontSize: '0.75rem', cursor: 'pointer',
          }}
        >
          {emailState === 'idle' && (referralCode ? '✉️ Enviar invitación personalizada' : '✉️ Enviar invitación')}
          {emailState === 'sending' && '⏳ Enviando...'}
          {emailState === 'sent' && '✅ ¡Enviado!'}
          {emailState === 'error' && '❌ Error — intenta de nuevo'}
        </button>
      </div>

      <div style={{ color: '#555', fontSize: '0.65rem', marginBottom: '10px' }}>
        — o comparte {referralCode ? 'tu link único' : 'directo'} —
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <button
          onClick={handleCopyLink}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '8px', padding: '7px 14px', color: '#e0e0e0',
            fontSize: '0.72rem', cursor: 'pointer',
          }}
        >
          {copied ? '✅ Copiado' : '🔗 Copiar link'}
        </button>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: '#25D366', border: 'none', borderRadius: '8px',
            padding: '7px 14px', color: '#fff', fontSize: '0.72rem',
            cursor: 'pointer', textDecoration: 'none', display: 'flex',
            alignItems: 'center', gap: '5px',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WhatsApp
        </a>
      </div>
    </div>
  );
}
