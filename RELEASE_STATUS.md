# Homologação da release 2.12.1

Data: 30/07/2026  
Produção: `https://plataformaeleitoral.ia.br`

## Aprovado

- Auditoria estática de endpoints, versões, cache e segredos.
- Health check de produção: 20 verificações.
- Sessão tester emitida com validade de 90 dias.
- Dataset autorizado: `200`, versão `tse-ms-2010-2024-v1`.
- Revogação da sessão tester: acesso posterior retorna `401`.
- Administração sem autenticação: `403`.
- Origem externa nas Edge Functions: `403`.
- Rate limit tester: bloqueio por IP e dispositivo.
- Desktop 1280 px: sem overflow horizontal.
- Mobile 390 × 844: sem overflow horizontal.
- Runtime config e versão em estratégia network-first.
- Banner de atualização disponível antes da autenticação.

## Ressalva aberta

O painel administrativo foi publicado e a conta
`girassolinteligencia@gmail.com` existe no Supabase, mas o teste visual
autenticado completo aguarda liberação da cota do SMTP padrão, limitada a dois
e-mails por hora.

Antes de usar ações administrativas em rotina:

1. Solicitar apenas um novo link após a liberação da cota.
2. Confirmar o botão **Administração**.
3. Criar um código descartável.
4. Revogar o acesso criado.
5. Confirmar os dois eventos na auditoria.
6. Gerar uma sugestão de master sem confirmar a rotação.

Essa ressalva não afeta o acesso tester, o dataset nem o bloqueio da API
administrativa para usuários não autorizados.
