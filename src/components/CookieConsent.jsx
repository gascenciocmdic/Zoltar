import { useState, useEffect } from 'react';

const STORAGE_KEY = 'zoltar_cookie_consent';

export function getCookieConsent() {
  return localStorage.getItem(STORAGE_KEY); // 'all' | 'essential' | null
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getCookieConsent()) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept(level) {
    localStorage.setItem(STORAGE_KEY, level);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      zIndex: 100002, width: 'min(560px, calc(100vw - 32px))',
      background: 'rgba(10,10,10,0.97)', border: '1px solid #374151',
      borderRadius: 14, padding: '18px 20px', backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      animation: 'slideUp 0.3s ease',
    }}>
      <style>{`@keyframes slideUp { from { opacity:0; transform: translateX(-50%) translateY(16px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }`}</style>

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>🍪</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
            Usamos cookies
          </div>
          <div style={{ color: '#9ca3af', fontSize: 12, lineHeight: 1.6 }}>
            Usamos cookies esenciales para que el servicio funcione. Con tu permiso, también
            cookies analíticas para mejorar ZOLTAR. Lee nuestra{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer"
              style={{ color: '#ffd700', textDecoration: 'underline' }}>
              Política de Privacidad
            </a>.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
        <button
          onClick={() => accept('essential')}
          style={{
            background: 'none', border: '1px solid #374151', borderRadius: 8,
            color: '#9ca3af', padding: '7px 16px', cursor: 'pointer', fontSize: 12,
            fontFamily: 'inherit',
          }}
        >
          Solo esenciales
        </button>
        <button
          onClick={() => accept('all')}
          style={{
            background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
            border: 'none', borderRadius: 8,
            color: '#000', padding: '7px 18px', cursor: 'pointer', fontSize: 12,
            fontWeight: 700, fontFamily: 'inherit',
          }}
        >
          Aceptar todas
        </button>
      </div>
    </div>
  );
}
