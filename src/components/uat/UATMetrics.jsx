import { useState, useEffect } from 'react';
import { readStore, clearStore, getSessionStart, deriveKPIs } from '../../lib/uatMetrics';

const LANG_LABELS = { es: 'Español', en: 'English', pt: 'Português', fr: 'Français' };

function KPICard({ label, value, sub, color = '#e5e7eb' }) {
  return (
    <div style={{
      background: '#111', border: '1px solid #1f2937', borderRadius: 10,
      padding: '16px 20px', minWidth: 120, flex: '1 1 120px',
    }}>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#4b5563', marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function FunnelRow({ label, value, max, color }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ color }}>{value} ({pct}%)</span>
      </div>
      <div style={{ background: '#1f2937', borderRadius: 4, height: 6 }}>
        <div style={{ background: color, width: `${pct}%`, height: '100%', borderRadius: 4, transition: 'width 0.4s' }} />
      </div>
    </div>
  );
}

export default function UATMetrics({ onClose }) {
  const [events, setEvents] = useState(readStore);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const interval = setInterval(() => setEvents(readStore()), 5000);
    return () => clearInterval(interval);
  }, []);

  const kpis = deriveKPIs(events);
  const sessionStart = getSessionStart();
  const duration = sessionStart
    ? Math.round((Date.now() - new Date(sessionStart).getTime()) / 60000)
    : 0;

  const estimatedMRR = kpis.purchaseCount > 0
    ? ((kpis.revenue / (duration || 1)) * 60 * 24 * 30).toFixed(0)
    : 0;

  function handleClear() {
    clearStore();
    setEvents([]);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 999999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: visible ? 1 : 0, transition: 'opacity 0.3s',
      padding: '20px', overflowY: 'auto',
    }}>
      <div style={{
        background: '#0a0a0a', border: '1px solid #374151', borderRadius: 16,
        padding: '28px 32px', width: '100%', maxWidth: 680,
        fontFamily: 'system-ui, sans-serif', color: '#e5e7eb',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#fbbf24', letterSpacing: '0.06em' }}>
              ZOLTAR UAT — REPORTE DE SESIÓN
            </div>
            <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
              Duración: {duration} min · {events.length} eventos registrados
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid #374151', borderRadius: 8,
            color: '#9ca3af', padding: '6px 14px', cursor: 'pointer', fontSize: 12,
          }}>
            Cerrar
          </button>
        </div>

        {/* Main KPIs */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
          <KPICard label="Sesiones" value={kpis.sessions} />
          <KPICard label="Tasa completación" value={`${kpis.completionRate}%`} color="#10b981"
            sub="revelation_viewed / sesiones" />
          <KPICard label="Tasa desbloqueo" value={`${kpis.unlockRate}%`} color="#6366f1"
            sub="unlocks / revelaciones" />
          <KPICard label="Conversión compra" value={`${kpis.conversionRate}%`} color="#f59e0b"
            sub="compras / modal abierto" />
          <KPICard label="Ingresos (test)" value={`$${kpis.revenue.toFixed(2)}`} color="#fbbf24" />
          <KPICard label="MRR estimado" value={`$${estimatedMRR}`} color="#f472b6"
            sub="proyección 30 días" />
        </div>

        {/* Funnel */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 12, letterSpacing: '0.05em' }}>
            EMBUDO DE CONVERSIÓN
          </div>
          <FunnelRow label="Sesiones iniciadas" value={kpis.sessions} max={kpis.sessions} color="#60a5fa" />
          <FunnelRow label="Revelación vista" value={kpis.revelations} max={kpis.sessions} color="#34d399" />
          <FunnelRow label="Modal de compra abierto" value={kpis.modalOpens} max={kpis.sessions} color="#a78bfa" />
          <FunnelRow label="Lecturas desbloqueadas" value={kpis.unlocks} max={kpis.sessions} color="#fb923c" />
          <FunnelRow label="Compras completadas" value={kpis.purchaseCount} max={kpis.sessions} color="#fbbf24" />
        </div>

        {/* Language breakdown */}
        {Object.keys(kpis.langBreakdown).length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 10, letterSpacing: '0.05em' }}>
              IDIOMAS
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(kpis.langBreakdown).map(([lang, n]) => (
                <div key={lang} style={{
                  background: '#111', border: '1px solid #374151', borderRadius: 8,
                  padding: '8px 16px', fontSize: 13,
                }}>
                  <span style={{ color: '#e5e7eb', fontWeight: 600 }}>{LANG_LABELS[lang] ?? lang}</span>
                  <span style={{ color: '#6b7280', marginLeft: 8 }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verdict */}
        <div style={{
          background: '#111827', border: '1px solid #374151', borderRadius: 10,
          padding: '16px 20px', marginBottom: 20,
        }}>
          <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 8, letterSpacing: '0.05em' }}>
            VEREDICTO DE VIABILIDAD
          </div>
          <div style={{ fontSize: 13, color: '#d1d5db', lineHeight: 1.6 }}>
            {kpis.sessions === 0 && 'Sin datos aún. Inicia sesiones de prueba para generar métricas.'}
            {kpis.sessions > 0 && kpis.completionRate >= 60 && '✅ Flujo principal sólido. Alta tasa de completación.'}
            {kpis.sessions > 0 && kpis.completionRate < 60 && kpis.completionRate >= 30 && '⚠️ Tasa de completación mejorable. Revisar fricción en flujo.'}
            {kpis.sessions > 0 && kpis.completionRate < 30 && '🔴 Baja completación. Posible problema de UX o carga.'}
            {kpis.unlockRate >= 20 && ' Monetización muestra señal positiva.'}
            {kpis.revenue > 0 && ` Ingresos reales generados: $${kpis.revenue.toFixed(2)} USD.`}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleClear} style={{
            background: 'none', border: '1px solid #374151', borderRadius: 8,
            color: '#6b7280', padding: '8px 16px', cursor: 'pointer', fontSize: 12, flex: 1,
          }}>
            Limpiar datos
          </button>
          <button onClick={() => {
            const blob = new Blob([JSON.stringify({ kpis, events, duration }, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `zoltar-uat-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
          }} style={{
            background: '#fbbf24', border: 'none', borderRadius: 8,
            color: '#000', padding: '8px 16px', cursor: 'pointer', fontSize: 12,
            fontWeight: 700, flex: 1,
          }}>
            Exportar reporte
          </button>
        </div>
      </div>
    </div>
  );
}
