-- Sessões opacas para substituir a flag booleana controlada pelo cliente.
-- Ordem de deploy: aplicar esta migration antes de publicar o frontend 2.7.0.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.sessoes_acesso (
  id uuid primary key default gen_random_uuid(),
  codigo_id uuid not null references public.codigos_acesso(id) on delete cascade,
  device_id text not null,
  token_hash bytea unique not null,
  criado_em timestamptz not null default now(),
  ultimo_acesso_em timestamptz not null default now(),
  expira_em timestamptz not null default (now() + interval '30 days'),
  revogado_em timestamptz,
  unique (codigo_id, device_id)
);

create index if not exists idx_sessoes_acesso_token_hash
  on public.sessoes_acesso (token_hash);

alter table public.sessoes_acesso enable row level security;
revoke all on table public.sessoes_acesso from public, anon, authenticated;

-- O código administrativo publicado no histórico deve ser considerado
-- comprometido. A remoção é intencional e deve ocorrer antes do frontend novo.
delete from public.codigos_acesso where origem = 'admin';

create or replace function public.ativar_codigo(p_codigo text, p_device_id text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_registro public.codigos_acesso%rowtype;
  v_token text;
begin
  if p_codigo is null or length(trim(p_codigo)) < 8
     or p_device_id is null or length(trim(p_device_id)) < 16 then
    return jsonb_build_object('sucesso', false, 'motivo', 'entrada_invalida');
  end if;

  select * into v_registro
  from public.codigos_acesso
  where codigo = upper(trim(p_codigo))
  for update;

  if not found then
    return jsonb_build_object('sucesso', false, 'motivo', 'codigo_invalido');
  end if;

  if v_registro.status = 'usado' and v_registro.device_id <> p_device_id then
    return jsonb_build_object('sucesso', false, 'motivo', 'codigo_ja_utilizado');
  end if;

  if v_registro.status = 'disponivel' then
    update public.codigos_acesso
    set status = 'usado', device_id = p_device_id, usado_em = now()
    where id = v_registro.id;
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.sessoes_acesso (
    codigo_id, device_id, token_hash, ultimo_acesso_em, expira_em, revogado_em
  )
  values (
    v_registro.id,
    p_device_id,
    extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'),
    now(),
    now() + interval '30 days',
    null
  )
  on conflict (codigo_id, device_id) do update
  set token_hash = excluded.token_hash,
      ultimo_acesso_em = excluded.ultimo_acesso_em,
      expira_em = excluded.expira_em,
      revogado_em = null;

  return jsonb_build_object(
    'sucesso', true,
    'motivo', case when v_registro.status = 'usado'
      then 'sessao_renovada' else 'ativado' end,
    'sessao_token', v_token,
    'expira_em', now() + interval '30 days'
  );
end;
$$;

create or replace function public.validar_sessao(p_token text, p_device_id text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_sessao public.sessoes_acesso%rowtype;
begin
  if p_token is null or length(p_token) <> 64
     or p_device_id is null or length(trim(p_device_id)) < 16 then
    return jsonb_build_object('valida', false, 'motivo', 'sessao_invalida');
  end if;

  select * into v_sessao
  from public.sessoes_acesso
  where token_hash = extensions.digest(convert_to(p_token, 'UTF8'), 'sha256')
    and device_id = p_device_id
  for update;

  if not found or v_sessao.revogado_em is not null then
    return jsonb_build_object('valida', false, 'motivo', 'sessao_invalida');
  end if;

  if v_sessao.expira_em <= now() then
    return jsonb_build_object('valida', false, 'motivo', 'sessao_expirada');
  end if;

  update public.sessoes_acesso
  set ultimo_acesso_em = now(),
      expira_em = now() + interval '30 days'
  where id = v_sessao.id;

  return jsonb_build_object(
    'valida', true,
    'expira_em', now() + interval '30 days'
  );
end;
$$;

create or replace function public.revogar_sessao(p_token text, p_device_id text)
returns boolean
language sql
security definer
set search_path = pg_catalog, public, extensions
as $$
  update public.sessoes_acesso
  set revogado_em = now()
  where token_hash = extensions.digest(convert_to(p_token, 'UTF8'), 'sha256')
    and device_id = p_device_id
    and revogado_em is null
  returning true;
$$;

revoke all on function public.ativar_codigo(text, text) from public, authenticated;
revoke all on function public.validar_sessao(text, text) from public, authenticated;
revoke all on function public.revogar_sessao(text, text) from public, authenticated;

grant execute on function public.ativar_codigo(text, text) to anon;
grant execute on function public.validar_sessao(text, text) to anon;
grant execute on function public.revogar_sessao(text, text) to anon;
