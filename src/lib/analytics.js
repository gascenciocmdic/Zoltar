import posthog from 'posthog-js';
import { uatTrack } from './uatMetrics';
import { getCookieConsent } from '../components/CookieConsent';

const KEY = import.meta.env.VITE_POSTHOG_KEY;
const HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

let initialized = false;

function maybeInit() {
  if (initialized || !KEY) return;
  const consent = getCookieConsent();
  if (consent !== 'all') return;
  posthog.init(KEY, {
    api_host: HOST,
    autocapture: false,
    capture_pageview: false,
    persistence: 'localStorage',
    loaded(ph) {
      if (import.meta.env.DEV) ph.opt_out_capturing();
    },
  });
  initialized = true;
}

export function identifyUser(userId, email) {
  maybeInit();
  if (!initialized) return;
  posthog.identify(userId, { email });
}

const UAT_EVENTS = new Set([
  'session_started',
  'revelation_viewed',
  'reading_unlocked',
  'unlock_modal_opened',
  'purchase_completed',
]);

export async function trackEvent(event, properties = {}, session = null) {
  maybeInit();
  if (initialized) {
    posthog.capture(event, properties);
  }

  if (window.__ZOLTAR_UAT__ && UAT_EVENTS.has(event)) {
    uatTrack(event, properties);
  }

  fetch('/api/analytics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ event, properties }),
  }).catch(() => {});
}
