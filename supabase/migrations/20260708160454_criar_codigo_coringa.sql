-- Permite a origem 'admin': código coringa vitalício, de uso exclusivo seu
-- para testar a aplicação em produção, sem nunca ser consumido/expirado.
alter table codigos_acesso drop constraint if exists codigos_acesso_origem_check;
alter table codigos_acesso add constraint codigos_acesso_origem_check
  check (origem in ('manual', 'hotmart', 'admin'));

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

  -- código admin: vitalício, reutilizável em qualquer dispositivo, nunca
  -- marca como usado (permite você testar em produção quantas vezes quiser)
  if v_registro.origem = 'admin' then
    return jsonb_build_object('sucesso', true, 'motivo', 'ativado');
  end if;

  if v_registro.status = 'usado' then
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

grant execute on function ativar_codigo(text, text) to anon;

-- Código coringa vitalício, uso exclusivo do administrador da plataforma
insert into codigos_acesso (codigo, origem)
values ('PEIA-ADMIN-MESTRE', 'admin')
on conflict (codigo) do nothing;
