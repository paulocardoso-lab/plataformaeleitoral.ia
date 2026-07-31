# Status de liberação — versão pública 1.8.2

- Data: 31/07/2026
- Produção: `https://plataformaeleitoral.ia.br`
- Cache: `v68`
- Dataset: `tse-ms-2010-2024-v1`

## Estado atual

- Health check de produção aprovado em 20 verificações.
- Compradores e contas licenciadas entram por link mágico sem código.
- Código-convite permanece separado e exige confirmação prévia do e-mail.
- Painel administrativo responsivo para celular, com cartões e ações adaptadas ao toque.
- Tela “Sobre” contém compartilhamento comercial, assinatura institucional e saída segura.
- Dataset privado exige licença ou sessão administrativa válida.
- Repositório de produção sincronizado com `main` no commit `fd4afb7`.

## Ressalva operacional

O projeto continua usando o SMTP padrão do Supabase. A integração com Resend foi
avaliada, mas não foi configurada. Permanecem aplicáveis o limite baixo de envio
e a recomendação de evitar solicitações repetidas de link mágico.

---

## Registro histórico de homologação — versão interna 2.12.1

> Registro preservado da homologação anterior à adoção da linha pública `1.x`.

Data: 30/07/2026  
Produção: `https://plataformaeleitoral.ia.br`

## Aprovado

- Auditoria estática de endpoints, versões, cache e segredos.
- Health check de produção: 20 verificações.
- Sessão do Modo admin emitida com validade de 90 dias.
- Dataset autorizado: `200`, versão `tse-ms-2010-2024-v1`.
- Revogação da sessão administrativa: acesso posterior retorna `401`.
- Administração sem autenticação: `403`.
- Origem externa nas Edge Functions: `403`.
- Rate limit do Modo admin: bloqueio por IP e dispositivo.
- Desktop 1280 px: sem overflow horizontal.
- Mobile 390 × 844: sem overflow horizontal.
- Runtime config e versão em estratégia network-first.
- Banner de atualização disponível antes da autenticação.

## Ressalva registrada naquele ciclo

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

Essa ressalva não afeta o Modo admin, o dataset nem o bloqueio da API
administrativa para usuários não autorizados.
