import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnon) {
  console.warn('[Supabase] Variables de entorno no configuradas. Auth y créditos desactivados.');
}

export const supabase = supabaseUrl && supabaseAnon
  ? createClient(supabaseUrl, supabaseAnon)
  : null;
