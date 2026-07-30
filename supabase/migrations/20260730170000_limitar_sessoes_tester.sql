create or replace function public.validar_sessao(p_token text, p_device_id text)
returns jsonb language plpgsql security definer
set search_path=pg_catalog,public,extensions
as $$
declare v public.sessoes_acesso%rowtype; v_nova_expiracao timestamptz;
begin
  if p_token is null or length(p_token)<>64 or p_device_id is null then
    return jsonb_build_object('valida',false,'motivo','sessao_invalida');
  end if;
  select * into v from public.sessoes_acesso
  where token_hash=extensions.digest(convert_to(p_token,'UTF8'),'sha256')
    and device_id=p_device_id for update;
  if not found or v.revogado_em is not null then
    return jsonb_build_object('valida',false,'motivo','sessao_invalida');
  end if;
  if v.expira_em<=now() or (v.expiracao_maxima is not null and v.expiracao_maxima<=now()) then
    return jsonb_build_object('valida',false,'motivo','sessao_expirada');
  end if;
  v_nova_expiracao:=least(now()+interval '30 days',coalesce(v.expiracao_maxima,now()+interval '30 days'));
  update public.sessoes_acesso set ultimo_acesso_em=now(),expira_em=v_nova_expiracao where id=v.id;
  return jsonb_build_object('valida',true,'tipo',v.tipo,'expira_em',v_nova_expiracao);
end;
$$;
revoke all on function public.validar_sessao(text,text) from public,authenticated;
grant execute on function public.validar_sessao(text,text) to anon;
