export async function trackEvent(event, properties = {}, session = null) {
  fetch('/api/analytics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {})
    },
    body: JSON.stringify({ event, properties })
  }).catch(() => {});
}
