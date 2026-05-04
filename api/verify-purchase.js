/**
 * /api/verify-purchase — Fallback cuando el webhook de Stripe no llega
 *
 * POST { sessionId: string }
 * Headers: Authorization: Bearer <supabase_jwt>
 *
 * Verifica directamente con Stripe que el pago fue completado
 * y acredita los créditos si el webhook no lo hizo todavía.
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

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
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data) return null;
  return data.user || null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Stripe no configurado' });
  }

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'No autenticado' });

  const { sessionId } = req.body || {};
  if (!sessionId) return res.status(400).json({ error: 'sessionId requerido' });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
  const sb = supabaseAdmin();

  // Verificar sesión en Stripe
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (e) {
    console.error('[verify-purchase] Stripe error:', e.message);
    return res.status(400).json({ error: 'Sesión no encontrada en Stripe' });
  }

  if (session.payment_status !== 'paid') {
    return res.status(402).json({ error: 'Pago no completado' });
  }

  const userId = session.metadata?.user_id;
  const credits = parseInt(session.metadata?.credits || '0', 10);
  const packageId = session.metadata?.package_id;

  if (!userId || !credits) {
    return res.status(400).json({ error: 'Metadata de sesión incompleta' });
  }

  // Verificar que el usuario autenticado sea el dueño de la compra
  if (userId !== user.id) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  // Verificar si el webhook ya procesó esta sesión
  try {
    const { data: purchase } = await sb
      .from('purchases')
      .select('status')
      .eq('stripe_session_id', sessionId)
      .single();

    if (purchase?.status === 'completed') {
      const { data: profile } = await sb
        .from('profiles').select('credits').eq('id', userId).single();
      console.log(`[verify-purchase] Ya procesado por webhook. Balance: ${profile?.credits}`);
      return res.status(200).json({ already_credited: true, credits: profile?.credits ?? 0 });
    }
  } catch (_) {
    // La tabla purchases puede no existir — continuar igual
  }

  // El webhook no procesó esto — acreditar directamente
  const { data: profile, error: pe } = await sb
    .from('profiles').select('credits').eq('id', userId).single();

  if (pe || !profile) {
    return res.status(404).json({ error: 'Perfil no encontrado' });
  }

  const newCredits = profile.credits + credits;
  await sb.from('profiles').update({ credits: newCredits }).eq('id', userId);

  // Intentar marcar la compra como completada
  try {
    await sb.from('purchases')
      .update({ status: 'completed' })
      .eq('stripe_session_id', sessionId);
  } catch (_) { /* no-op si la tabla no existe */ }

  // Registrar en ledger
  try {
    await sb.from('credit_ledger').insert({
      user_id: userId,
      amount: credits,
      reason: 'purchase_verified',
      meta: { package_id: packageId, stripe_session_id: sessionId },
    });
  } catch (_) { /* no-op */ }

  console.log(`[verify-purchase] +${credits}cr acreditados a ${userId}. Total: ${newCredits}`);
  return res.status(200).json({ ok: true, credits: newCredits });
}
