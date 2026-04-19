/**
 * /api/stripe-webhook  — Webhook de Stripe
 *
 * Stripe llama este endpoint cuando un pago se completa.
 * Acredita los créditos al usuario automáticamente.
 *
 * Configurar en Stripe Dashboard:
 *   Endpoint: https://zoltar-two.vercel.app/api/stripe-webhook
 *   Eventos:  checkout.session.completed
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session  = event.data.object;
    const userId   = session.metadata?.user_id;
    const credits  = parseInt(session.metadata?.credits || '0', 10);
    const packageId = session.metadata?.package_id;

    if (!userId || !credits) {
      return res.status(400).json({ error: 'Metadata incompleta' });
    }

    const sb = supabaseAdmin();

    // Actualizar compra → completed
    await sb.from('purchases')
      .update({ status: 'completed' })
      .eq('stripe_session_id', session.id);

    // Obtener créditos actuales y sumar
    const { data: profile } = await sb
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (!profile) {
      console.error('Perfil no encontrado para userId:', userId);
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    const newCredits = profile.credits + credits;
    await sb.from('profiles').update({ credits: newCredits }).eq('id', userId);

    // Registrar en ledger
    await sb.from('credit_ledger').insert({
      user_id: userId,
      amount:  credits,
      reason:  'purchase',
      meta:    { package_id: packageId, stripe_session_id: session.id },
    });

    console.log(`[Webhook] +${credits} créditos acreditados a ${userId}. Total: ${newCredits}`);
  }

  return res.status(200).json({ received: true });
}
