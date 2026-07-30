-- Remove a fixture E2E e sua sessão por cascade após o teste positivo.
delete from public.codigos_acesso where codigo = 'AUDT-E2E8-7K4M';
