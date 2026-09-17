create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key,
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 120),
  content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  owner_id uuid not null references public.app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_shares (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  permission text not null check (permission = 'editor'),
  created_at timestamptz not null default now(),
  unique (document_id, user_id)
);

create index if not exists documents_owner_updated_idx on public.documents (owner_id, updated_at desc);
create index if not exists document_shares_user_idx on public.document_shares (user_id);
create index if not exists document_shares_document_idx on public.document_shares (document_id);

alter table public.app_users enable row level security;
alter table public.documents enable row level security;
alter table public.document_shares enable row level security;

insert into public.app_users (id, name, email) values
  ('11111111-1111-4111-8111-111111111111', 'Mira Shah', 'mira@ajaia.demo'),
  ('22222222-2222-4222-8222-222222222222', 'Alex Chen', 'alex@ajaia.demo'),
  ('33333333-3333-4333-8333-333333333333', 'Jordan Lee', 'jordan@ajaia.demo')
on conflict (id) do update set name = excluded.name, email = excluded.email;
