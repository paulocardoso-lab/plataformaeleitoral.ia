-- Hardening não destrutivo da RPC atual.
-- Não corrige a ausência de sessão: apenas reduz permissões implícitas e
-- fixa a resolução de objetos usados pela função SECURITY DEFINER.

revoke all on function public.ativar_codigo(text, text) from public;
revoke all on function public.ativar_codigo(text, text) from authenticated;
grant execute on function public.ativar_codigo(text, text) to anon;

alter function public.ativar_codigo(text, text)
  set search_path = pg_catalog, public;

revoke all on table public.codigos_acesso from anon, authenticated;
