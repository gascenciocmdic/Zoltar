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

// ── Purchase confirmation email labels ────────────────────────────────────────
const PURCHASE_LABELS = {
  es: {
    subject:   '✨ ¡Tus créditos Zoltar han llegado!',
    success:   '✨ ¡Compra exitosa!',
    body:      (credits) => `Se han acreditado <strong style="color:#ffd700;">${credits} 💎 créditos</strong> a tu cuenta del Oráculo de Vidas Pasadas.`,
    pkg_label: 'Paquete',
    balance:   (total) => `Saldo total: ${total} créditos`,
    note:      'Regresa al Oráculo y continúa tu viaje astral. Los créditos no tienen fecha de vencimiento.',
    cta:       'Ir al Oráculo →',
    pkg_names: { iniciado: 'Iniciado', explorador: 'Explorador', oraculo: 'Oráculo' },
  },
  en: {
    subject:   '✨ Your Zoltar credits have arrived!',
    success:   '✨ Purchase successful!',
    body:      (credits) => `<strong style="color:#ffd700;">${credits} 💎 credits</strong> have been added to your Past Lives Oracle account.`,
    pkg_label: 'Package',
    balance:   (total) => `Total balance: ${total} credits`,
    note:      'Return to the Oracle and continue your astral journey. Credits never expire.',
    cta:       'Go to the Oracle →',
    pkg_names: { iniciado: 'Initiate', explorador: 'Explorer', oraculo: 'Oracle' },
  },
  pt: {
    subject:   '✨ Seus créditos Zoltar chegaram!',
    success:   '✨ Compra bem-sucedida!',
    body:      (credits) => `<strong style="color:#ffd700;">${credits} 💎 créditos</strong> foram adicionados à sua conta do Oráculo de Vidas Passadas.`,
    pkg_label: 'Pacote',
    balance:   (total) => `Saldo total: ${total} créditos`,
    note:      'Volte ao Oráculo e continue sua jornada astral. Os créditos não têm data de vencimento.',
    cta:       'Ir ao Oráculo →',
    pkg_names: { iniciado: 'Iniciante', explorador: 'Explorador', oraculo: 'Oráculo' },
  },
};

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

    // Enviar email de confirmación localizado
    if (process.env.RESEND_API_KEY) {
      try {
        const userEmail = session.customer_email;
        if (userEmail) {
          const lang = session.metadata?.language || 'es';
          const L = PURCHASE_LABELS[lang] || PURCHASE_LABELS.es;
          const pkgName = L.pkg_names[packageId] || packageId;
          const appUrl = process.env.APP_URL || 'https://zoltar-two.vercel.app';
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: process.env.RESEND_FROM_EMAIL || 'Cosmic Guidance <noreply@cosmic-guidance.com>',
              to: userEmail,
              subject: L.subject,
              html: `
                <div style="font-family:'Georgia',serif;max-width:500px;margin:0 auto;background:#0d0d1a;color:#fff;padding:32px;border-radius:16px;">
                  <h1 style="color:#ffd700;font-size:1.6rem;margin-bottom:8px;">${L.success}</h1>
                  <p style="color:rgba(255,255,255,0.7);">${L.body(credits)}</p>
                  <div style="background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.3);border-radius:12px;padding:16px;margin:20px 0;text-align:center;">
                    <p style="font-size:0.8rem;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">${L.pkg_label} ${pkgName}</p>
                    <p style="font-size:2.5rem;font-weight:800;color:#ffd700;margin:0;">${credits} 💎</p>
                    <p style="font-size:0.8rem;color:rgba(255,255,255,0.4);margin:4px 0 0;">${L.balance(newCredits)}</p>
                  </div>
                  <p style="color:rgba(255,255,255,0.5);font-size:0.85rem;">${L.note}</p>
                  <a href="${appUrl}" style="display:inline-block;margin-top:16px;padding:12px 28px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">${L.cta}</a>
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
