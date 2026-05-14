import { useState } from 'react';

const UAT_USER = 'uat';
const UAT_PASS = 'zoltar2024';
const SESSION_KEY = 'zoltar_uat_auth';

export function isUATAuthenticated() {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

export default function UATGate({ onAuth }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (user === UAT_USER && pass === UAT_PASS) {
      sessionStorage.setItem(SESSION_KEY, '1');
      onAuth();
    } else {
      setError('Credenciales incorrectas');
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#050505', fontFamily: 'system-ui, sans-serif',
    }}>
      <form onSubmit={handleSubmit} style={{
        background: '#0d0d0d', border: '1px solid #1f2937', borderRadius: 12,
        padding: '40px 48px', width: 340, display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🔮</div>
          <div style={{ color: '#ffd700', fontWeight: 700, letterSpacing: '0.08em', fontSize: 13 }}>
            ZOLTAR · UAT
          </div>
          <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>
            Ambiente de pruebas — acceso restringido
          </div>
        </div>

        <input
          type="text"
          placeholder="Usuario"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          autoComplete="username"
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          autoComplete="current-password"
          style={inputStyle}
        />

        {error && (
          <div style={{ color: '#ef4444', fontSize: 12, textAlign: 'center' }}>{error}</div>
        )}

        <button type="submit" style={{
          background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
          border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 700,
          color: '#000', cursor: 'pointer', fontSize: 14, marginTop: 4,
        }}>
          Ingresar
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  background: '#111', border: '1px solid #374151', borderRadius: 8,
  padding: '10px 14px', color: '#e5e7eb', fontSize: 14, outline: 'none',
  width: '100%', boxSizing: 'border-box',
};
