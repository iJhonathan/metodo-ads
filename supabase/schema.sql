-- ============================================
-- MÉTODO ADS — Supabase Schema
-- Ejecutar en: Supabase > SQL Editor
-- ============================================

-- Habilitar extensión UUID
create extension if not exists "uuid-ossp";

-- ============================================
-- TABLA: users (extiende auth.users de Supabase)
-- ============================================
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre text,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro', 'elite')),
  api_key_claude text,
  api_key_google text,
  created_at timestamptz default now()
);

-- ============================================
-- TABLA: projects
-- ============================================
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  nombre text not null,
  descripcion text,
  producto text,
  publico text,
  propuesta_valor text,
  created_at timestamptz default now()
);

-- ============================================
-- TABLA: branding_kits
-- ============================================
create table if not exists public.branding_kits (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  colores jsonb default '[]',
  tono text,
  estilo text,
  publico_detallado text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- TABLA: knowledge_base
-- ============================================
create table if not exists public.knowledge_base (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  contenido text,
  updated_at timestamptz default now()
);

-- ============================================
-- TABLA: angles (ángulos de venta)
-- ============================================
create table if not exists public.angles (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  tipo text, -- dolor, curiosidad, objecion, miedo, resultado, etc.
  headline text,
  copy text,
  visual_sugerido text,
  guardado boolean default false,
  created_at timestamptz default now()
);

-- ============================================
-- TABLA: creatives
-- ============================================
create table if not exists public.creatives (
  id uuid primary key default uuid_generate_v4(),
  angle_id uuid references public.angles(id) on delete set null,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  imagen_url text,
  estado text default 'pendiente' check (estado in ('pendiente', 'aprobado', 'descartado')),
  created_at timestamptz default now()
);

-- ============================================
-- TABLA: subscriptions
-- ============================================
create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text,
  status text, -- active, canceled, past_due
  periodo_inicio timestamptz,
  periodo_fin timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- TABLA: usage (contador mensual)
-- ============================================
create table if not exists public.usage (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  mes text not null, -- formato: "2024-01"
  creativos_generados integer default 0,
  unique(user_id, mes)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.branding_kits enable row level security;
alter table public.knowledge_base enable row level security;
alter table public.angles enable row level security;
alter table public.creatives enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage enable row level security;

-- Users: solo puede ver/editar su propio perfil
create policy "users_own" on public.users
  for all using (auth.uid() = id);

-- Projects: solo el dueño
create policy "projects_own" on public.projects
  for all using (auth.uid() = user_id);

-- Branding kits: a través del proyecto
create policy "branding_own" on public.branding_kits
  for all using (
    exists (select 1 from public.projects where id = project_id and user_id = auth.uid())
  );

-- Knowledge base: a través del proyecto
create policy "knowledge_own" on public.knowledge_base
  for all using (
    exists (select 1 from public.projects where id = project_id and user_id = auth.uid())
  );

-- Angles: a través del proyecto
create policy "angles_own" on public.angles
  for all using (
    exists (select 1 from public.projects where id = project_id and user_id = auth.uid())
  );

-- Creatives: solo el dueño
create policy "creatives_own" on public.creatives
  for all using (auth.uid() = user_id);

-- Subscriptions: solo el dueño
create policy "subscriptions_own" on public.subscriptions
  for all using (auth.uid() = user_id);

-- Usage: solo el dueño
create policy "usage_own" on public.usage
  for all using (auth.uid() = user_id);

-- ============================================
-- FUNCIÓN: auto-crear perfil en users al registrarse
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, nombre)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- FUNCIÓN: incrementar contador de uso mensual
-- ============================================
create or replace function public.increment_usage(p_user_id uuid, p_mes text)
returns void as $$
begin
  insert into public.usage (user_id, mes, creativos_generados)
  values (p_user_id, p_mes, 1)
  on conflict (user_id, mes)
  do update set creativos_generados = public.usage.creativos_generados + 1;
end;
$$ language plpgsql security definer;
