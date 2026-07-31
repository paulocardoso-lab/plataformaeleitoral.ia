create table if not exists public.convites_diretos (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(trim(nome)) between 2 and 120),
  codigo_hash text not null unique check (codigo_hash ~ '^[a-f0-9]{64}$'),
  status text not null default 'disponivel' check (status in ('disponivel','utilizado','revogado','expirado')),
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null,
  utilizado_em timestamptz,
  revogado_em timestamptz,
  criado_por text
);

create table if not exists public.sessoes_convite_direto (
  id uuid primary key default gen_random_uuid(),
  convite_id uuid not null references public.convites_diretos(id) on delete cascade,
  device_id text not null check (char_length(device_id) between 16 and 200),
  token_hash bytea not null unique,
  criado_em timestamptz not null default now(),
  ultimo_acesso_em timestamptz not null default now(),
  expira_em timestamptz not null,
  revogado_em timestamptz
);

create table if not exists public.tentativas_convite_direto (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  device_hash text not null,
  sucesso boolean not null,
  criado_em timestamptz not null default now()
);

create index if not exists idx_convites_diretos_status on public.convites_diretos(status, expira_em);
create index if not exists idx_sessoes_convite_ativas on public.sessoes_convite_direto(convite_id, expira_em) where revogado_em is null;
create index if not exists idx_tentativas_convite_ip on public.tentativas_convite_direto(ip_hash, criado_em);
create index if not exists idx_tentativas_convite_device on public.tentativas_convite_direto(device_hash, criado_em);

alter table public.convites_diretos enable row level security;
alter table public.sessoes_convite_direto enable row level security;
alter table public.tentativas_convite_direto enable row level security;

create or replace function public.emitir_sessao_convite_direto(
  p_codigo text,
  p_device_id text
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_convite public.convites_diretos%rowtype;
  v_token text;
begin
  if p_device_id is null or char_length(p_device_id) < 16 or p_codigo !~ '^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$' then
    return jsonb_build_object('sucesso',false,'motivo','codigo_invalido');
  end if;

  select * into v_convite
  from public.convites_diretos
  where codigo_hash = encode(extensions.digest(convert_to(upper(p_codigo),'UTF8'),'sha256'),'hex')
  for update;

  if not found then return jsonb_build_object('sucesso',false,'motivo','codigo_invalido'); end if;
  if v_convite.status = 'revogado' then return jsonb_build_object('sucesso',false,'motivo','convite_revogado'); end if;
  if v_convite.expira_em <= now() then
    update public.convites_diretos set status='expirado' where id=v_convite.id;
    return jsonb_build_object('sucesso',false,'motivo','convite_expirado');
  end if;
  if v_convite.status <> 'disponivel' then return jsonb_build_object('sucesso',false,'motivo','codigo_utilizado'); end if;

  v_token := encode(extensions.gen_random_bytes(32),'hex');
  insert into public.sessoes_convite_direto(convite_id,device_id,token_hash,expira_em)
  values(v_convite.id,p_device_id,extensions.digest(convert_to(v_token,'UTF8'),'sha256'),v_convite.expira_em);
  update public.convites_diretos set status='utilizado',utilizado_em=now() where id=v_convite.id;
  return jsonb_build_object('sucesso',true,'sessao_token',v_token,'expira_em',v_convite.expira_em,'nome',v_convite.nome);
end;
$$;

create or replace function public.validar_sessao_convite_direto(p_token text,p_device_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_sessao public.sessoes_convite_direto%rowtype;
begin
  select * into v_sessao from public.sessoes_convite_direto
  where token_hash=extensions.digest(convert_to(p_token,'UTF8'),'sha256')
    and device_id=p_device_id and revogado_em is null and expira_em>now();
  if not found then return jsonb_build_object('valida',false,'motivo','sessao_invalida'); end if;
  update public.sessoes_convite_direto set ultimo_acesso_em=now() where id=v_sessao.id;
  return jsonb_build_object('valida',true,'tipo','convite_direto','expira_em',v_sessao.expira_em,'convite_id',v_sessao.convite_id);
end;
$$;

create or replace function public.revogar_sessao_convite_direto(p_token text,p_device_id text)
returns boolean
language sql
security definer
set search_path = public, extensions
as $$
  update public.sessoes_convite_direto set revogado_em=coalesce(revogado_em,now())
  where token_hash=extensions.digest(convert_to(p_token,'UTF8'),'sha256') and device_id=p_device_id
  returning true;
$$;

revoke all on function public.emitir_sessao_convite_direto(text,text) from public,anon,authenticated;
revoke all on function public.validar_sessao_convite_direto(text,text) from public,anon,authenticated;
revoke all on function public.revogar_sessao_convite_direto(text,text) from public,anon,authenticated;
grant execute on function public.emitir_sessao_convite_direto(text,text) to service_role;
grant execute on function public.validar_sessao_convite_direto(text,text) to service_role;
grant execute on function public.revogar_sessao_convite_direto(text,text) to service_role;

revoke all on public.convites_diretos, public.sessoes_convite_direto, public.tentativas_convite_direto from anon,authenticated;
grant all on public.convites_diretos, public.sessoes_convite_direto, public.tentativas_convite_direto to service_role;
grant usage,select on sequence public.tentativas_convite_direto_id_seq to service_role;
