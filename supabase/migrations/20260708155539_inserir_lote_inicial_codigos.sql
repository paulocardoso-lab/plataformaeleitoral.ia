-- Lote inicial de 10 códigos de acesso para testes e primeiros compradores
insert into codigos_acesso (codigo, origem) values
  ('PEIA-63UA-86TG', 'manual'),
  ('PEIA-SZJY-BSMD', 'manual'),
  ('PEIA-YLE2-33JV', 'manual'),
  ('PEIA-F74R-UEG2', 'manual'),
  ('PEIA-V3GN-N3KA', 'manual'),
  ('PEIA-YEW5-KJ44', 'manual'),
  ('PEIA-6FG2-6TSC', 'manual'),
  ('PEIA-9JL6-9Y8J', 'manual'),
  ('PEIA-NYHZ-FYY9', 'manual'),
  ('PEIA-YK3J-T43U', 'manual')
on conflict (codigo) do nothing;
