import { useState, useEffect } from 'react';

/* ── Auth ─────────────────────────────────────────────────────── */
const SESSION_KEY = 'zoltar_plan_auth';
const API_BASE = import.meta.env.VITE_APP_URL || '';

function PlanGate({ onAuth }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/plan-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass }),
      });
      if (res.ok) {
        sessionStorage.setItem(SESSION_KEY, '1');
        onAuth();
      } else {
        setError('Credenciales incorrectas');
      }
    } catch (_) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <form onSubmit={handleSubmit} style={{ background: '#0d0d0d', border: '1px solid #1f2937', borderRadius: 12, padding: '40px 48px', width: 340, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🔮</div>
          <div style={{ color: '#a78bfa', fontWeight: 700, letterSpacing: '0.08em', fontSize: 14 }}>ZOLTAR · PLAN DE NEGOCIO</div>
          <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>Acceso restringido</div>
        </div>
        <input type="text" placeholder="Usuario" value={user} onChange={e => setUser(e.target.value)} autoComplete="username" style={inputSt} />
        <input type="password" placeholder="Contraseña" value={pass} onChange={e => setPass(e.target.value)} autoComplete="current-password" style={inputSt} />
        {error && <div style={{ color: '#ef4444', fontSize: 12, textAlign: 'center' }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 700, color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, marginTop: 4, opacity: loading ? 0.7 : 1 }}>{loading ? 'Verificando…' : 'Ingresar'}</button>
      </form>
    </div>
  );
}

const inputSt = { background: '#111', border: '1px solid #374151', borderRadius: 8, padding: '10px 14px', color: '#e5e7eb', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' };

/* ── Helpers ─────────────────────────────────────────────────── */
const S = {
  card:       { background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: '20px 24px', marginBottom: 16 },
  cardPurple: { background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 12, padding: '20px 24px', marginBottom: 16 },
  cardGreen:  { background: 'rgba(52,168,83,0.05)',   border: '1px solid rgba(52,168,83,0.25)',   borderRadius: 12, padding: '20px 24px', marginBottom: 16 },
  cardGold:   { background: 'rgba(199,162,76,0.05)',  border: '1px solid rgba(199,162,76,0.25)',  borderRadius: 12, padding: '20px 24px', marginBottom: 16 },
  cardRed:    { background: 'rgba(239,68,68,0.05)',   border: '1px solid rgba(239,68,68,0.25)',   borderRadius: 12, padding: '20px 24px', marginBottom: 16 },
  cardBlue:   { background: 'rgba(96,165,250,0.05)',  border: '1px solid rgba(96,165,250,0.25)',  borderRadius: 12, padding: '20px 24px', marginBottom: 16 },
  sectionTitle: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: '#444', margin: '28px 0 12px', fontWeight: 700 },
  statVal: { fontSize: 28, fontWeight: 900 },
  statLabel: { fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  tag: (bg, color) => ({ display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 700, background: bg, color }),
  progWrap: { height: 8, background: '#1a1a1a', borderRadius: 4, overflow: 'hidden', margin: '8px 0' },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
};

function Tag({ type, children }) {
  const map = { done: ['rgba(52,168,83,0.15)', '#34A853'], pending: ['rgba(255,255,255,0.05)', '#555'], next: ['rgba(199,162,76,0.15)', '#C7A24C'], blocked: ['rgba(239,68,68,0.1)', '#ef4444'] };
  const [bg, color] = map[type] || map.pending;
  return <span style={S.tag(bg, color)}>{children}</span>;
}

function ProgBar({ pct, color }) {
  return <div style={S.progWrap}><div style={{ height: '100%', borderRadius: 4, width: `${pct}%`, background: color }} /></div>;
}

function StatCard({ val, label, color }) {
  return (
    <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, padding: 16, textAlign: 'center' }}>
      <div style={{ ...S.statVal, color }}>{val}</div>
      <div style={S.statLabel}>{label}</div>
    </div>
  );
}

