import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { event, properties } = req.body;
  if (!event) return res.status(400).json({ error: 'event required' });

  let user_id = null;
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7);
    const { data } = await supabase.auth.getUser(token);
    user_id = data?.user?.id ?? null;
  }

  await supabase.from('mvp_events').insert({ event, user_id, properties });

  return res.status(200).json({ ok: true });
}
