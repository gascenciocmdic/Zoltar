import { useState, useEffect } from 'react';
import App from './App';
import UATGate, { isUATAuthenticated } from './components/uat/UATGate';
import UATBanner from './components/uat/UATBanner';
import UATMetrics from './components/uat/UATMetrics';
import { UATContext } from './lib/uatContext';
import { initSession } from './lib/uatMetrics';

export default function UATWrapper() {
  const [authed, setAuthed] = useState(isUATAuthenticated());
  const [showMetrics, setShowMetrics] = useState(false);

  useEffect(() => {
    if (authed) {
      window.__ZOLTAR_UAT__ = true;
      initSession();
    }
  }, [authed]);

  if (!authed) {
    return <UATGate onAuth={() => setAuthed(true)} />;
  }

  return (
    <UATContext.Provider value={{ isUAT: true }}>
      <UATBanner />
      <div style={{ paddingTop: 14 }}>
        <App />
      </div>

      {/* Floating metrics button */}
      <button
        onClick={() => setShowMetrics(true)}
        style={{
          position: 'fixed', bottom: 80, right: 25, zIndex: 99998,
          background: 'rgba(251,191,36,0.15)', border: '1px solid #fbbf24',
          borderRadius: 50, padding: '6px 16px', cursor: 'pointer',
          color: '#fbbf24', fontSize: '0.7rem', fontWeight: 700,
          backdropFilter: 'blur(5px)', letterSpacing: '0.06em',
        }}
      >
        KPIs
      </button>

      {showMetrics && <UATMetrics onClose={() => setShowMetrics(false)} />}
    </UATContext.Provider>
  );
}
