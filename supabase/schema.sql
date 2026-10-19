-- Rode no SQL Editor do Supabase quando usar CONTENT_STORE=supabase.
-- As tabelas ficam fechadas (RLS sem políticas). O site lê e grava apenas pelas
-- funções abaixo, que exigem o token secreto guardado em private.config.
-- Depois de rodar, copie o token para SUPABASE_PORTAL_TOKEN:
--   select value from private.config where key = 'write_token';

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.config (key text primary key, value text not null);
insert into private.config (key, value)
values ('write_token', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (key) do nothing;

create table if not exists public.collections (
  name text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.uploads (
  name text primary key,
  mime text not null,
  data bytea not null,
  created_at timestamptz not null default now()
);
alter table public.collections enable row level security;
alter table public.uploads enable row level security;
revoke all on public.collections, public.uploads from anon, authenticated;

create or replace function private.check_token(p_token text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_token is null or not exists (select 1 from private.config where key = 'write_token' and value = p_token) then
    raise exception 'acesso negado' using errcode = '42501';
  end if;
end $$;

create or replace function public.portal_get(p_token text, p_name text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.check_token(p_token);
  return (select data from public.collections where name = p_name);
end $$;

create or replace function public.portal_set(p_token text, p_name text, p_data jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.check_token(p_token);
  insert into public.collections (name, data, updated_at) values (p_name, p_data, now())
  on conflict (name) do update set data = excluded.data, updated_at = now();
end $$;

create or replace function public.portal_upload_put(p_token text, p_name text, p_mime text, p_b64 text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.check_token(p_token);
  if p_mime not in ('image/jpeg', 'image/png', 'image/webp', 'image/gif') then
    raise exception 'tipo de arquivo inválido';
  end if;
  insert into public.uploads (name, mime, data) values (p_name, p_mime, decode(p_b64, 'base64'));
end $$;

-- Fotos são públicas no site, então a leitura não exige token.
create or replace function public.portal_upload_get(p_name text) returns table (mime text, b64 text)
language sql security definer set search_path = '' stable as $$
  select u.mime, encode(u.data, 'base64') from public.uploads u where u.name = p_name;
$$;

revoke all on function private.check_token(text) from public, anon, authenticated;
revoke all on function public.portal_get(text, text), public.portal_set(text, text, jsonb),
  public.portal_upload_put(text, text, text, text), public.portal_upload_get(text) from public;
grant execute on function public.portal_get(text, text), public.portal_set(text, text, jsonb),
  public.portal_upload_put(text, text, text, text), public.portal_upload_get(text) to anon, authenticated;

-- ---------- Arquivos privados dos sócios (foto, comprovante de matrícula) ----------
-- Leitura e gravação exigem o token: nada aqui é público, nem as imagens.
create table if not exists public.private_files (
  name text primary key,
  mime text not null,
  data bytea not null,
  created_at timestamptz not null default now()
);
alter table public.private_files enable row level security;
revoke all on public.private_files from anon, authenticated;

create or replace function public.portal_private_put(p_token text, p_name text, p_mime text, p_b64 text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.check_token(p_token);
  if p_mime not in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf') then
    raise exception 'tipo de arquivo inválido';
  end if;
  insert into public.private_files (name, mime, data) values (p_name, p_mime, decode(p_b64, 'base64'));
end $$;

create or replace function public.portal_private_get(p_token text, p_name text) returns table (mime text, b64 text)
language plpgsql security definer set search_path = '' stable as $$
begin
  perform private.check_token(p_token);
  return query select f.mime, encode(f.data, 'base64') from public.private_files f where f.name = p_name;
end $$;

revoke all on function public.portal_private_put(text, text, text, text), public.portal_private_get(text, text) from public;
grant execute on function public.portal_private_put(text, text, text, text), public.portal_private_get(text, text) to anon, authenticated;

-- ---------- Histórico de alterações do painel (somente inclusão) ----------
create table if not exists public.audit_log (
  id text primary key,
  at timestamptz not null default now(),
  entry jsonb not null
);
create index if not exists audit_log_at_idx on public.audit_log (at desc);
alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;

-- Imutável: UPDATE, DELETE e TRUNCATE são recusados, venham de onde vierem.
create or replace function private.audit_log_immutable() returns trigger
language plpgsql set search_path = '' as $fn$
begin
  raise exception 'Historico de alteracoes nao pode ser editado nem apagado';
end $fn$;
drop trigger if exists audit_log_no_change on public.audit_log;
create trigger audit_log_no_change before update or delete on public.audit_log
  for each row execute function private.audit_log_immutable();
drop trigger if exists audit_log_no_truncate on public.audit_log;
create trigger audit_log_no_truncate before truncate on public.audit_log
  for each statement execute function private.audit_log_immutable();

-- A data/hora gravada é a do banco, não a enviada pelo site.
create or replace function public.portal_audit_add(p_token text, p_entry jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare ts timestamptz := now();
begin
  perform private.check_token(p_token);
  insert into public.audit_log (id, at, entry)
  values (p_entry->>'id', ts, jsonb_set(p_entry, '{at}', to_jsonb(ts)));
end $$;

create or replace function public.portal_audit_list(p_token text, p_limit int) returns setof jsonb
language plpgsql security definer set search_path = '' stable as $$
begin
  perform private.check_token(p_token);
  return query select a.entry from public.audit_log a order by a.at desc limit least(greatest(p_limit, 1), 10000);
end $$;

revoke all on function public.portal_audit_add(text, jsonb), public.portal_audit_list(text, int) from public;
grant execute on function public.portal_audit_add(text, jsonb), public.portal_audit_list(text, int) to anon, authenticated;
