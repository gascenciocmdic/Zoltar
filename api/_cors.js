/**
 * Shared CORS helper for all Vercel serverless functions.
 * Only allows requests from known production and preview origins.
 */

const ALLOWED_ORIGINS = [
  'https://cosmic-guidance.com',
  'https://www.cosmic-guidance.com',
  'https://zoltar-two.vercel.app',
];

export function setCors(req, res) {
  const origin = req.headers.origin || '';
  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) ||
    /^https:\/\/zoltar[a-z0-9-]*\.vercel\.app$/.test(origin) ||
    /^http:\/\/localhost(:\d+)?$/.test(origin);

  res.setHeader('Access-Control-Allow-Origin', isAllowed ? origin : ALLOWED_ORIGINS[0]);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');
}
