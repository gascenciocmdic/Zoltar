/**
 * /api/paddle-checkout
 *
 * POST { packageId: 'iniciado'|'explorador'|'oraculo' }
 * Headers: Authorization: Bearer <supabase_jwt>
 *
 * Valida el usuario y retorna el priceId de Paddle para ese paquete.
 * El frontend usa este priceId para abrir el overlay de Paddle.js.
 * Los price IDs viven en env vars (nunca en el bundle del cliente).
 *
 * Retorna: { priceId, userId, packageId, credits }
 */

import { createClient } from '@supabase/supabase-js';
import { setCors } from './_cors.js';

const PACKAGES = {
  iniciado:   { credits: 150,  priceEnvVar: 'PADDLE_PRICE_ID_INICIADO'   },
  explorador: { credits: 400,  priceEnvVar: 'PADDLE_PRICE_ID_EXPLORADOR'  },
  oraculo:    { credits: 1100, priceEnvVar: 'PADDLE_PRICE_ID_ORACULO'     },
};

function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getUser(req) {
  try {
    const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
    if (!token) return null;
    const sb = supabaseAdmin();
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data) return null;
    return data.user || null;
  } catch (err) {
    console.error('[paddle-checkout] getUser error:', err);
    return null;
  }
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'No autenticado' });

  const { packageId } = req.body || {};
  const pkg = PACKAGES[packageId];
  if (!pkg) return res.status(400).json({ error: 'Paquete inválido' });

  const priceId = process.env[pkg.priceEnvVar];
  if (!priceId) {
    console.error(`[paddle-checkout] Env var ${pkg.priceEnvVar} no configurada`);
    return res.status(503).json({ error: 'Pagos no configurados. Contacta al administrador.' });
  }

  return res.status(200).json({
    priceId,
    userId:    user.id,
    packageId,
    credits:   pkg.credits,
  });
}