function Table({ headers, rows, totalRow }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', margin: '10px 0' }}>
      <thead>
        <tr>{headers.map((h, i) => <th key={i} style={{ background: '#111', color: '#9ca3af', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #222' }}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>{row.map((cell, j) => <td key={j} style={{ padding: '7px 10px', borderBottom: '1px solid #1a1a1a', color: '#d1d5db', verticalAlign: 'top' }} dangerouslySetInnerHTML={{ __html: cell }} />)}</tr>
        ))}
        {totalRow && (
          <tr style={{ background: '#0f0f0f' }}>
            {totalRow.map((cell, j) => <td key={j} style={{ padding: '7px 10px', color: '#fbbf24', fontWeight: 700, borderTop: '1px solid #333' }} dangerouslySetInnerHTML={{ __html: cell }} />)}
          </tr>
        )}
      </tbody>
    </table>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/* TAB CONTENTS                                                   */
/* ══════════════════════════════════════════════════════════════ */

function TabResumen() {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 10, marginBottom: 24 }}>
        <div style={{ fontSize: 24 }}>🎯</div>
        <div>
          <div style={{ fontSize: 11, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Próxima acción</div>
          <div style={{ fontSize: 13, color: '#ddd', marginTop: 3 }}>Configurar Stripe live · validar flujo premium end-to-end con usuarios reales · lanzamiento</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard val="13/13" label="Plan MVP completado" color="#a78bfa" />
        <StatCard val="5" label="Sprints completados" color="#34A853" />
        <StatCard val="3" label="Tiers de pago activos" color="#C7A24C" />
        <StatCard val="$0/mes" label="Costo infra actual" color="#4ade80" />
      </div>
      <div style={S.sectionTitle}>Progreso por sprint</div>
      {[
        { label: 'Plan MVP UX (Tasks 1–13)', pct: 100, color: 'linear-gradient(90deg,#7c3aed,#a78bfa)', note: 'Todos los archivos creados e integrados', tag: 'done' },
        { label: 'Sprint 1 — Pre-launch fixes', pct: 100, color: '#34A853', note: 'Seguridad · Legal · Toast system · Landing · UAT · PostHog', tag: 'done' },
        { label: 'Light Mode + fixes post-Sprint 1', pct: 100, color: '#C7A24C', note: 'Toggle dark/light · logo · botones · modales · mobile', tag: 'done' },
        { label: 'Sprint 2 — Rediseño Visual & UX (39 commits)', pct: 100, color: 'linear-gradient(90deg,#2563eb,#60a5fa)', note: 'Mesa de madera · abanico interactivo · pétalos · mobile responsiveness', tag: 'done' },
        { label: 'Sprint 3 — UX Improvements + Mobile', pct: 100, color: '#10b981', note: 'Flujo simplificado · fecha opcional · sticky CTA · scroll to top · centrado mobile', tag: 'done' },
        { label: 'Sprint 4 — Premium Voice (ElevenLabs)', pct: 100, color: 'linear-gradient(90deg,#b8860b,#ffd700)', note: 'Tier premium 100cr · 4 voces ElevenLabs · UnlockModal multi-step · auto-email', tag: 'done' },
        { label: 'Sprint 5 — UX Batch + WCAG + Bug Fixes', pct: 100, color: 'linear-gradient(90deg,#0ea5e9,#38bdf8)', note: 'T1-T9 UX · OG image · auditoría WCAG AA · testimonios · fix audio astral', tag: 'done' },
      ].map((s, i) => (
        <div key={i} style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, color: '#aaa', fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.pct === 100 ? '#34A853' : '#C7A24C' }}>{s.pct}% ✓</div>
          </div>
          <ProgBar pct={s.pct} color={s.color} />
          <div style={{ fontSize: 11, color: '#555', marginTop: 8 }}>{s.note}</div>
        </div>
      ))}

      <div style={S.sectionTitle}>Estado actual de features</div>
      <div style={S.row2}>
        {[
          'Portal gratuito hasta revelación', 'UnlockModal (Standard 40cr / Full 65cr / Premium 100cr)',
          'InviteWidget (email + WhatsApp + link)', 'Analytics → Supabase mvp_events',
          'Landing page con banderas + selección de voz/tier', 'Auth (email + password + forgot)',
          'T&C + Privacy Policy', 'Cookie consent banner',
          'Toast notifications', 'PostHog (consent-gated)',
          'UAT route (/uat)', 'Light mode + dark mode toggle',
          'Mesa de madera + assets PNG', 'Abanico interactivo drag-to-select',
          'Pétalos púrpura', 'Mobile: fan borde a borde + portrait cover',
          'Flujo simplificado (sin "Permitir")', 'Fecha de nacimiento opcional',
          'Nueva consulta guarda nombre', 'Toggle Truth/Whisper (pill switch)',
          '4 voces ElevenLabs (es/en/pt)', 'Auto-email síntesis para premium',
          'OG image dinámica (/api/og)', 'WCAG AA — todos los pares corregidos',
          'Testimonios en landing (3 por idioma)', 'SVG mute icons (Material Design)',
          'Nombres de carta bajo cartas reveladas (en/pt)', 'Fix audio: narración astral encadenada',
        ].map((f, i) => (
          <div key={i} style={{ ...S.card, padding: '14px 16px' }}><span style={{ color: '#34A853' }}>✓</span> <span style={{ fontSize: 12, color: '#ccc' }}>{f}</span></div>
        ))}
      </div>
    </>
  );
}

