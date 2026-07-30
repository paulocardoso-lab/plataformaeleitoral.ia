create table if not exists public.licencas (
  id uuid primary key default gen_random_uuid(),
  codigo_id uuid unique not null references public.codigos_acesso(id) on delete restrict,
  user_id uuid unique not null references auth.users(id) on delete cascade,
  status text not null default 'ativa' check (status in ('ativa', 'revogada')),
  criada_em timestamptz not null default now(),
  ultimo_acesso_em timestamptz not null default now(),
  revogada_em timestamptz
);

alter table public.licencas enable row level security;
revoke all on table public.licencas from public, anon, authenticated;

alter table public.codigos_acesso drop constraint if exists codigos_acesso_origem_check;
alter table public.codigos_acesso add constraint codigos_acesso_origem_check
  check (origem in ('manual', 'hotmart', 'admin', 'tester'));

alter table public.sessoes_acesso
  add column if not exists tipo text not null default 'legado'
    check (tipo in ('legado', 'tester')),
  add column if not exists expiracao_maxima timestamptz;

create table if not exists public.tentativas_tester (
  id bigint generated always as identity primary key,
  fingerprint_hash text not null,
  sucesso boolean not null,
  criado_em timestamptz not null default now()
);
create index if not exists idx_tentativas_tester_fingerprint_data
  on public.tentativas_tester (fingerprint_hash, criado_em desc);
alter table public.tentativas_tester enable row level security;
revoke all on table public.tentativas_tester from public, anon, authenticated;

create or replace function public.ativar_codigo_usuario(p_codigo text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_codigo public.codigos_acesso%rowtype;
begin
  if v_user_id is null then
    return jsonb_build_object('sucesso', false, 'motivo', 'usuario_nao_autenticado');
  end if;
  if exists(select 1 from public.licencas where user_id=v_user_id and status='ativa' and revogada_em is null) then
    return jsonb_build_object('sucesso', true, 'motivo', 'licenca_ja_ativa');
  end if;

  select * into v_codigo from public.codigos_acesso
  where codigo = upper(trim(p_codigo)) for update;
  if not found then
    return jsonb_build_object('sucesso', false, 'motivo', 'codigo_invalido');
  end if;

  if exists (select 1 from public.licencas where codigo_id = v_codigo.id and user_id <> v_user_id) then
    return jsonb_build_object('sucesso', false, 'motivo', 'codigo_ja_utilizado');
  end if;
  if v_codigo.status = 'usado'
     and not exists (select 1 from public.licencas where codigo_id = v_codigo.id and user_id = v_user_id) then
    return jsonb_build_object('sucesso', false, 'motivo', 'codigo_requer_migracao');
  end if;

  update public.codigos_acesso set status='usado', usado_em=coalesce(usado_em, now())
  where id=v_codigo.id;
  insert into public.licencas(codigo_id,user_id) values(v_codigo.id,v_user_id)
  on conflict (user_id) do update
    set status='ativa', revogada_em=null, ultimo_acesso_em=now();
  return jsonb_build_object('sucesso', true, 'motivo', 'licenca_ativa');
end;
$$;

create or replace function public.migrar_sessao_usuario(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_sessao public.sessoes_acesso%rowtype;
begin
  if v_user_id is null then
    return jsonb_build_object('sucesso', false, 'motivo', 'usuario_nao_autenticado');
  end if;
  select * into v_sessao from public.sessoes_acesso
  where token_hash=extensions.digest(convert_to(p_token,'UTF8'),'sha256')
    and revogado_em is null and expira_em > now() and tipo='legado'
  for update;
  if not found then return jsonb_build_object('sucesso',false,'motivo','sessao_invalida'); end if;

  insert into public.licencas(codigo_id,user_id) values(v_sessao.codigo_id,v_user_id)
  on conflict (codigo_id) do update set user_id=v_user_id,status='ativa',revogada_em=null;
  update public.sessoes_acesso set revogado_em=now() where id=v_sessao.id;
  return jsonb_build_object('sucesso',true,'motivo','sessao_migrada');
end;
$$;

create or replace function public.possui_licenca()
returns boolean language sql security definer set search_path=pg_catalog,public
as $$
  select exists(
    select 1 from public.licencas
    where user_id=auth.uid() and status='ativa' and revogada_em is null
  );
$$;

create or replace function public.emitir_sessao_tester(p_device_id text)
returns jsonb language plpgsql security definer
set search_path=pg_catalog,public,extensions
as $$
declare v_codigo_id uuid; v_token text; v_limite timestamptz:=now()+interval '7 days';
begin
  if current_user not in ('postgres','service_role','supabase_admin') then
    raise exception 'forbidden';
  end if;
  insert into public.codigos_acesso(codigo,origem,status,device_id,usado_em)
  values('TEST-'||upper(encode(extensions.gen_random_bytes(8),'hex')),'tester','usado',p_device_id,now())
  returning id into v_codigo_id;
  v_token:=encode(extensions.gen_random_bytes(32),'hex');
  insert into public.sessoes_acesso(codigo_id,device_id,token_hash,expira_em,tipo,expiracao_maxima)
  values(v_codigo_id,p_device_id,extensions.digest(convert_to(v_token,'UTF8'),'sha256'),v_limite,'tester',v_limite);
  return jsonb_build_object('sucesso',true,'sessao_token',v_token,'expira_em',v_limite);
end;
$$;

revoke all on function public.ativar_codigo_usuario(text) from public,anon;
revoke all on function public.migrar_sessao_usuario(text) from public,anon;
revoke all on function public.possui_licenca() from public,anon;
revoke all on function public.emitir_sessao_tester(text) from public,anon,authenticated;
grant execute on function public.ativar_codigo_usuario(text) to authenticated;
grant execute on function public.migrar_sessao_usuario(text) to authenticated;
grant execute on function public.possui_licenca() to authenticated;
grant execute on function public.emitir_sessao_tester(text) to service_role;
