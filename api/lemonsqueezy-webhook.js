/**
 * /api/lemonsqueezy-webhook
 *
 * Recibe eventos de LemonSqueezy y acredita créditos al usuario.
 * Verifica la firma HMAC-SHA256 antes de procesar cualquier evento.
 *
 * Configurar en LemonSqueezy → Settings → Webhooks:
 *   URL:    https://www.cosmic-guidance.com/api/lemonsqueezy-webhook
 *   Events: order_created
 *   Secret: (copiar en env var LEMONSQUEEZY_WEBHOOK_SECRET)
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Mapeo server-side: variantId (string) → créditos
const VARIANT_TO_CREDITS = {
  [process.env.LEMONSQUEEZY_VARIANT_ID_INICIADO]:   150,
  [process.env.LEMONSQUEEZY_VARIANT_ID_EXPLORADOR]: 400,
  [process.env.LEMONSQUEEZY_VARIANT_ID_ORACULO]:   1100,
};

function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end',  () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verifySignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader) return false;
  const digest   = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const expected = Buffer.from(digest, 'utf8');
  const received = Buffer.from(signatureHeader, 'utf8');
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
}

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[ls-webhook] LEMONSQUEEZY_WEBHOOK_SECRET no configurado');
    return res.status(500).end();
  }

  const rawBody   = await getRawBody(req);
  const sigHeader = req.headers['x-signature'];

  if (!verifySignature(rawBody, sigHeader, webhookSecret)) {
    console.error('[ls-webhook] Firma inválida');
    return res.status(400).json({ error: 'Firma inválida' });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Body inválido' });
  }

  // Solo procesar order_created con status paid
  const eventName = event.meta?.event_name;
  if (eventName !== 'order_created') {
    return res.status(200).json({ received: true, skipped: true });
  }

  const order  = event.data;
  const status = order?.attributes?.status;
  if (status !== 'paid') {
    return res.status(200).json({ received: true, skipped: true, status });
  }

  const customData = event.meta?.custom_data || {};
  const userId     = customData.user_id;
  const packageId  = customData.package_id;
  const variantId  = String(order?.attributes?.variant_id);
  const orderId    = String(order?.id);
  const userEmail  = order?.attributes?.user_email;
  const credits    = VARIANT_TO_CREDITS[variantId];

  if (!userId || !credits) {
    console.error('[ls-webhook] Datos insuficientes:', { userId, variantId, credits });
    return res.status(400).json({ error: 'Datos insuficientes en el evento' });
  }

  const sb = supabaseAdmin();

  // Idempotencia: evitar acreditar la misma orden dos veces
  const { data: existing } = await sb
    .from('purchases')
    .select('id')
    .eq('provider_session_id', orderId)
    .single();

  if (existing) {
    console.log(`[ls-webhook] Orden ${orderId} ya procesada`);
    return res.status(200).json({ received: true, duplicate: true });
  }

  const { data: profile } = await sb
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  if (!profile) {
    console.error('[ls-webhook] Perfil no encontrado:', userId);
    return res.status(404).json({ error: 'Perfil no encontrado' });
  }

  const newCredits = profile.credits + credits;

  await sb.from('profiles').update({ credits: newCredits }).eq('id', userId);

  await sb.from('credit_ledger').insert({
    user_id: userId,
    amount:  credits,
    reason:  'purchase',
    meta:    { package_id: packageId, ls_order_id: orderId, variant_id: variantId },
  });

  await sb.from('purchases').insert({
    user_id:             userId,
    provider_session_id: orderId,
    package_id:          packageId,
    credits,
    status:              'completed',
  }).catch(() => {});

  console.log(`[ls-webhook] +${credits} créditos → ${userId}. Total: ${newCredits}`);

  // Email de confirmación vía Resend (non-fatal)
  if (process.env.RESEND_API_KEY && userEmail) {
    try {
      const appUrl = process.env.APP_URL || 'https://www.cosmic-guidance.com';
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization:  `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from:    process.env.RESEND_FROM_EMAIL || 'Cosmic Guidance <noreply@cosmic-guidance.com>',
          to:      userEmail,
          subject: '✨ ¡Tus créditos Zoltar han llegado!',
          html: `
            <div style="font-family:'Georgia',serif;max-width:500px;margin:0 auto;background:#0d0d1a;color:#fff;padding:32px;border-radius:16px;">
              <h1 style="color:#ffd700;font-size:1.6rem;">✨ ¡Compra exitosa!</h1>
              <p style="color:rgba(255,255,255,0.7);">
                Se han acreditado <strong style="color:#ffd700;">${credits} 💎 créditos</strong> a tu cuenta del Oráculo de Vidas Pasadas.
              </p>
              <div style="background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.3);border-radius:12px;padding:16px;margin:20px 0;text-align:center;">
                <p style="font-size:2.5rem;font-weight:800;color:#ffd700;margin:0;">${credits} 💎</p>
                <p style="font-size:0.8rem;color:rgba(255,255,255,0.4);margin:4px 0 0;">Saldo total: ${newCredits} créditos</p>
              </div>
              <p style="color:rgba(255,255,255,0.5);font-size:0.85rem;">Regresa al Oráculo y continúa tu viaje astral. Los créditos no tienen fecha de vencimiento.</p>
              <a href="${appUrl}" style="display:inline-block;margin-top:16px;padding:12px 28px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">Ir al Oráculo →</a>
            </div>
          `,
        }),
      });
    } catch (emailErr) {
      console.error('[ls-webhook] Email error (non-fatal):', emailErr.message);
    }
  }

  return res.status(200).json({ received: true });
}
