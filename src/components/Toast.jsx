import { useState, useEffect } from 'react';

const listeners = new Set();
let nextId = 0;

export function showToast(message, type = 'error') {
  const id = ++nextId;
  listeners.forEach((fn) => fn({ id, message, type }));
}

const TYPE_STYLES = {
  error:   { border: '#ef4444', icon: '✕', bg: 'rgba(30,0,0,0.97)', color: '#fca5a5' },
  success: { border: '#10b981', icon: '✓', bg: 'rgba(0,20,10,0.97)', color: '#6ee7b7' },
  warning: { border: '#f59e0b', icon: '⚠', bg: 'rgba(25,15,0,0.97)', color: '#fcd34d' },
  info:    { border: '#6366f1', icon: 'ℹ', bg: 'rgba(5,5,25,0.97)',  color: '#a5b4fc' },
};

function Toast({ id, message, type, onRemove }) {
  const [visible, setVisible] = useState(false);
  const s = TYPE_STYLES[type] ?? TYPE_STYLES.error;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(id), 300);
    }, 4000);
    return () => clearTimeout(t);
  }, [id, onRemove]);

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(() => onRemove(id), 300); }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        background: s.bg, border: `1px solid ${s.border}44`,
        borderLeft: `3px solid ${s.border}`,
        borderRadius: 10, padding: '12px 16px',
        maxWidth: 380, cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(16px)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(20px)',
        transition: 'opacity 0.25s, transform 0.25s',
      }}
    >
      <span style={{ color: s.border, fontWeight: 700, fontSize: 14, flexShrink: 0, lineHeight: 1.4 }}>
        {s.icon}
      </span>
      <span style={{ color: s.color, fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word' }}>
        {message}
      </span>
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    function handler(toast) {
      setToasts((prev) => [...prev.slice(-4), toast]);
    }
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  function remove(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', top: 20, right: 20, zIndex: 999999,
      display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'none',
    }}>
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <Toast id={t.id} message={t.message} type={t.type} onRemove={remove} />
        </div>
      ))}
    </div>
  );
}
