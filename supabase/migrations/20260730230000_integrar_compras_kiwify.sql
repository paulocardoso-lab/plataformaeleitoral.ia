-- Autorizações comerciais da Kiwify. Somente service_role escreve eventos;
-- o comprador autenticado apenas reivindica uma compra pelo próprio e-mail.
create table if not exists public.produtos_comerciais (
  plataforma text not null,
  produto_id text not null,
  nome text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  primary key (plataforma, produto_id)
);

insert into public.produtos_comerciais(plataforma, produto_id, nome)
values (
  'kiwify',
  'd35c0dd0-8c4a-11f1-bc39-5f4458e00388',
  'PE.IA — Plataforma Eleitoral Inteligente'
)
on conflict (plataforma, produto_id) do update
set nome=excluded.nome, ativo=true;

create table if not exists public.pedidos_comerciais (
  id uuid primary key default gen_random_uuid(),
  plataforma text not null,
  pedido_id text not null,
  produto_id text not null,
  comprador_email text not null check (comprador_email=lower(trim(comprador_email))),
  status text not null check (status in ('ativo','reembolsado','chargeback','revogado')),
  aprovado_em timestamptz,
  encerrado_em timestamptz,
  reivindicado_por uuid references auth.users(id) on delete set null,
  reivindicado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (plataforma, pedido_id),
  foreign key (plataforma, produto_id)
    references public.produtos_comerciais(plataforma, produto_id) on delete restrict
);

create index if not exists idx_pedidos_comerciais_email_status
  on public.pedidos_comerciais(comprador_email, status);

create table if not exists public.eventos_comerciais (
  id bigint generated always as identity primary key,
  plataforma text not null,
  pedido_id text not null,
  tipo_evento text not null,
  status_pedido text,
  recebido_em timestamptz not null default now(),
  unique (plataforma, pedido_id, tipo_evento)
);

alter table public.produtos_comerciais enable row level security;
alter table public.pedidos_comerciais enable row level security;
alter table public.eventos_comerciais enable row level security;
revoke all on table public.produtos_comerciais from public, anon, authenticated;
revoke all on table public.pedidos_comerciais from public, anon, authenticated;
revoke all on table public.eventos_comerciais from public, anon, authenticated;

alter table public.codigos_acesso drop constraint if exists codigos_acesso_origem_check;
alter table public.codigos_acesso add constraint codigos_acesso_origem_check
  check (origem in ('manual', 'hotmart', 'kiwify', 'admin', 'tester'));

alter table public.licencas
  add column if not exists pedido_comercial_id uuid
    references public.pedidos_comerciais(id) on delete restrict;
create unique index if not exists idx_licencas_pedido_comercial
  on public.licencas(pedido_comercial_id)
  where pedido_comercial_id is not null;

