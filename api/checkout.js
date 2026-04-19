/**
 * /api/checkout  — Crea una sesión de Stripe Checkout
 *
 * POST { packageId: 'iniciado'|'explorador'|'oraculo' }
 * Headers: Authorization: Bearer <supabase_jwt>
 *
 * Retorna: { url: string }  ← redirigir al usuario a esta URL
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
  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!token) return null;
  const sb = supabaseAdmin();
  const { data: { user } } = await sb.auth.getUser(token);
  return user || null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'No autenticado' });

  const { packageId } = req.body || {};
  const pkg = PACKAGES[packageId];
  if (!pkg) return res.status(400).json({ error: 'Paquete inválido' });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

  const appUrl = process.env.APP_URL || 'https://zoltar-two.vercel.app';

  const session = await stripe.checkout.sessions.create({
    mode:          'payment',
    payment_method_types: ['card'],
    customer_email: user.email,
    line_items: [{
      price_data: {
        currency:     'usd',
        unit_amount:  pkg.price_cents,
        product_data: {
          name:        pkg.name,
          description: `${pkg.credits} créditos para el Oráculo de Vidas Pasadas`,
          images:      [`${appUrl}/zoltar-logo.jpg`],
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

  // Registrar compra pendiente
  const sb = supabaseAdmin();
  await sb.from('purchases').insert({
    user_id:           user.id,
    stripe_session_id: session.id,
    package_id:        packageId,
    amount_cents:      pkg.price_cents,
    credits:           pkg.credits,
    status:            'pending',
  });

  return res.status(200).json({ url: session.url });
}