function TabPlanMVP() {
  const tasks = [
    ['Supabase — Crear tabla mvp_events', 'Tabla de analytics en Supabase · RLS habilitado'],
    ['Crear api/analytics.js', 'Vercel serverless → inserta en mvp_events'],
    ['Crear src/lib/analytics.js', 'Helper trackEvent() fire-and-forget'],
    ['Reemplazar readingPaid → consultTier', 'Estado null | "standard" | "full" en App.jsx'],
    ['Liberar portal de entrada (sin cobro)', 'handleEnterPortalGated + handleStart simplificados'],
    ['Eliminar handleReConsultation', 'Botón "Nueva consulta" reemplazado por reseteo limpio'],
    ['Crear UnlockModal.jsx', 'Modal centralizado Standard 40cr / Full 70cr'],
    ['Wiring UnlockModal — revelación', 'handleUnlock + trackEvent + audio restringido'],
    ['Wiring UnlockModal — anchoring (síntesis)', 'Unlock-panel reemplazado en fase anchoring'],
    ['Actualizar initDeepening para tier Full', 'Deepening gratis para usuarios Full tier'],
    ['Crear api/send-invite.js', 'Vercel serverless · email invitación via Resend'],
    ['Crear InviteWidget.jsx', 'Email + copy link + WhatsApp share'],
    ['Wiring InviteWidget + analytics puntos clave', 'trackEvent en session_start, unlock, invite, deepening'],
  ];
  return (
    <>
      <div style={S.sectionTitle}>Plan MVP UX — 13 tareas (todas completadas)</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tasks.map(([title, desc], i) => (
          <div key={i} style={{ ...S.card, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(52,168,83,0.2)', border: '1px solid #34A853', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#34A853', flexShrink: 0 }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#ccc' }}>{title}</div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{desc}</div>
            </div>
            <Tag type="done">✓ DONE</Tag>
          </div>
        ))}
      </div>
    </>
  );
}

function TabSprints() {
  return (
    <>
      <div style={S.sectionTitle}>Sprint 1 — Pre-launch fixes (14 Mayo 2026)</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {[
          { icon: '🔒', color: '#ef4444', title: 'Seguridad', tasks: ['Eliminar BPMN (useBPMNGenerator, telemetry, AIPromptPanel)', 'DEBUG panel solo para master user', 'Bloquear /reset-test-account en producción', 'VITE_APP_URL reemplaza URLs hardcodeadas'] },
          { icon: '⚖️', color: '#60a5fa', title: 'Legal & Privacy', tasks: ['/terms y /privacy (9 secciones cada una)', 'Cookie consent banner (essential/all)', 'Links T&C en AuthModal y PurchaseModal'] },
          { icon: '✨', color: '#a78bfa', title: 'UX & Producto', tasks: ['Toast system (reemplaza todos los alert())', 'Landing page (tagline, features, pricing, CTA)', 'Botón "Nueva consulta" en anchoring', 'PostHog analytics (consent-gated)'] },
          { icon: '🏗', color: '#34A853', title: 'Infraestructura', tasks: ['/uat route con KPI dashboard', 'vercel.json SPA rewrites', 'VITE_APP_URL + VITE_POSTHOG_KEY en .env.example'] },
        ].map((s, i) => (
          <div key={i} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', gap: 12, background: `rgba(${s.color === '#ef4444' ? '239,68,68' : s.color === '#60a5fa' ? '96,165,250' : s.color === '#a78bfa' ? '167,139,250' : '52,168,83'},0.05)` }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: `rgba(${s.color === '#ef4444' ? '239,68,68' : s.color === '#60a5fa' ? '96,165,250' : s.color === '#a78bfa' ? '167,139,250' : '52,168,83'},0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{s.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ccc' }}>{s.title}</div>
            </div>
            <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {s.tasks.map((t, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, padding: '5px 0', borderBottom: j < s.tasks.length - 1 ? '1px solid #161616' : 'none' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34A853', flexShrink: 0, marginTop: 4 }} />
                  <span style={{ color: '#bbb' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...S.sectionTitle, marginTop: 28 }}>Sprint 2 — Rediseño Visual & UX (23 Mayo 2026 · 39 commits)</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {[
          { icon: '🃏', color: '#60a5fa', title: 'Abanico de Cartas', tasks: ['Zoom + drag-to-select en abanico', 'Hover-glow, click-to-activate, bandeja exterior', 'Carta activada: solo contorno iluminado', 'Cartas más separadas · card-back con shimmer'] },
          { icon: '🪵', color: '#8b5cf6', title: 'Mesa & Fases', tasks: ['Mesa de madera + assets PNG reales', 'Fase synchrony: overlay de manos', 'Fase revelation: fondo tela violeta', 'Frames temáticos por escena'] },
          { icon: '☀️', color: '#fbbf24', title: 'Light Mode Completo', tasks: ['Modo claro como tema predeterminado', 'Pétalos púrpura reemplazan vórtex', 'Paleta mesa_claro.png aplicada', '+6 fixes contraste/colores light mode'] },
          { icon: '📱', color: '#34A853', title: 'Mobile', tasks: ['Fan borde a borde en móvil', 'Revelación: carta única en móvil', 'Zoom inicial ajustado', 'Fix solapamiento talismán/título'] },
        ].map((s, i) => (
          <div key={i} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{s.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ccc' }}>{s.title}</div>
            </div>
            <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {s.tasks.map((t, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, padding: '5px 0', borderBottom: j < s.tasks.length - 1 ? '1px solid #161616' : 'none' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34A853', flexShrink: 0, marginTop: 4 }} />
                  <span style={{ color: '#bbb' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...S.sectionTitle, marginTop: 28 }}>Sprint 3 — UX Improvements & Mobile Polish (23 Mayo 2026)</div>
      <div style={S.cardGreen}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {['Nueva consulta guarda nombre + fecha en localStorage', 'Flujo simplificado: sin paso "Permitir"', 'Fecha de nacimiento opcional (skip)', 'Omisión paso "Ir a las cartas"', 'Fix scroll en páginas legales', 'Sticky CTA en selección de cartas (móvil)', 'Scroll to top tras cada revelación', 'Texto centrado correctamente en móvil'].map((f, i) => (
            <div key={i} style={{ fontSize: 12, color: '#bbb' }}><span style={{ color: '#34A853' }}>✓</span> {f}</div>
          ))}
        </div>
      </div>

      <div style={{ ...S.sectionTitle, marginTop: 28 }}>Sprint 4 — Premium Voice con ElevenLabs (23–24 Mayo 2026)</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {[
          { icon: '🎙️', color: '#ffd700', title: 'ElevenLabs TTS', tasks: ['api/tts.js — 4 voces por idioma (Eric, Zoltar, Jane, Lly)', 'speakPremium() en speech.js con fallback Web Speech', 'Variables de entorno en Vercel (ELEVENLABS_API_KEY)', 'narrate() helper despacha premium vs. estándar'] },
          { icon: '💎', color: '#a78bfa', title: 'Tier Premium 100cr', tasks: ['credits.js: premium_ritual: 100', 'UnlockModal: selección tier → selección de voz (2 pasos)', 'handleUnlock wired para premium en App.jsx', 'Deepening gratuito para usuarios premium'] },
          { icon: '📧', color: '#34A853', title: 'Auto-email + UX', tasks: ['Auto-email síntesis al completar lectura premium', 'skipCreditDeduction en api/send-synthesis.js', '8 nuevas translation keys en es/en/pt', 'Voces evocativas: "Eco del cosmos", "Susurro sanador"...'] },
        ].map((s, i) => (
          <div key={i} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{s.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ccc' }}>{s.title}</div>
            </div>
            <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {s.tasks.map((t, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, padding: '5px 0', borderBottom: j < s.tasks.length - 1 ? '1px solid #161616' : 'none' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34A853', flexShrink: 0, marginTop: 4 }} />
                  <span style={{ color: '#bbb' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...S.sectionTitle, marginTop: 28 }}>Sprint 5 — UX Batch + WCAG + Bug Fixes (26 Mayo 2026)</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {[
          { icon: '🎨', color: '#0ea5e9', title: 'UX Batch (T1–T9)', tasks: ['Abanico: texto subtítulo más visible', 'brain-bubble: esquinas redondeadas (18px) + blur', 'Mesa: background-size contain (sin clipping)', 'Nombres de carta bajo revelación (en/pt)', 'Toggle Truth/Whisper como pill switch', 'Landing: banderas + selección tier/voz pre-entrada', 'Testimonios (3 por idioma, scroll horizontal)'] },
          { icon: '🌐', color: '#c4b5fd', title: 'OG Image + Meta', tasks: ['api/og.jsx — Edge runtime con @vercel/og/Satori', 'Diseño: fondo cósmico · orbe 🔮 · ZOLTAR dorado', 'index.html: og:image y twitter:image apuntan a /api/og', 'Mesa portrait: @media (orientation:portrait) → cover', 'SVG mute icons (Material Design, reemplaza emojis)'] },
          { icon: '♿', color: '#f472b6', title: 'WCAG AA + Bug Fixes', tasks: ['App.css: 6 rgba-white-0.4 → 0.62 (3.26→5.72:1)', 'LandingScreen: 10+ tokens corregidos', 'UnlockModal: 6 tokens corregidos', 'Botón premium: texto blanco→#2d1a00 sobre ámbar', 'Fix: 3er testimonio cortado en desktop (flex-wrap)', 'Fix: narración astral encadenada (no corta waitMsg)'] },
        ].map((s, i) => (
          <div key={i} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{s.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ccc' }}>{s.title}</div>
            </div>
            <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {s.tasks.map((t, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, padding: '5px 0', borderBottom: j < s.tasks.length - 1 ? '1px solid #161616' : 'none' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34A853', flexShrink: 0, marginTop: 4 }} />
                  <span style={{ color: '#bbb' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── TAB COSTOS (NUEVO) ─────────────────────────────────────── */
function TabCostos() {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: 'rgba(52,168,83,0.06)', border: '1px solid rgba(52,168,83,0.2)', borderRadius: 10, marginBottom: 24 }}>
        <div style={{ fontSize: 24 }}>💡</div>
        <div>
          <div style={{ fontSize: 11, color: '#34A853', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Ventaja clave</div>
          <div style={{ fontSize: 13, color: '#ddd', marginTop: 3 }}>Margen bruto del 90%+ · Infraestructura casi gratis hasta 50k usuarios · El único costo variable real es Gemini API</div>
        </div>
      </div>

      {/* Inversión inicial */}
      <div style={S.sectionTitle}>Inversión inicial (one-time)</div>
      <div style={S.cardPurple}>
        <Table
          headers={['Ítem', 'Tipo', 'Costo estimado', 'Notas']}
          rows={[
            ['Desarrollo Sprints 1–3 (tiempo propio)', '<span style="background:rgba(52,168,83,0.15);color:#34A853;padding:1px 6px;border-radius:8px;font-size:10px;font-weight:700">TIEMPO</span>', '<span style="color:#4ade80">$0</span>', '~60h invertidas hasta hoy'],
            ['Dominio propio (ej. zoltar.app)', '<span style="background:rgba(96,165,250,0.15);color:#60a5fa;padding:1px 6px;border-radius:8px;font-size:10px;font-weight:700">INFRA</span>', '$12–20 USD/año', 'Mejora credibilidad · Necesario para lanzamiento'],
            ['Micro-influencer espiritual/tarot (1 inicial)', '<span style="background:rgba(167,139,250,0.15);color:#a78bfa;padding:1px 6px;border-radius:8px;font-size:10px;font-weight:700">MKT</span>', '$0–100 USD', 'Canje (créditos gratis) o pago mínimo'],
            ['Reserva campañas Meta Ads / TikTok Ads', '<span style="background:rgba(167,139,250,0.15);color:#a78bfa;padding:1px 6px;border-radius:8px;font-size:10px;font-weight:700">MKT</span>', '$0–100 USD', 'Solo si orgánico no despega en 2 semanas'],
            ['Producción de contenido TikTok/Reels (kit inicial)', '<span style="background:rgba(167,139,250,0.15);color:#a78bfa;padding:1px 6px;border-radius:8px;font-size:10px;font-weight:700">MKT</span>', '$0', '5 videos formato viral · producción propia'],
          ]}
          totalRow={['Total inversión inicial', '', '<strong style="color:#fbbf24">$12–220 USD</strong>', 'Dentro del presupuesto objetivo de $200']}
        />
      </div>

      {/* Costos operativos mes 1-2 */}
      <div style={S.sectionTitle}>Costos operativos mensuales — Fase de Validación (Mes 1–2)</div>
      <div style={S.cardGreen}>
        <Table
          headers={['Servicio', 'Plan', 'Costo/mes', 'Límite incluido', 'Cuándo escala']}
          rows={[
            ['Vercel', 'Hobby (gratis)', '<span style="color:#4ade80">$0</span>', '100GB bandwidth · serverless ilimitado', 'Pro $20/mes al superar 100GB'],
            ['Supabase', 'Free tier', '<span style="color:#4ade80">$0</span>', '500MB DB · 50k MAU · 5GB storage', 'Pro $25/mes al superar 50k MAU'],
            ['Gemini API (Pollinations)', 'Pay-per-use', '<span style="color:#fb923c">$5–30</span>', 'Sin límite (cobro por token)', '~$0.002–0.008 por consulta completa'],
            ['Stripe', 'Pay-per-use', '<span style="color:#fb923c">2.9% + $0.30</span>', 'Sin mensualidad', 'Solo cobra por transacción exitosa'],
            ['Resend (email)', 'Free tier', '<span style="color:#4ade80">$0</span>', '3.000 emails/mes', 'Pro $20/mes al superar 3k emails'],
            ['PostHog', 'Free tier', '<span style="color:#4ade80">$0</span>', '1M eventos/mes', 'Escala a partir de 1M eventos'],
          ]}
          totalRow={['Total infraestructura mes 1–2', '', '<strong style="color:#fbbf24">$5–30 USD/mes</strong>', 'Variable según uso de IA', '']}
        />
      </div>

      {/* Costos de marketing */}
      <div style={S.sectionTitle}>Presupuesto de marketing por fase</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { fase: 'Fase 0 · Validación MVP', periodo: 'Semanas 1–2', color: '#fb923c', mkt: '$0', total: '$5–30', items: ['Comunidad propia (3 posts/plataforma)', 'TikTok orgánico (5 videos formato viral)', 'Grupo WhatsApp / Telegram propio'] },
          { fase: 'Fase 1 · Lanzamiento Orgánico', periodo: 'Mes 1–2', color: '#a78bfa', mkt: '$0–100', total: '$5–130', items: ['1 micro-influencer (canje o $50–100)', 'Story + link en RRSS propias', 'Participación en grupos espirituales'] },
          { fase: 'Fase 2 · Amplificación', periodo: 'Mes 2–4', color: '#60a5fa', mkt: '$100–300', total: '$160–360', items: ['Meta Ads $5/día (retargeting visitantes)', '2 micro-influencers mensuales', 'Contenido orgánico continuo'] },
          { fase: 'Fase 3 · Crecimiento', periodo: 'Mes 5–9', color: '#34A853', mkt: '$300–1.000', total: '$400–1.200', items: ['Meta/TikTok Ads escalados', 'SEO + blog espiritual', 'Programa de afiliados activo'] },
        ].map((f, i) => (
          <div key={i} style={{ background: '#111', border: `1px solid ${f.color}33`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: f.color, textTransform: 'uppercase', letterSpacing: 1 }}>{f.fase}</div>
            <div style={{ fontSize: 10, color: '#555', marginBottom: 10 }}>{f.periodo}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: f.color }}>{f.mkt}</div>
                <div style={{ fontSize: 9, color: '#555', textTransform: 'uppercase' }}>Marketing</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fbbf24' }}>{f.total}</div>
                <div style={{ fontSize: 9, color: '#555', textTransform: 'uppercase' }}>Total/mes</div>
              </div>
            </div>
            {f.items.map((item, j) => <div key={j} style={{ fontSize: 11, color: '#888', display: 'flex', gap: 6, marginBottom: 3 }}><span style={{ color: f.color }}>·</span>{item}</div>)}
          </div>
        ))}
      </div>

      {/* Costos escalados */}
      <div style={S.sectionTitle}>Costos de infraestructura escalados (Mes 6+)</div>
      <div style={S.cardGold}>
        <Table
          headers={['Servicio', 'Plan escala', 'Costo/mes', 'Disparador']}
          rows={[
            ['Vercel Pro', 'Pro', '$20', '>100GB bandwidth / mes'],
            ['Supabase Pro', 'Pro', '$25', '>50k MAU'],
            ['Gemini API (Pollinations)', 'Pay-per-use', '$50–200', '>5.000 consultas/mes'],
            ['Resend Pro', 'Pro', '$20', '>3.000 emails/mes'],
            ['Meta/TikTok Ads', 'Escalado', '$500–2.000', 'ROAS > 2x validado'],
            ['2–3 micro-influencers', 'Mensual', '$200–500', 'Tracción validada mes 3'],
          ]}
          totalRow={['Total estimado mes 6–9', '', '<strong style="color:#fbbf24">$815–2.765 USD/mes</strong>', '']}
        />
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>⚠️ En este punto los ingresos deberían cubrir ampliamente los costos (proyección: $2.000–8.000/mes de ingreso bruto)</div>
      </div>

      {/* Métricas clave */}
      <div style={S.sectionTitle}>Métricas de costo por consulta</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { val: '~$0.005', label: 'Costo/consulta Gemini' },
          { val: '~$3.50', label: 'Margen neto (pack $4.99)' },
          { val: '~$6.20', label: 'Margen neto (pack $9.99)' },
          { val: '90%+', label: 'Margen bruto producto' },
          { val: '$200', label: 'Break-even mes 1' },
          { val: '$0.30', label: 'Fee fijo Stripe/transacción' },
        ].map((m, i) => (
          <div key={i} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fbbf24' }}>{m.val}</div>
            <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>{m.label}</div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── TAB ESTRATEGIA (NUEVO) ─────────────────────────────────── */
function TabEstrategia() {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 10, marginBottom: 24 }}>
        <div style={{ fontSize: 24 }}>🎯</div>
        <div>
          <div style={{ fontSize: 11, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Principio rector</div>
          <div style={{ fontSize: 13, color: '#ddd', marginTop: 3 }}>Validar primero, escalar después · No gastar en marketing hasta confirmar que el producto convierte · El producto YA está listo para validación</div>
        </div>
      </div>

      {/* Fase 0: Validación MVP */}
      <div style={S.sectionTitle}>Fase 0 — Validación MVP (Semanas 1–2) · AHORA</div>
      <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f87171' }}>🔴 Fase 0 · Validación de supuestos</div>
          <span style={{ ...S.tag('rgba(239,68,68,0.15)', '#f87171'), fontSize: 11, padding: '3px 10px' }}>ACCIÓN INMEDIATA</span>
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16, lineHeight: 1.7 }}>
          Antes de invertir en marketing, necesitamos confirmar 3 supuestos críticos con tráfico real:
          <br />① El flujo de onboarding retiene usuarios &nbsp; ② Alguien está dispuesto a pagar &nbsp; ③ El ticket promedio real
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Canal', val: 'Comunidad propia + RRSS existentes' },
            { label: 'Budget', val: '$0 USD' },
            { label: 'Meta usuarios', val: '200 sesiones únicas' },
            { label: 'Meta conversión', val: '≥ 3% freemium → pago (6+ pagadores)' },
            { label: 'Duración', val: '14 días como máximo' },
            { label: 'Resultado esperado', val: 'Datos reales para validar o pivotear' },
          ].map((m, i) => (
            <div key={i} style={{ background: '#0a0a0a', border: '1px solid #1f2937', borderRadius: 6, padding: '8px 12px' }}>
              <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</div>
              <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600, marginTop: 2 }}>{m.val}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, background: '#0a0a0a', border: '1px solid #1f2937', borderRadius: 8, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Criterios de éxito para avanzar a Fase 1</div>
          {[
            ['Conversión freemium → pago', '> 3% de usuarios únicos'],
            ['Completación del flujo', '> 60% llegan al anclaje'],
            ['Retención D7', '> 15% de usuarios registrados vuelven'],
            ['Viral K-factor', '> 0.3 (1 de cada 3 comparte)'],
            ['Ingresos mínimos', '> $200 USD en el primer mes'],
          ].map(([k, v], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < 4 ? '1px solid #1a1a1a' : 'none', fontSize: 12 }}>
              <span style={{ color: '#9ca3af' }}>{k}</span>
              <span style={{ color: '#fbbf24', fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fase 1: Lanzamiento orgánico */}
      <div style={S.sectionTitle}>Fase 1 — Lanzamiento Orgánico (Mes 1–2)</div>
      <div style={S.cardPurple}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa', marginBottom: 12 }}>🟣 Canal orgánico · $0 de inversión · Máxima eficiencia</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Comunidad propia</div>
            {['3 posts por plataforma (Instagram, Facebook, LinkedIn)', 'Story con link directo a cosmic-guidance.com', 'Grupo WhatsApp / Telegram: compartir experiencia personal', 'Emails a contactos cercanos del mundo espiritual'].map((t, i) => (
              <div key={i} style={{ fontSize: 12, color: '#bbb', display: 'flex', gap: 8, marginBottom: 6 }}><span style={{ color: '#a78bfa' }}>·</span>{t}</div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>TikTok / Reels (alto potencial viral)</div>
            {['"Hice una lectura de vidas pasadas con IA y esto pasó"', '"El oráculo digital predijo exactamente mi situación"', '"Qué cartas salieron en mi lectura de tarot con IA"', '"Diferencias entre una lectora real y Zoltar"', '"Mi experiencia con un oráculo espiritual de IA"'].map((t, i) => (
              <div key={i} style={{ fontSize: 12, color: '#bbb', display: 'flex', gap: 8, marginBottom: 6 }}><span style={{ color: '#a78bfa' }}>{i + 1}.</span>{t}</div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 800, color: '#a78bfa' }}>500</div><div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase' }}>usuarios/mes objetivo</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 800, color: '#fbbf24' }}>$0</div><div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase' }}>inversión</div></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 800, color: '#34A853' }}>$150–600</div><div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase' }}>ingreso objetivo/mes</div></div>
        </div>
      </div>

      {/* Fase 2: Amplificación */}
      <div style={S.sectionTitle}>Fase 2 — Amplificación (Mes 2–4) · Condicionada a validación</div>
      <div style={S.cardBlue}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#60a5fa', marginBottom: 12 }}>🔵 Micro-influencers + Ads básico · $100–300/mes</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Micro-influencers (10k–50k seguidores)</div>
            {['Nicho: tarot, espiritualidad, astrología, mindfulness', 'Oferta inicial: canje (100 créditos = 2 consultas completas)', 'Pago máximo: $50–100 USD por colaboración', '1–2 influencers por mes en fase de prueba', 'KPI: tráfico atribuido + conversiones por cupón'].map((t, i) => (
              <div key={i} style={{ fontSize: 12, color: '#bbb', display: 'flex', gap: 8, marginBottom: 6 }}><span style={{ color: '#60a5fa' }}>·</span>{t}</div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Meta Ads (solo si orgánico no escala)</div>
            {['Budget de prueba: $5/día por 20 días = $100 total', 'Audiencia: interesados en tarot, astrología, espiritualidad', 'Formato: video corto (15s) con revelación mística', 'Objetivo de campaña: tráfico → conversión (registro)', 'ROAS mínimo para escalar: 2x ($2 ingreso por $1 invertido)'].map((t, i) => (
              <div key={i} style={{ fontSize: 12, color: '#bbb', display: 'flex', gap: 8, marginBottom: 6 }}><span style={{ color: '#60a5fa' }}>·</span>{t}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Fase 3: Crecimiento sistémico */}
      <div style={S.sectionTitle}>Fase 3 — Crecimiento Sistémico (Mes 5+) · Solo con tracción validada</div>
      <div style={S.cardGreen}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#34A853', marginBottom: 12 }}>🟢 Motor escalable · referidos + ads + SEO + B2B</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[
            { title: 'Referidos como motor viral', color: '#34A853', items: ['Referidor: +50cr por registro', 'Nuevo usuario: +25cr extra', 'Widget de referidos en anchoring', 'Badge "Embajador Zoltar"'] },
            { title: 'SEO + Blog espiritual', color: '#4ade80', items: ['Blog sobre tarot, astrología, vidas pasadas', '5 artículos SEO/mes', 'Keywords: "oráculo IA", "tarot digital"', 'Tráfico orgánico gratuito a largo plazo'] },
            { title: 'B2B · Lectoras de cartas', color: '#86efac', items: ['White-label para consultas profesionales', 'Precio: $29–49/mes por cuenta profesional', 'Acceso a mayor variedad de spreads', '50 lectoras = $1.500–2.500/mes recurrente'] },
          ].map((c, i) => (
            <div key={i} style={{ background: '#0a0a0a', border: `1px solid ${c.color}33`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: c.color, marginBottom: 8 }}>{c.title}</div>
              {c.items.map((item, j) => <div key={j} style={{ fontSize: 11, color: '#888', display: 'flex', gap: 6, marginBottom: 4 }}><span style={{ color: c.color }}>·</span>{item}</div>)}
            </div>
          ))}
        </div>
      </div>

      {/* Funnel de conversión */}
      <div style={S.sectionTitle}>Funnel de conversión actual</div>
      <div style={S.card}>
        {[
          { etapa: 'Visitante', desc: 'Landing page · elige idioma · entra al portal', pct: 100, color: '#6366f1' },
          { etapa: 'Iniciado', desc: 'Pasa threshold (nombre, fecha, motivo) · selecciona cartas', pct: 70, color: '#8b5cf6' },
          { etapa: 'Revelación', desc: 'Ve al menos 1 carta revelada (preview)', pct: 60, color: '#a78bfa' },
          { etapa: 'UnlockModal', desc: 'Ve el modal de desbloqueo (blur en carta 2+)', pct: 45, color: '#fbbf24' },
          { etapa: 'Pago (conversion)', desc: 'Compra Standard 40cr o Full 70cr', pct: '3–5%', color: '#fb923c' },
          { etapa: 'Recurrente', desc: 'Vuelve y hace nueva consulta (retención D7)', pct: '15%+', color: '#34A853' },
        ].map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < 5 ? '1px solid #1a1a1a' : 'none' }}>
            <div style={{ width: 80, fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{f.etapa}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>{f.desc}</div>
              <div style={{ height: 6, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: typeof f.pct === 'number' ? `${f.pct}%` : '5%', background: f.color, borderRadius: 3 }} />
              </div>
            </div>
            <div style={{ width: 50, textAlign: 'right', fontSize: 12, fontWeight: 700, color: f.color }}>{f.pct}{typeof f.pct === 'number' && f.pct > 20 ? '%' : ''}</div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── TAB PROYECCIÓN (NUEVO) ─────────────────────────────────── */
function TabProyeccion() {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, marginBottom: 24 }}>
        <div style={{ fontSize: 24 }}>📈</div>
        <div>
          <div style={{ fontSize: 11, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Nota metodológica</div>
          <div style={{ fontSize: 13, color: '#ddd', marginTop: 3 }}>Proyecciones basadas en benchmarks de productos freemium espirituales similares · Se actualizarán con datos reales al cerrar el mes 1</div>
        </div>
      </div>

      {/* Escenarios */}
      <div style={S.sectionTitle}>Proyección financiera — Corto plazo (Mes 1–3) · Validación</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Conservador', color: '#6b7280', usuarios: '100–200', conv: '2–3%', pagadores: '2–6', ticket: '$6', bruto: '$12–36', costo: '$5–15', neto: '$7–21' },
          { label: 'Base ⭐', color: '#a78bfa', starred: true, usuarios: '200–500', conv: '3–5%', pagadores: '6–25', ticket: '$7', bruto: '$42–175', costo: '$15–35', neto: '$27–140' },
          { label: 'Optimista', color: '#34A853', usuarios: '500–1.000', conv: '5–8%', pagadores: '25–80', ticket: '$9', bruto: '$225–720', costo: '$30–60', neto: '$195–660' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.starred ? 'linear-gradient(135deg,#1a1a2e,#0f0f0f)' : '#111', border: `1px solid ${s.color}44`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: s.color, marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 10, color: '#555', marginBottom: 12 }}>Mes 1–3 · Validación</div>
            {[
              ['Usuarios únicos/mes', s.usuarios],
              ['Conversión freemium', s.conv],
              ['Pagadores/mes', s.pagadores],
              ['Ticket promedio', s.ticket],
              ['Ingreso bruto/mes', s.bruto],
              ['Costo infraestructura', s.costo],
              ['Ingreso neto/mes', s.neto],
            ].map(([k, v], j) => (
              <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: j < 6 ? '1px solid #1a1a1a' : 'none', fontSize: 11 }}>
                <span style={{ color: '#6b7280' }}>{k}</span>
                <span style={{ color: j === 6 ? '#4ade80' : '#e2e8f0', fontWeight: j === 6 ? 700 : 400 }}>{v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={S.sectionTitle}>Proyección financiera — Mediano plazo (Mes 4–9) · Crecimiento</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Conservador', color: '#6b7280', usuarios: '500–1.000', conv: '4–5%', pagadores: '20–50', ticket: '$8', bruto: '$160–400', costo: '$40–80', neto: '$120–320' },
          { label: 'Base ⭐', color: '#a78bfa', starred: true, usuarios: '1.000–3.000', conv: '5–8%', pagadores: '50–240', ticket: '$10', bruto: '$500–2.400', costo: '$60–120', neto: '$440–2.280' },
          { label: 'Optimista', color: '#34A853', usuarios: '3.000–6.000', conv: '8–12%', pagadores: '240–720', ticket: '$12', bruto: '$2.880–8.640', costo: '$200–500', neto: '$2.680–8.140' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.starred ? 'linear-gradient(135deg,#1a1a2e,#0f0f0f)' : '#111', border: `1px solid ${s.color}44`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: s.color, marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 10, color: '#555', marginBottom: 12 }}>Mes 4–9 · Con referidos + micro-influencers</div>
            {[
              ['Usuarios únicos/mes', s.usuarios],
              ['Conversión freemium', s.conv],
              ['Pagadores/mes', s.pagadores],
              ['Ticket promedio', s.ticket],
              ['Ingreso bruto/mes', s.bruto],
              ['Costo total (infra+mkt)', s.costo],
              ['Ingreso neto/mes', s.neto],
            ].map(([k, v], j) => (
              <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: j < 6 ? '1px solid #1a1a1a' : 'none', fontSize: 11 }}>
                <span style={{ color: '#6b7280' }}>{k}</span>
                <span style={{ color: j === 6 ? '#4ade80' : '#e2e8f0', fontWeight: j === 6 ? 700 : 400 }}>{v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Curva de crecimiento visual */}
      <div style={S.sectionTitle}>Curva de ingresos proyectados — escenario base</div>
      <div style={S.card}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { mes: 'Mes 1', ingreso: 50, target: 400, color: '#6b7280' },
            { mes: 'Mes 2', ingreso: 120, target: 400, color: '#8b5cf6' },
            { mes: 'Mes 3', ingreso: 250, target: 400, color: '#a78bfa' },
            { mes: 'Mes 4', ingreso: 500, target: 800, color: '#fbbf24' },
            { mes: 'Mes 5', ingreso: 800, target: 1200, color: '#fb923c' },
            { mes: 'Mes 6', ingreso: 1200, target: 2000, color: '#f97316' },
            { mes: 'Mes 7', ingreso: 1800, target: 3000, color: '#ea580c' },
            { mes: 'Mes 8', ingreso: 2500, target: 4000, color: '#34A853' },
            { mes: 'Mes 9', ingreso: 3200, target: 6000, color: '#22c55e' },
          ].map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 44, fontSize: 10, color: '#555', textAlign: 'right', flexShrink: 0 }}>{m.mes}</div>
              <div style={{ flex: 1, height: 18, background: '#1a1a1a', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', height: '100%', width: `${(m.ingreso / 6000) * 100}%`, background: m.color, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6 }}>
                  <span style={{ fontSize: 9, color: '#000', fontWeight: 700, whiteSpace: 'nowrap' }}>${m.ingreso.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
          <div style={{ fontSize: 10, color: '#444', marginTop: 4, textAlign: 'right' }}>USD / mes · escenario base · sin suscripción activa</div>
        </div>
      </div>

      {/* Fuentes de ingreso futuras */}
      <div style={S.sectionTitle}>Mix de ingresos proyectado (Mes 9)</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {[
          { fuente: 'Packs de créditos one-time', pct: '55%', color: '#a78bfa', val: '$1.760', desc: 'Iniciado $4.99 · Explorador $9.99 · Oráculo $19.99' },
          { fuente: 'Suscripción mensual ($9.99)', pct: '30%', color: '#60a5fa', val: '$960', desc: 'Activar en mes 4 · 500cr/mes · motor de recurrencia' },
          { fuente: 'Gift cards & packs regalo', pct: '10%', color: '#34A853', val: '$320', desc: 'Fechas especiales · cumpleaños · San Valentín' },
          { fuente: 'B2B (lectoras de cartas)', pct: '5%', color: '#fbbf24', val: '$160', desc: 'White-label · $29/mes por cuenta profesional' },
        ].map((f, i) => (
          <div key={i} style={{ background: '#111', border: `1px solid ${f.color}33`, borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: f.color }}>{f.pct}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fbbf24' }}>{f.val}</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#ccc', marginBottom: 4 }}>{f.fuente}</div>
            <div style={{ fontSize: 10, color: '#555', lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* KPIs de tracción */}
      <div style={S.sectionTitle}>KPIs de tracción a monitorear (semana a semana)</div>
      <div style={S.cardGold}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            ['Sesiones únicas / semana', 'UAT → PostHog · Dashboard /uat'],
            ['Conversión freemium → pago (%)', 'pagadores / sesiones totales'],
            ['Ticket promedio ($)', 'ingreso bruto / nº pagadores'],
            ['Completación del flujo (%)', '% que llegan a fase anchoring'],
            ['K-factor viral', 'registros por referido / total registros'],
            ['Retención D7 (%)', '% que vuelven en 7 días · vía analytics'],
            ['CAC (costo adq. cliente)', 'gasto marketing / nuevos pagadores'],
            ['LTV estimado', 'ticket promedio × compras por usuario'],
          ].map(([k, v], i) => (
            <div key={i} style={{ background: '#0a0a0a', border: '1px solid #1f2937', borderRadius: 6, padding: '8px 12px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0' }}>{k}</div>
              <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function TabPendiente() {
  return (
    <>
      <div style={S.sectionTitle}>Issues conocidos / deuda técnica</div>
      {[
        { icon: '⚠️', style: S.cardGold, titleColor: '#C7A24C', title: 'Stripe live — compra de créditos', desc: 'El flujo de recarga vía Stripe está implementado pero necesita verificación en producción con claves live. Webhook de Stripe pendiente de configurar.' },
        { icon: '⚠️', style: S.cardGold, titleColor: '#C7A24C', title: 'Verificación end-to-end Premium', desc: 'Confirmar flujo completo: landing → selección premium → ElevenLabs audio → revelación → auto-email síntesis. Probar los 4 perfiles de voz.' },
        { icon: '📋', style: S.card, titleColor: '#ccc', title: 'OG image en social media', desc: 'Verificar que https://www.cosmic-guidance.com/api/og genera correctamente en opengraph.xyz y que Twitter/LinkedIn la muestran.' },
        { icon: '📋', style: S.card, titleColor: '#ccc', title: 'Dominio principal definitivo', desc: 'cosmic-guidance.com está operativo. Confirmar que zoltar-two.vercel.app redirige correctamente y que el dominio está como producción en Vercel.' },
      ].map((i, idx) => (
        <div key={idx} style={{ ...i.style, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 18, flexShrink: 0 }}>{i.icon}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: i.titleColor }}>{i.title}</div>
            <div style={{ fontSize: 12, color: '#777', marginTop: 4 }}>{i.desc}</div>
          </div>
        </div>
      ))}

      <div style={{ ...S.sectionTitle, marginTop: 24 }}>Candidatos Sprint 6 (post-lanzamiento)</div>
      <div style={S.row2}>
        {['🛒 Stripe live (compra créditos)', '📧 Email de bienvenida al registrarse', '📊 Dashboard KPIs para usuario', '🔔 Notificaciones push', '📱 Tarjeta compartible de resultado', '💳 Suscripción mensual $9.99', '🔗 Programa de afiliados', '🌍 SEO + blog espiritual'].map((t, i) => (
          <div key={i} style={{ ...S.card, padding: '12px 14px', fontSize: 12, color: '#888' }}>{t}</div>
        ))}
      </div>
    </>
  );
}

function TabStack() {
  return (
    <>
      <div style={S.sectionTitle}>Tech Stack</div>
      <div style={S.row2}>
        {[
          ['Frontend', 'React + Vite'],
          ['Deploy', 'Vercel — cosmic-guidance.com'],
          ['Auth + DB', 'Supabase'],
          ['Pagos', 'Stripe (pendiente live)'],
          ['Email', 'Resend + dominio cosmic-guidance.com'],
          ['Analytics', 'PostHog + Supabase mvp_events'],
          ['IA texto', 'Pollinations.ai (Gemini/OpenAI vía proxy)'],
          ['IA voz', 'ElevenLabs (4 voces · eleven_multilingual_v2)'],
          ['TTS fallback', 'Web Speech API (nativo del navegador)'],
          ['OG image', '@vercel/og · Edge runtime · Satori'],
          ['Créditos', 'Iniciado $4.99 · Explorador $9.99 · Oráculo $19.99'],
          ['Tiers lectura', 'Estándar 40cr · Full 65cr · Premium 100cr'],
        ].map(([label, val], i) => (
          <div key={i} style={{ ...S.card, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
            <div style={{ fontSize: 13, color: '#ccc', fontWeight: 600, marginTop: 4 }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={S.sectionTitle}>URLs clave</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          ['Producción (principal)', 'cosmic-guidance.com'],
          ['Deploy alternativo', 'zoltar-two.vercel.app'],
          ['OG Image', 'cosmic-guidance.com/api/og'],
          ['UAT Dashboard', 'cosmic-guidance.com/uat'],
          ['Plan de negocio', 'cosmic-guidance.com/plan'],
          ['Términos', 'cosmic-guidance.com/terms'],
          ['Privacidad', 'cosmic-guidance.com/privacy'],
        ].map(([label, url], i) => (
          <div key={i} style={{ ...S.card, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#777' }}>{label}</span>
            <span style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600 }}>{url}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/* MAIN COMPONENT                                                 */
/* ══════════════════════════════════════════════════════════════ */
const TABS = [
  { id: 'resumen',    label: '⚡ Resumen' },
  { id: 'plan',       label: '📋 Plan MVP' },
  { id: 'sprints',    label: '🏃 Sprints' },
  { id: 'costos',     label: '💰 Costos' },
  { id: 'estrategia', label: '🎯 Estrategia' },
  { id: 'proyeccion', label: '📈 Proyección' },
  { id: 'pendiente',  label: '🔴 Pendiente' },
  { id: 'stack',      label: '🔧 Stack' },
];

const CONTENT = {
  resumen:    <TabResumen />,
  plan:       <TabPlanMVP />,
  sprints:    <TabSprints />,
  costos:     <TabCostos />,
  estrategia: <TabEstrategia />,
  proyeccion: <TabProyeccion />,
  pendiente:  <TabPendiente />,
  stack:      <TabStack />,
};

export default function PlanPage() {
  const [authed, setAuthed] = useState(sessionStorage.getItem(SESSION_KEY) === '1');
  const [activeTab, setActiveTab] = useState('resumen');

  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    const root = document.getElementById('root');
    if (root) { root.style.height = 'auto'; root.style.overflowY = 'auto'; }
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
      if (root) { root.style.height = ''; root.style.overflowY = ''; }
    };
  }, []);

  if (!authed) return <PlanGate onAuth={() => setAuthed(true)} />;

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#080808', color: '#e8e8e8', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: '#0d0d0d', borderBottom: '1px solid #1a1a1a', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ color: '#ffd700', textDecoration: 'none', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em' }}>← ZOLTAR</a>
          <span style={{ color: '#374151', fontSize: 13 }}>/</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Plan de Negocio</div>
            <div style={{ fontSize: 10, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginTop: 1 }}>Estado del Proyecto · Mayo 2026</div>
          </div>
        </div>
        <div style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 20, padding: '8px 18px', fontSize: 12, color: '#a78bfa', fontWeight: 700, letterSpacing: 1 }}>⚡ Pre-Launch</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a1a', padding: '0 32px', background: '#0d0d0d', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '14px 18px', fontSize: 12, fontWeight: 600, color: activeTab === t.id ? '#a78bfa' : '#555', cursor: 'pointer', borderBottom: activeTab === t.id ? '2px solid #a78bfa' : '2px solid transparent', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: 1, transition: 'all 0.2s', background: 'none', border: 'none', borderBottom: activeTab === t.id ? '2px solid #a78bfa' : '2px solid transparent', fontFamily: 'inherit' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
        {CONTENT[activeTab]}
      </div>
    </div>
  );
}
