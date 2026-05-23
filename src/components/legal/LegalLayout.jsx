import { useEffect } from 'react';

export default function LegalLayout({ title, children }) {
  useEffect(() => {
    // The global CSS sets body overflow:hidden for the app canvas.
    // Legal pages are standalone routes that need normal scroll.
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    const root = document.getElementById('root');
    if (root) {
      root.style.height = 'auto';
      root.style.overflowY = 'auto';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
      if (root) {
        root.style.height = '';
        root.style.overflowY = '';
      }
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050505',
      color: '#d1d5db',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: 15,
      lineHeight: 1.75,
    }}>
      {/* Top bar */}
      <div style={{
        borderBottom: '1px solid #1f2937',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <a
          href="/"
          style={{
            color: '#ffd700',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.06em',
          }}
        >
          ← ZOLTAR
        </a>
        <span style={{ color: '#374151', fontSize: 13 }}>/</span>
        <span style={{ color: '#6b7280', fontSize: 13 }}>{title}</span>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: 740,
        margin: '0 auto',
        padding: '48px 24px 80px',
      }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 800,
          color: '#ffd700',
          marginBottom: 8,
          letterSpacing: '-0.01em',
        }}>
          {title}
        </h1>
        <div style={{ color: '#4b5563', fontSize: 13, marginBottom: 40 }}>
          Última actualización: 14 de mayo de 2026
        </div>
        {children}
      </div>
    </div>
  );
}

export function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{
        fontSize: 16,
        fontWeight: 700,
        color: '#e5e7eb',
        marginBottom: 10,
        paddingBottom: 6,
        borderBottom: '1px solid #1f2937',
      }}>
        {title}
      </h2>
      <div style={{ color: '#9ca3af' }}>{children}</div>
    </section>
  );
}
