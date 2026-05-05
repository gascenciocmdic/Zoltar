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

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
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

    // Enviar email de confirmación (requiere RESEND_API_KEY en Vercel)
    if (process.env.RESEND_API_KEY) {
      try {
        const userEmail = session.customer_email;
        if (userEmail) {
          const packageNames = { iniciado: 'Iniciado', explorador: 'Explorador', oraculo: 'Oráculo' };
          const pkgName = packageNames[packageId] || packageId;
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: process.env.RESEND_FROM_EMAIL || 'Zoltar Oráculo <noreply@zoltar.app>',
              to: userEmail,
              subject: '✨ ¡Tus créditos Zoltar han llegado!',
              html: `
                <div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#0d0d1a;color:#fff;padding:32px;border-radius:16px;">
                  <h1 style="color:#ffd700;font-size:1.6rem;margin-bottom:8px;">✨ ¡Compra exitosa!</h1>
                  <p style="color:rgba(255,255,255,0.7);">Se han acreditado <strong style="color:#ffd700;">${credits} 💎 créditos</strong> a tu cuenta del Oráculo de Vidas Pasadas.</p>
                  <div style="background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.3);border-radius:12px;padding:16px;margin:20px 0;text-align:center;">
                    <p style="font-size:0.8rem;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">Paquete ${pkgName}</p>
                    <p style="font-size:2.5rem;font-weight:800;color:#ffd700;margin:0;">${credits} 💎</p>
                    <p style="font-size:0.8rem;color:rgba(255,255,255,0.4);margin:4px 0 0;">Saldo total: ${newCredits} créditos</p>
                  </div>
                  <p style="color:rgba(255,255,255,0.5);font-size:0.85rem;">Regresa al Oráculo y continúa tu viaje astral. Los créditos no tienen fecha de vencimiento.</p>
                  <a href="${process.env.APP_URL || 'https://zoltar-two.vercel.app'}" style="display:inline-block;margin-top:16px;padding:12px 28px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">Ir al Oráculo →</a>
                </div>
              `,
            }),
          });
        }
      } catch(emailErr) {
        console.error('[Webhook] Email error (non-fatal):', emailErr.message);
      }
    }
  }

  return res.status(200).json({ received: true });
}
