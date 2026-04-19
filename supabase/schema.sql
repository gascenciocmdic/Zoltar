-- ============================================================
-- ZOLTAR — Schema de Base de Datos
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. Tabla de perfiles (extiende auth.users de Supabase)
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  email       text not null,
  credits     integer not null default 0,
  referral_code text unique not null,
  referred_by uuid references public.profiles(id),
  signup_bonus_given boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. Ledger de créditos (historial de movimientos)
create table if not exists public.credit_ledger (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  amount      integer not null,  -- positivo = ganado, negativo = gastado
  reason      text not null,     -- 'signup_bonus' | 'referral_referrer' | 'referral_new_user' | 'consultation' | 'deepening' | 'reconsultation' | 'purchase'
  meta        jsonb,             -- datos extra (package_id, stripe_session, etc.)
  created_at  timestamptz not null default now()
);

-- 3. Compras (registro de transacciones Stripe)
create table if not exists public.purchases (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.profiles(id) on delete cascade not null,
  stripe_session_id text unique not null,
  package_id        text not null,   -- 'iniciado' | 'explorador' | 'oraculo'
  amount_cents      integer not null,
  credits           integer not null,
  status            text not null default 'pending', -- 'pending' | 'completed' | 'refunded'
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- 4. Row Level Security
alter table public.profiles      enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.purchases     enable row level security;

-- profiles: cada usuario sólo ve/edita el suyo
create policy "profiles: own read"   on public.profiles for select using (auth.uid() = id);
create policy "profiles: own update" on public.profiles for update using (auth.uid() = id);

-- credit_ledger: sólo lectura propia (escritura sólo via service_role desde API)
create policy "ledger: own read" on public.credit_ledger for select using (auth.uid() = user_id);

-- purchases: sólo lectura propia
create policy "purchases: own read" on public.purchases for select using (auth.uid() = user_id);

-- 5. Índices de rendimiento
create index if not exists idx_credit_ledger_user_id on public.credit_ledger(user_id);
create index if not exists idx_purchases_user_id     on public.purchases(user_id);
create index if not exists idx_profiles_referral_code on public.profiles(referral_code);

-- 6. Función para actualizar updated_at automáticamente
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger purchases_updated_at
  before update on public.purchases
  for each row execute procedure public.handle_updated_at();
