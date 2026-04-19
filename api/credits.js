/**
 * /api/credits  — Gestión de créditos Zoltar
 *
 * GET  ?action=balance          → { credits: number }
 * POST { action: 'initialize', referralCode? }
 *      { action: 'deduct',    reason: 'consultation'|'deepening'|'reconsultation' }
 *      { action: 'referral_complete', newUserId }   ← llamado internamente
 */

import { createClient } from '@supabase/supabase-js';

const CREDIT_COSTS = {
  consultation:   40,
  deepening:      10,
  reconsultation: 20,
};

const SIGNUP_BONUS             = 100;
const REFERRAL_BONUS_REFERRER  = 50;
const REFERRAL_BONUS_NEW_USER  = 25;

function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Verifica el JWT del usuario y retorna su uid */
async function getUser(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return null;

  const sb = supabaseAdmin();
  const { data: { user }, error } = await sb.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

/** Genera un código de referido único de 8 chars */
function genReferralCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sb = supabaseAdmin();

  // ── GET: balance ──────────────────────────────────────────
  if (req.method === 'GET') {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'No autenticado' });

    const { data, error } = await sb
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (error) return res.status(404).json({ error: 'Perfil no encontrado' });
    return res.status(200).json({ credits: data.credits });
  }

  // ── POST ──────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { action, reason, referralCode, newUserId } = req.body || {};

    // ── initialize: crear perfil tras verificar email ──────
    if (action === 'initialize') {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'No autenticado' });

      // Verificar que el email esté confirmado
      if (!user.email_confirmed_at) {
        return res.status(403).json({ error: 'email_not_verified' });
      }

      // Comprobar si ya existe
      const { data: existing } = await sb
        .from('profiles')
        .select('id, signup_bonus_given, credits')
        .eq('id', user.id)
        .single();

      // Cuenta de prueba: siempre reiniciar créditos
      const TEST_ACCOUNT = 'ascencio.gustavo@gmail.com';
      if (existing?.signup_bonus_given && user.email !== TEST_ACCOUNT) {
        return res.status(200).json({ credits: existing.credits, already_initialized: true });
      }
      if (existing?.signup_bonus_given && user.email === TEST_ACCOUNT) {
        const resetCredits = SIGNUP_BONUS;
        await sb.from('profiles').update({ credits: resetCredits }).eq('id', user.id);
        await sb.from('credit_ledger').insert({ user_id: user.id, amount: resetCredits, reason: 'signup_bonus', meta: { test_reset: true } });
        return res.status(200).json({ credits: resetCredits, test_reset: true });
      }

      // Buscar referidor si viene código
      let referrerId = null;
      if (referralCode) {
        const { data: referrer } = await sb
          .from('profiles')
          .select('id')
          .eq('referral_code', referralCode.toUpperCase())
          .single();
        if (referrer) referrerId = referrer.id;
      }

      // Generar código único para este nuevo usuario
      let code;
      let attempts = 0;
      do {
        code = genReferralCode();
        const { data: exists } = await sb.from('profiles').select('id').eq('referral_code', code).single();
        if (!exists) break;
        attempts++;
      } while (attempts < 10);

      // Créditos iniciales: signup + bono por ser referido
      const initialCredits = SIGNUP_BONUS + (referrerId ? REFERRAL_BONUS_NEW_USER : 0);

      if (existing) {
        // Perfil ya existe, sólo marcar como inicializado
        await sb.from('profiles').update({
          signup_bonus_given: true,
          referred_by: referrerId,
          credits: initialCredits,
          referral_code: existing.referral_code || code,
        }).eq('id', user.id);
      } else {
        // Crear perfil nuevo
        await sb.from('profiles').insert({
          id: user.id,
          email: user.email,
          credits: initialCredits,
          referral_code: code,
          referred_by: referrerId,
          signup_bonus_given: true,
        });
      }

      // Registrar en ledger
      const ledgerEntries = [
        { user_id: user.id, amount: SIGNUP_BONUS, reason: 'signup_bonus' },
      ];
      if (referrerId) {
        ledgerEntries.push({ user_id: user.id, amount: REFERRAL_BONUS_NEW_USER, reason: 'referral_new_user' });
      }
      await sb.from('credit_ledger').insert(ledgerEntries);

      // Bonificar al referidor
      if (referrerId) {
        await sb.rpc('increment_credits', { uid: referrerId, delta: REFERRAL_BONUS_REFERRER })
          .catch(() => {
            // Fallback si rpc no existe
            sb.from('profiles')
              .select('credits').eq('id', referrerId).single()
              .then(({ data: r }) => {
                if (r) sb.from('profiles').update({ credits: r.credits + REFERRAL_BONUS_REFERRER }).eq('id', referrerId);
              });
          });
        await sb.from('credit_ledger').insert({
          user_id: referrerId,
          amount: REFERRAL_BONUS_REFERRER,
          reason: 'referral_referrer',
          meta: { new_user_id: user.id },
        });
      }

      return res.status(200).json({ credits: initialCredits });
    }

    // ── deduct: consumir créditos ──────────────────────────
    if (action === 'deduct') {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'No autenticado' });

      const cost = CREDIT_COSTS[reason];
      if (!cost) return res.status(400).json({ error: 'Acción desconocida' });

      const { data: profile, error: pe } = await sb
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (pe || !profile) return res.status(404).json({ error: 'Perfil no encontrado' });
      if (profile.credits < cost) {
        return res.status(402).json({ error: 'insufficient_credits', credits: profile.credits });
      }

      const newCredits = profile.credits - cost;
      await sb.from('profiles').update({ credits: newCredits }).eq('id', user.id);
      await sb.from('credit_ledger').insert({
        user_id: user.id,
        amount: -cost,
        reason,
      });

      return res.status(200).json({ ok: true, credits: newCredits });
    }

    return res.status(400).json({ error: 'Acción no reconocida' });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
