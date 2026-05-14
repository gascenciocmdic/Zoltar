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
  const [forgotPassword,     setForgotPassword]     = useState(false);
  const [resetSent,          setResetSent]          = useState(false);

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
        emailRedirectTo: `${import.meta.env.VITE_APP_URL || 'https://zoltar-two.vercel.app'}?verified=1&ref=${refCode || ''}`,
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

  // ── Pantalla: recuperación de contraseña ────────────────
  if (forgotPassword) {
    const handleResetPassword = async () => {
      if (!email) return setError('Ingresa tu correo electrónico');
      setLoading(true); setError('');

      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${import.meta.env.VITE_APP_URL || 'https://zoltar-two.vercel.app'}?reset=1`,
      });

      setLoading(false);
      if (err) return setError(err.message);
      setResetSent(true);
    };

    if (resetSent) {
      return (
        <div className="auth-overlay" onClick={onClose}>
          <div className="auth-modal" onClick={e => e.stopPropagation()}>
            <div className="auth-icon">✉️</div>
            <h2 className="auth-title">Revisa tu correo</h2>
            <p className="auth-subtitle">
              Te enviamos un enlace de recuperación a <strong>{email}</strong>
            </p>
            <button className="auth-btn-secondary" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      );
    }

    return (
      <div className="auth-overlay" onClick={onClose}>
        <div className="auth-modal" onClick={e => e.stopPropagation()}>
          <button className="auth-close" onClick={onClose}>✕</button>
          <div className="auth-icon">🔑</div>
          <h2 className="auth-title">Recupera tu acceso</h2>
          <p className="auth-subtitle">
            Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña
          </p>
          <div className="auth-fields">
            <input
              className="auth-input"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleResetPassword(); }}
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button className="auth-btn-primary" onClick={handleResetPassword} disabled={loading}>
            {loading ? '...' : 'Enviar enlace de recuperación'}
          </button>
          <button
            className="auth-btn-secondary"
            style={{ marginTop: '10px', background: 'none', border: 'none', color: '#ffd700', cursor: 'pointer', fontSize: '0.85rem' }}
            onClick={() => { setForgotPassword(false); setResetSent(false); setError(''); setTab('login'); }}
          >
            ← Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

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
          {tab === 'login' && (
            <button
              style={{ background: 'none', border: 'none', color: '#ffd700', cursor: 'pointer', fontSize: '0.8rem', padding: '2px 0', textAlign: 'right', alignSelf: 'flex-end', opacity: 0.85 }}
              onClick={() => { setForgotPassword(true); setResetSent(false); setError(''); }}
            >
              ¿Olvidaste tu contraseña?
            </button>
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
            Al registrarte aceptas nuestros{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#ffd700' }}>
              Términos y Condiciones
            </a>
            {' '}y la{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#ffd700' }}>
              Política de Privacidad
            </a>.
          </p>
        )}
      </div>
    </div>
  );
}
