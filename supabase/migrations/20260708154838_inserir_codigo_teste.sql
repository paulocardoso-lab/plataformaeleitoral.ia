-- Código de teste para validar o fluxo de ativação (remover depois dos testes)
insert into codigos_acesso (codigo, origem)
values ('TESTE-0001', 'manual')
on conflict (codigo) do nothing;
