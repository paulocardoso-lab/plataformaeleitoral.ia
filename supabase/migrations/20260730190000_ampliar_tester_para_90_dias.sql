create or replace function public.emitir_sessao_tester(p_device_id text)
returns jsonb language plpgsql security definer
set search_path=pg_catalog,public,extensions
as $$
declare v_codigo_id uuid; v_token text; v_limite timestamptz:=now()+interval '90 days';
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
revoke all on function public.emitir_sessao_tester(text) from public,anon,authenticated;
grant execute on function public.emitir_sessao_tester(text) to service_role;
