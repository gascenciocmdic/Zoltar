import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Modal de autenticación: registro / login / verificación de email.
 *
 * Props:
 *   isOpen      boolean
 *   onClose     () => void
 *   onAuth      (session) => void   ← llamado al autenticar con éxito
 *   referralCode string | null      ← código pre-cargado de URL ?ref=XXX
 *   language    string
 */
export default function AuthModal({ isOpen, onClose, onAuth, referralCode, language }) {
  const [tab,       setTab]       = useState('login');   // 'login' | 'register'
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [refCode,   setRefCode]   = useState(referralCode || '');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);

  useEffect(() => { if (referralCode) setRefCode(referralCode); }, [referralCode]);
  useEffect(() => { if (isOpen) { setError(''); setLoading(false); } }, [isOpen]);

  if (!isOpen || !supabase) return null;

  const handleRegister = async () => {
    if (!email || !password) return setError('Completa todos los campos');
    if (password.length < 6)  return setError('La contraseña debe tener al menos 6 caracteres');
    setLoading(true); setError('');

    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { referral_code_used: refCode || null },
        emailRedirectTo: `https://zoltar-two.vercel.app?verified=1&ref=${refCode || ''}`,
      },
    });

    setLoading(false);
    if (err) return setError(err.message);
    setPendingVerification(true);
  };

  const handleLogin = async () => {
    if (!email || !password) return setError('Completa todos los campos');
    setLoading(true); setError('');

    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (err) return setError(err.message);
    onAuth(data.session);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') tab === 'register' ? handleRegister() : handleLogin();
  };

  // ── Pantalla: verificación pendiente ────────────────────
  if (pendingVerification) {
    const handleAlreadyVerified = async () => {
      if (!email || !password) { setTab('login'); setPendingVerification(false); return; }
      setLoading(true); setError('');
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (err) {
        setError('Aún no confirmado o contraseña incorrecta. Revisa tu correo e intenta de nuevo.');
        return;
      }
      onAuth(data.session);
      onClose();
    };

    return (
      <div className="auth-overlay" onClick={onClose}>
        <div className="auth-modal" onClick={e => e.stopPropagation()}>
          <div className="auth-icon">✉️</div>
          <h2 className="auth-title">Revisa tu correo</h2>
          <p className="auth-subtitle">
            Enviamos un enlace de verificación a <strong>{email}</strong>.
            Al confirmarlo recibirás <strong>100 créditos</strong> de bienvenida.
          </p>
          {refCode && (
            <p className="auth-note">¡Además recibirás 25 créditos extra por haber sido referido!</p>
          )}
          <button className="auth-btn-primary" onClick={handleAlreadyVerified} disabled={loading} style={{ marginBottom: '10px' }}>
            {loading ? '...' : '✅ Ya confirmé mi correo — Iniciar sesión'}
          </button>
          {error && <p className="auth-error">{error}</p>}
          <button className="auth-btn-secondary" onClick={onClose}>Cerrar por ahora</button>
        </div>
      </div>
    );
  }

  // ── Modal principal ──────────────────────────────────────
  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose}>✕</button>

        <div className="auth-icon">🔮</div>
        <h2 className="auth-title">El Oráculo te invoca</h2>
        <p className="auth-subtitle">
          Crea tu cuenta gratuita y recibe <strong>100 créditos</strong> de bienvenida
        </p>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(''); }}
          >
            Registro
          </button>
          <button
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(''); }}
          >
            Iniciar sesión
          </button>
        </div>

        {/* Campos */}
        <div className="auth-fields">
          <input
            className="auth-input"
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Contraseña (mín. 6 caracteres)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {tab === 'register' && (
            <input
              className="auth-input auth-input-small"
              type="text"
              placeholder="Código de referido (opcional)"
              value={refCode}
              onChange={e => setRefCode(e.target.value.toUpperCase())}
              maxLength={8}
            />
          )}
        </div>

        {error && <p className="auth-error">{error}</p>}

        <button
          className="auth-btn-primary"
          onClick={tab === 'register' ? handleRegister : handleLogin}
          disabled={loading}
        >
          {loading ? '...' : tab === 'register' ? 'Crear cuenta y recibir créditos' : 'Entrar al Oráculo'}
        </button>

        {tab === 'register' && (
          <p className="auth-terms">
            Al registrarte aceptas el uso de tus datos para la experiencia oracular.
          </p>
        )}
      </div>
    </div>
  );
}
