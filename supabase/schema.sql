-- Rode no SQL Editor do Supabase quando usar CONTENT_STORE=supabase.
create table if not exists public.collections (
  name text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Acesso apenas pelo servidor (service role). Nada exposto publicamente.
alter table public.collections enable row level security;

-- Bucket público para as fotos enviadas pelo painel.
insert into storage.buckets (id, name, public) values ('portal', 'portal', true)
on conflict (id) do nothing;
