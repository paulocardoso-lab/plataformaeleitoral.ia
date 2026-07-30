-- Fixture efêmera para validar o fluxo positivo ponta a ponta da versão 2.8.
insert into public.codigos_acesso (codigo, origem)
values ('AUDT-E2E8-7K4M', 'manual')
on conflict (codigo) do nothing;
