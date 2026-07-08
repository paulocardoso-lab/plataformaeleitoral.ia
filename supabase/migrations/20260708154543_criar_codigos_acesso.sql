-- Tabela de códigos de acesso para liberação da plataforma (venda via Hotmart)
create table if not exists codigos_acesso (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  status text not null default 'disponivel' check (status in ('disponivel', 'usado')),
  device_id text,
  criado_em timestamptz not null default now(),
  usado_em timestamptz,
  origem text not null default 'manual' check (origem in ('manual', 'hotmart'))
);

create index if not exists idx_codigos_acesso_codigo on codigos_acesso (codigo);

alter table codigos_acesso enable row level security;

-- Nenhuma política de SELECT/UPDATE direto é criada de propósito: o app nunca
-- lê ou escreve na tabela diretamente com a chave anon, apenas através da
-- function ativar_codigo() abaixo (SECURITY DEFINER), que aplica a regra de
-- negócio (1 dispositivo por código) de forma atômica e auditável.

create or replace function ativar_codigo(p_codigo text, p_device_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registro codigos_acesso%rowtype;
begin
  select * into v_registro
  from codigos_acesso
  where codigo = p_codigo
  for update;

  if not found then
    return jsonb_build_object('sucesso', false, 'motivo', 'codigo_invalido');
  end if;

  if v_registro.status = 'usado' then
    -- já ativado neste mesmo dispositivo: trata como sucesso (idempotente),
    -- permitindo reinstalar o app/limpar cache sem perder o acesso
    if v_registro.device_id = p_device_id then
      return jsonb_build_object('sucesso', true, 'motivo', 'ja_ativo_neste_dispositivo');
    end if;
    return jsonb_build_object('sucesso', false, 'motivo', 'codigo_ja_utilizado');
  end if;

  update codigos_acesso
  set status = 'usado', device_id = p_device_id, usado_em = now()
  where id = v_registro.id;

  return jsonb_build_object('sucesso', true, 'motivo', 'ativado');
end;
$$;

-- Permite que o público (chave anon) execute apenas esta function específica,
-- nunca acessando a tabela diretamente.
grant execute on function ativar_codigo(text, text) to anon;
