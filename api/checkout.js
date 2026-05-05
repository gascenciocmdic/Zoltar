/**
 * /api/checkout  — Crea una sesión de Stripe Checkout
 *
 * POST { packageId: 'iniciado'|'explorador'|'oraculo' }
 * Headers: Authorization: Bearer <supabase_jwt>
 *
 * Retorna: { url: string }
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const PACKAGES = {
  iniciado:   { credits: 150,  price_cents: 499,  name: 'Zoltar Iniciado — 150 créditos' },
  explorador: { credits: 400,  price_cents: 999,  name: 'Zoltar Explorador — 400 créditos' },
  oraculo:    { credits: 1100, price_cents: 1999, name: 'Zoltar Oráculo — 1.100 créditos' },
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
    console.error('[checkout] getUser error:', err);
    return null;
  }
}

export default async function handler(req, res) {
  // Outer safety net — guarantees we always return JSON even if inner catch fails
  const safeJson = (status, body) => {
    try { res.status(status).json(body); } catch (_) { /* response already sent */ }
  };

  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return safeJson(405, { error: 'Método no permitido' });

    if (!process.env.STRIPE_SECRET_KEY) {
      return safeJson(503, { error: 'Pagos no configurados. Contacta al administrador.' });
    }

    const user = await getUser(req);
    if (!user) return safeJson(401, { error: 'No autenticado' });

    const { packageId } = req.body || {};
    const pkg = PACKAGES[packageId];
    if (!pkg) return safeJson(400, { error: 'Paquete inválido' });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const appUrl = (process.env.APP_URL || 'https://zoltar-two.vercel.app').replace(/\/$/, '');

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: user.email,
        line_items: [{
          price_data: {
            currency: 'usd',
            unit_amount: pkg.price_cents,
            product_data: {
              name: pkg.name,
              description: `${pkg.credits} créditos para Zoltar`,
            },
          },
          quantity: 1,
        }],
        metadata: {
          user_id:    user.id,
          package_id: packageId,
          credits:    String(pkg.credits),
        },
        success_url: `${appUrl}?payment=success&credits=${pkg.credits}`,
        cancel_url:  `${appUrl}?payment=cancelled`,
      });
    } catch (stripeErr) {
      const msg = stripeErr instanceof Error ? stripeErr.message : String(stripeErr);
      console.error('[checkout] Stripe error:', msg);
      return safeJson(502, { error: `Error Stripe: ${msg}` });
    }

    // Registrar compra pendiente (no-fatal si la tabla no existe)
    try {
      const sb = supabaseAdmin();
      await sb.from('purchases').insert({
        user_id:           user.id,
        stripe_session_id: session.id,
        package_id:        packageId,
        amount_cents:      pkg.price_cents,
        credits:           pkg.credits,
        status:            'pending',
      });
    } catch (_) { /* non-fatal */ }

    return safeJson(200, { url: session.url });

  } catch (fatal) {
    const msg = fatal instanceof Error ? fatal.message : String(fatal);
    console.error('[checkout] Fatal error:', msg);
    safeJson(500, { error: msg });
  }
}
