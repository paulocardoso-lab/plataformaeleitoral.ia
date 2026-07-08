-- Substitui o código coringa antigo (formato irregular PEIA-ADMIN-MESTRE)
-- por um novo no mesmo padrão XXXX-XXXX-XXXX usado pelos demais códigos,
-- para que a máscara automática do campo de ativação funcione igual em
-- todos os casos, sem exceção de formato.
delete from codigos_acesso where codigo = 'PEIA-ADMIN-MESTRE';

insert into codigos_acesso (codigo, origem)
values ('PEIA-ADMN-MSTR', 'admin')
on conflict (codigo) do nothing;
