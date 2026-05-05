/**
 * /api/reset-test-account?secret=zoltar-debug
 * Elimina completamente la cuenta de prueba para tests desde cero.
 * SOLO para uso en desarrollo — eliminar antes de lanzamiento.
 */
import { createClient } from '@supabase/supabase-js';

const TEST_EMAIL = 'ascencio.gustavo@gmail.com';

export default async function handler(req, res) {
  if (req.query?.secret !== 'zoltar-debug') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  const sb = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // 1. Buscar el usuario en auth
  const { data: { users }, error: listErr } = await sb.auth.admin.listUsers();
  if (listErr) return res.status(500).json({ error: listErr.message });

  const user = users.find(u => u.email === TEST_EMAIL);
  if (!user) return res.status(404).json({ error: `No se encontró usuario con email ${TEST_EMAIL}` });

  const uid = user.id;

  // 2. Borrar registros relacionados
  await sb.from('credit_ledger').delete().eq('user_id', uid);
  await sb.from('purchases').delete().eq('user_id', uid).catch(() => {});
  await sb.from('profiles').delete().eq('id', uid);

  // 3. Borrar el usuario de auth
  const { error: deleteErr } = await sb.auth.admin.deleteUser(uid);
  if (deleteErr) return res.status(500).json({ error: deleteErr.message, note: 'Registros borrados pero auth falló' });

  return res.status(200).json({ ok: true, deleted: TEST_EMAIL, uid });
}