create or replace function public.registrar_evento_comercial(
  p_plataforma text,
  p_pedido_id text,
  p_produto_id text,
  p_email text,
  p_tipo_evento text,
  p_status_pedido text,
  p_acao text,
  p_aprovado_em timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare
  v_email text:=lower(trim(coalesce(p_email,'')));
  v_pedido public.pedidos_comerciais%rowtype;
  v_evento_id bigint;
begin
  if current_user not in ('postgres','service_role','supabase_admin') then
    raise exception 'forbidden';
  end if;
  if p_plataforma<>'kiwify'
     or length(coalesce(p_pedido_id,''))<8
     or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     or p_acao not in ('aprovar','reembolsar','chargeback') then
    return jsonb_build_object('sucesso',false,'motivo','entrada_invalida');
  end if;
  if not exists(
    select 1 from public.produtos_comerciais
    where plataforma=p_plataforma and produto_id=p_produto_id and ativo=true
  ) then
    return jsonb_build_object('sucesso',false,'motivo','produto_nao_autorizado');
  end if;

  insert into public.eventos_comerciais(
    plataforma,pedido_id,tipo_evento,status_pedido
  ) values (
    p_plataforma,p_pedido_id,p_tipo_evento,p_status_pedido
  )
  on conflict (plataforma,pedido_id,tipo_evento) do nothing
  returning id into v_evento_id;
  if v_evento_id is null then
    return jsonb_build_object('sucesso',true,'motivo','evento_duplicado');
  end if;

  if p_acao='aprovar' then
    insert into public.pedidos_comerciais(
      plataforma,pedido_id,produto_id,comprador_email,status,aprovado_em
    ) values (
      p_plataforma,p_pedido_id,p_produto_id,v_email,'ativo',p_aprovado_em
    )
    on conflict (plataforma,pedido_id) do update
      set comprador_email=excluded.comprador_email,
          aprovado_em=coalesce(public.pedidos_comerciais.aprovado_em,excluded.aprovado_em),
          atualizado_em=now(),
          status=case
            when public.pedidos_comerciais.status in ('reembolsado','chargeback','revogado')
              then public.pedidos_comerciais.status
            else 'ativo'
          end
    returning * into v_pedido;
  else
    insert into public.pedidos_comerciais(
      plataforma,pedido_id,produto_id,comprador_email,status,encerrado_em
    ) values (
      p_plataforma,p_pedido_id,p_produto_id,v_email,
      case when p_acao='chargeback' then 'chargeback' else 'reembolsado' end,now()
    )
    on conflict (plataforma,pedido_id) do update
      set status=case
            when p_acao='chargeback'
              or public.pedidos_comerciais.status='chargeback' then 'chargeback'
            else 'reembolsado'
          end,
          encerrado_em=coalesce(public.pedidos_comerciais.encerrado_em,now()),
          atualizado_em=now()
    returning * into v_pedido;
    update public.licencas
      set status='revogada',revogada_em=coalesce(revogada_em,now())
      where pedido_comercial_id=v_pedido.id
        and status='ativa' and revogada_em is null;
  end if;
  return jsonb_build_object('sucesso',true,'motivo','evento_processado');
end;
$$;

create or replace function public.reivindicar_compra_usuario()
returns jsonb
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare
  v_user_id uuid:=auth.uid();
  v_email text;
  v_pedido public.pedidos_comerciais%rowtype;
  v_codigo_id uuid;
  v_codigo text;
begin
  if v_user_id is null then
    return jsonb_build_object('sucesso',false,'motivo','usuario_nao_autenticado');
  end if;
  if exists(
    select 1 from public.licencas
    where user_id=v_user_id and status='ativa' and revogada_em is null
  ) then
    return jsonb_build_object('sucesso',true,'motivo','licenca_ja_ativa');
  end if;
  select lower(trim(email)) into v_email from auth.users where id=v_user_id;
  if v_email is null then
    return jsonb_build_object('sucesso',false,'motivo','email_indisponivel');
  end if;

  select * into v_pedido
  from public.pedidos_comerciais
  where comprador_email=v_email and status='ativo'
    and (reivindicado_por is null or reivindicado_por=v_user_id)
  order by aprovado_em asc nulls last,criado_em asc
  limit 1 for update;
  if not found then
    return jsonb_build_object('sucesso',false,'motivo','compra_ativa_nao_encontrada');
  end if;

  v_codigo:=upper(substr(md5('kiwify:'||v_pedido.pedido_id),1,4)||'-'||
                  substr(md5('kiwify:'||v_pedido.pedido_id),5,4)||'-'||
                  substr(md5('kiwify:'||v_pedido.pedido_id),9,4));
  insert into public.codigos_acesso(codigo,origem,status,usado_em)
  values(v_codigo,'kiwify','usado',now())
  on conflict (codigo) do update set usado_em=coalesce(public.codigos_acesso.usado_em,now())
  returning id into v_codigo_id;

  insert into public.licencas(codigo_id,user_id,pedido_comercial_id)
  values(v_codigo_id,v_user_id,v_pedido.id)
  on conflict (user_id) do update
    set codigo_id=excluded.codigo_id,pedido_comercial_id=excluded.pedido_comercial_id,
        status='ativa',revogada_em=null,ultimo_acesso_em=now();
  update public.pedidos_comerciais
    set reivindicado_por=v_user_id,reivindicado_em=coalesce(reivindicado_em,now()),
        atualizado_em=now()
    where id=v_pedido.id;
  return jsonb_build_object('sucesso',true,'motivo','compra_reivindicada');
end;
$$;

create or replace function public.possui_licenca()
returns boolean
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
begin
  if auth.uid() is null then return false; end if;
  if not exists(
    select 1 from public.licencas
    where user_id=auth.uid() and status='ativa' and revogada_em is null
  ) then
    perform public.reivindicar_compra_usuario();
  end if;
  return exists(
    select 1 from public.licencas
    where user_id=auth.uid() and status='ativa' and revogada_em is null
  );
end;
$$;

revoke all on function public.registrar_evento_comercial(
  text,text,text,text,text,text,text,timestamptz
) from public,anon,authenticated;
grant execute on function public.registrar_evento_comercial(
  text,text,text,text,text,text,text,timestamptz
) to service_role;
revoke all on function public.reivindicar_compra_usuario() from public,anon;
grant execute on function public.reivindicar_compra_usuario() to authenticated;
revoke all on function public.possui_licenca() from public,anon;
grant execute on function public.possui_licenca() to authenticated;
