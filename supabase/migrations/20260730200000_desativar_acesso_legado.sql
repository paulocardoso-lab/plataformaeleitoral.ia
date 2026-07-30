-- Corte definitivo do modelo 2.8. Usuários devem usar Auth ou nova sessão tester.
update public.sessoes_acesso
set revogado_em=coalesce(revogado_em,now())
where tipo='legado';

revoke all on function public.ativar_codigo(text,text) from public,anon,authenticated;
drop function if exists public.ativar_codigo(text,text);

revoke all on function public.migrar_sessao_usuario(text) from public,anon,authenticated;
drop function if exists public.migrar_sessao_usuario(text);
