insert into codigos_acesso (codigo, origem)
values ('PEIA-TESTE-2', 'manual')
on conflict (codigo) do nothing;
