/**
 * /api/plan-auth  — Valida credenciales del dashboard de plan de negocio.
 * Las credenciales viven en variables de entorno, nunca en el bundle del cliente.
 *
 * POST { user: string, pass: string }
 * → 200 { ok: true }  |  401 { error: string }
 */
import { setCors } from './_cors.js';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { user, pass } = req.body || {};

  const validUser = process.env.PLAN_USER;
  const validPass = process.env.PLAN_PASS;

  if (!validUser || !validPass) {
    return res.status(503).json({ error: 'Autenticación de plan no configurada' });
  }

  if (user === validUser && pass === validPass) {
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({ error: 'Credenciales incorrectas' });
}
