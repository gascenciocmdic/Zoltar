// ── Costos de acciones ──────────────────────────────────────
export const CREDIT_COSTS = {
  consultation:    40,   // Consulta completa nueva
  ancestral_ritual: 70,   // Consulta premium con mayor profundidad
  deepening:       10,   // Profundización por carta
  reconsultation:  40,   // Nueva consulta en la misma sesión (sin recargar)
  synthesis_email: 10,   // Enviar síntesis final por correo
};

// ── Bonos de créditos ───────────────────────────────────────
export const CREDIT_BONUSES = {
  signup:           100,  // Verificación de email
  referral_referrer: 50,  // Alguien que referiste se registra y verifica
  referral_new_user: 25,  // Bono extra al nuevo usuario referido
};

// ── Paquetes de compra ──────────────────────────────────────
export const PACKAGES = [
  {
    id:            'iniciado',
    name:          'Iniciado',
    credits:       150,
    price_cents:   499,
    price_display: '$4.99 USD',
    consultations: '~3 consultas',
  },
  {
    id:            'explorador',
    name:          'Explorador',
    credits:       400,
    price_cents:   999,
    price_display: '$9.99 USD',
    consultations: '~10 consultas',
    popular:       true,
  },
  {
    id:            'oraculo',
    name:          'Oráculo',
    credits:       1100,
    price_cents:   1999,
    price_display: '$19.99 USD',
    consultations: '~27 consultas',
  },
];

// ── Helpers ─────────────────────────────────────────────────
export function canAfford(balance, action) {
  return balance >= (CREDIT_COSTS[action] ?? 0);
}

export function formatCredits(n) {
  return `${n} crédito${n !== 1 ? 's' : ''}`;
}

/** Llama a la API interna para obtener el saldo del usuario */
export async function fetchBalance(session) {
  if (!session) return null;
  const res = await fetch('/api/credits?action=balance', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.credits ?? null;
}

/** Devuelve créditos (reembolso); retorna {ok, credits} */
export async function refundCredits(session, amount, reason = 'refund') {
  if (!session) return { ok: false, error: 'not_authenticated' };
  const res = await fetch('/api/credits', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      Authorization:   `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action: 'refund', amount, reason }),
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

/** Deduce créditos para una acción; retorna {ok, credits} */
export async function deductCredits(session, action) {
  if (!session) return { ok: false, error: 'not_authenticated' };
  const res = await fetch('/api/credits', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      Authorization:   `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action: 'deduct', reason: action }),
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}
