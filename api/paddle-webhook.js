/**
 * /api/paddle-webhook
 *
 * Recibe eventos de Paddle (transaction.completed) y acredita créditos al usuario.
 * Verifica la firma HMAC-SHA256 de cada evento antes de procesar.
 *
 * Configurar en Paddle Dashboard → Notifications:
 *   URL: https://www.cosmic-guidance.com/api/paddle-webhook
 *   Eventos: transaction.completed
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Mapeo server-side: priceId → créditos (no confiamos en customData para esto)
const PRICE_TO_CREDITS = {
  [process.env.PADDLE_PRICE_ID_INICIADO]:   150,
  [process.env.PADDLE_PRICE_ID_EXPLORADOR]: 400,
  [process.env.PADDLE_PRICE_ID_ORACULO]:   1100,
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
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verifySignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(';').map(p => p.split('='))
  );
  const { ts, h1 } = parts;
  if (!ts || !h1) return false;

  const signed   = `${ts}:${rawBody.toString('utf8')}`;
  const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(h1));
}

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[paddle-webhook] PADDLE_WEBHOOK_SECRET no configurado');
    return res.status(500).end();
  }

  const rawBody  = await getRawBody(req);
  const sigHeader = req.headers['paddle-signature'];

  if (!verifySignature(rawBody, sigHeader, webhookSecret)) {
    console.error('[paddle-webhook] Firma inválida');
    return res.status(400).json({ error: 'Firma inválida' });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch (err) {
    return res.status(400).json({ error: 'Body inválido' });
  }

  if (event.event_type !== 'transaction.completed') {
    return res.status(200).json({ received: true, skipped: true });
  }

  const transaction = event.data;
  const userId      = transaction.custom_data?.userId;
  const packageId   = transaction.custom_data?.packageId;
  const priceId     = transaction.items?.[0]?.price?.id;
  const credits     = PRICE_TO_CREDITS[priceId];
  const userEmail   = transaction.customer?.email;

  if (!userId || !credits) {
    console.error('[paddle-webhook] Datos insuficientes:', { userId, priceId, credits });
    return res.status(400).json({ error: 'Datos insuficientes en el evento' });
  }

  const sb = supabaseAdmin();

  // Idempotencia: verificar que esta transacción no fue procesada ya
  const { data: existing } = await sb
    .from('purchases')
    .select('id')
    .eq('provider_session_id', transaction.id)
    .single();

  if (existing) {
    console.log(`[paddle-webhook] Transacción ${transaction.id} ya procesada`);
    return res.status(200).json({ received: true, duplicate: true });
  }

  // Obtener créditos actuales
  const { data: profile } = await sb
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  if (!profile) {
    console.error('[paddle-webhook] Perfil no encontrado para userId:', userId);
    return res.status(404).json({ error: 'Perfil no encontrado' });
  }

  const newCredits = profile.credits + credits;

  // Acreditar créditos
  await sb.from('profiles').update({ credits: newCredits }).eq('id', userId);

  // Registrar en ledger
  await sb.from('credit_ledger').insert({
    user_id: userId,
    amount:  credits,
    reason:  'purchase',
    meta:    { package_id: packageId, paddle_transaction_id: transaction.id, price_id: priceId },
  });

  // Registrar compra
  await sb.from('purchases').insert({
    user_id:             userId,
    provider_session_id: transaction.id,
    package_id:          packageId,
    credits,
    status:              'completed',
  }).catch(() => {/* non-fatal si la columna no existe aún */});

  console.log(`[paddle-webhook] +${credits} créditos → ${userId}. Total: ${newCredits}`);

  // Email de confirmación vía Resend
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
      console.error('[paddle-webhook] Email error (non-fatal):', emailErr.message);
    }
  }

  return res.status(200).json({ received: true });
}
