/**
 * /api/credits  — Gestión de créditos Zoltar
 *
 * GET  ?action=balance          → { credits: number }
 * POST { action: 'initialize', referralCode? }
 *      { action: 'deduct',    reason: 'consultation'|'deepening'|'reconsultation' }
 *      { action: 'referral_complete', newUserId }   ← llamado internamente
 */

import { createClient } from '@supabase/supabase-js';
import { setCors } from './_cors.js';

// ── Config cache: lee app_config de Supabase con fallback a constantes ──
let _configCache = null;
let _configCacheTime = 0;
const CONFIG_TTL_MS = 60_000;

const CREDIT_COSTS_DEFAULT = {
  consultation:     40,
  ancestral_ritual: 65,
  premium_ritual:  100,
  deepening:        10,
  reconsultation:   40,
  synthesis_email:  10,
};

const BONUSES_DEFAULT = {
  signup:              100,
  referral_referrer:    50,
  referral_new_user:    25,
};

async function getAppConfig(sb) {
  const now = Date.now();
  if (_configCache && now - _configCacheTime < CONFIG_TTL_MS) return _configCache;

  try {
    const { data, error } = await sb
      .from('app_config')
      .select('key, value')
      .in('key', [
        'credit_cost_consultation', 'credit_cost_ancestral_ritual',
        'credit_cost_premium_ritual', 'credit_cost_deepening',
        'credit_cost_reconsultation', 'credit_cost_synthesis_email',
        'signup_bonus', 'referral_bonus_referrer', 'referral_bonus_new_user',
      ]);

    if (error || !data) throw new Error(error?.message || 'No data');

    const raw = Object.fromEntries(data.map(r => [r.key, Number(r.value)]));
    _configCache = {
      CREDIT_COSTS: {
        consultation:     raw.credit_cost_consultation     ?? CREDIT_COSTS_DEFAULT.consultation,
        ancestral_ritual: raw.credit_cost_ancestral_ritual ?? CREDIT_COSTS_DEFAULT.ancestral_ritual,
        premium_ritual:   raw.credit_cost_premium_ritual   ?? CREDIT_COSTS_DEFAULT.premium_ritual,
        deepening:        raw.credit_cost_deepening        ?? CREDIT_COSTS_DEFAULT.deepening,
        reconsultation:   raw.credit_cost_reconsultation   ?? CREDIT_COSTS_DEFAULT.reconsultation,
        synthesis_email:  raw.credit_cost_synthesis_email  ?? CREDIT_COSTS_DEFAULT.synthesis_email,
      },
      BONUSES: {
        signup:            raw.signup_bonus            ?? BONUSES_DEFAULT.signup,
        referral_referrer: raw.referral_bonus_referrer ?? BONUSES_DEFAULT.referral_referrer,
        referral_new_user: raw.referral_bonus_new_user ?? BONUSES_DEFAULT.referral_new_user,
      },
    };
    _configCacheTime = now;
  } catch (err) {
    console.warn('[credits] No se pudo leer app_config, usando defaults:', err.message);
    _configCache = { CREDIT_COSTS: CREDIT_COSTS_DEFAULT, BONUSES: BONUSES_DEFAULT };
    _configCacheTime = now;
  }

  return _configCache;
}

function supabaseAdmin() {
  console.log("[Supabase Admin] Initializing with URL:", process.env.SUPABASE_URL ? "SET" : "MISSING");
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Verifica el JWT del usuario y retorna su uid */
async function getUser(req) {
  try {
    const auth = req.headers['authorization'] || '';
    const token = auth.replace('Bearer ', '').trim();
    if (!token) return null;

    const sb = supabaseAdmin();
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data) return null;
    return data.user || null;
  } catch (err) {
    console.error("getUser Exception:", err);
    return null;
  }
}

/** Genera un código de referido único de 8 chars */
function genReferralCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sb = supabaseAdmin();
  const { CREDIT_COSTS, BONUSES } = await getAppConfig(sb);
  const SIGNUP_BONUS            = BONUSES.signup;
  const REFERRAL_BONUS_REFERRER = BONUSES.referral_referrer;
  const REFERRAL_BONUS_NEW_USER = BONUSES.referral_new_user;

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
    const { action, reason, referralCode, newUserId, isNewRegistration } = req.body || {};

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

      // Si ya está inicializado, retornar sin cambios
      if (existing?.signup_bonus_given) {
        return res.status(200).json({ credits: existing.credits, already_initialized: true });
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

    // ── refund: devolver créditos (solo montos equivalentes a costos conocidos) ─
    if (action === 'refund') {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'No autenticado' });

      const amount = parseInt(req.body.amount, 10);
      const validAmounts = Object.values(CREDIT_COSTS);
      if (!amount || !validAmounts.includes(amount)) {
        return res.status(400).json({ error: 'Monto de reembolso inválido' });
      }

      const { data: profile, error: pe } = await sb
        .from('profiles').select('credits').eq('id', user.id).single();
      if (pe || !profile) return res.status(404).json({ error: 'Perfil no encontrado' });

      const newCredits = profile.credits + amount;
      await sb.from('profiles').update({ credits: newCredits }).eq('id', user.id);
      await sb.from('credit_ledger').insert({
        user_id: user.id, amount, reason: reason || 'refund',
      });

      return res.status(200).json({ ok: true, credits: newCredits });
    }

    return res.status(400).json({ error: 'Acción no reconocida' });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
