const STORAGE_KEY = 'zoltar_uat_events';
const SESSION_KEY = 'zoltar_uat_session_start';

export function uatTrack(event, data = {}) {
  const store = readStore();
  store.push({ event, data, ts: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearStore() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function initSession() {
  if (!localStorage.getItem(SESSION_KEY)) {
    localStorage.setItem(SESSION_KEY, new Date().toISOString());
  }
}

export function getSessionStart() {
  return localStorage.getItem(SESSION_KEY);
}

export function deriveKPIs(events) {
  const count = (name) => events.filter((e) => e.event === name).length;

  const sessions = count('session_started');
  const revelations = count('revelation_viewed');
  const unlocks = count('reading_unlocked');
  const modalOpens = count('unlock_modal_opened');
  const purchases = events.filter((e) => e.event === 'purchase_completed');

  const revenue = purchases.reduce((sum, e) => sum + (e.data?.amount_cents ?? 0), 0) / 100;

  const langCounts = {};
  events
    .filter((e) => e.event === 'session_started')
    .forEach((e) => {
      const lang = e.data?.language ?? 'unknown';
      langCounts[lang] = (langCounts[lang] ?? 0) + 1;
    });

  return {
    sessions,
    revelations,
    completionRate: sessions ? Math.round((revelations / sessions) * 100) : 0,
    modalOpens,
    unlocks,
    unlockRate: revelations ? Math.round((unlocks / revelations) * 100) : 0,
    purchaseCount: purchases.length,
    conversionRate: modalOpens ? Math.round((purchases.length / modalOpens) * 100) : 0,
    revenue,
    langBreakdown: langCounts,
  };
}
