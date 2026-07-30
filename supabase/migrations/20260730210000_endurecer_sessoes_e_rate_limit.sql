alter table public.tentativas_tester
  add column if not exists ip_hash text,
  add column if not exists device_hash text;

create index if not exists idx_tentativas_tester_ip_data
  on public.tentativas_tester (ip_hash, criado_em desc);
create index if not exists idx_tentativas_tester_device_data
  on public.tentativas_tester (device_hash, criado_em desc);

create or replace function public.ativar_codigo_usuario(p_codigo text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_codigo public.codigos_acesso%rowtype;
  v_codigo_normalizado text := upper(trim(coalesce(p_codigo, '')));
begin
  if v_user_id is null then
    return jsonb_build_object('sucesso', false, 'motivo', 'usuario_nao_autenticado');
  end if;
  if v_codigo_normalizado !~ '^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$' then
    return jsonb_build_object('sucesso', false, 'motivo', 'entrada_invalida');
  end if;
  if exists(select 1 from public.licencas where user_id=v_user_id and status='ativa' and revogada_em is null) then
    return jsonb_build_object('sucesso', true, 'motivo', 'licenca_ja_ativa');
  end if;
  select * into v_codigo from public.codigos_acesso
  where codigo=v_codigo_normalizado for update;
  if not found then
    return jsonb_build_object('sucesso', false, 'motivo', 'codigo_invalido');
  end if;
  if exists(select 1 from public.licencas where codigo_id=v_codigo.id and user_id<>v_user_id) then
    return jsonb_build_object('sucesso', false, 'motivo', 'codigo_ja_utilizado');
  end if;
  if v_codigo.status='usado'
     and not exists(select 1 from public.licencas where codigo_id=v_codigo.id and user_id=v_user_id) then
    return jsonb_build_object('sucesso', false, 'motivo', 'codigo_requer_migracao');
  end if;
  update public.codigos_acesso set status='usado',usado_em=coalesce(usado_em,now())
  where id=v_codigo.id;
  insert into public.licencas(codigo_id,user_id) values(v_codigo.id,v_user_id)
  on conflict (user_id) do update
    set status='ativa',revogada_em=null,ultimo_acesso_em=now();
  return jsonb_build_object('sucesso', true, 'motivo', 'licenca_ativa');
end;
$$;

revoke all on function public.ativar_codigo_usuario(text) from public,anon;
grant execute on function public.ativar_codigo_usuario(text) to authenticated;
