# Status de liberação — versão pública 1.13.1

- Data: 01/08/2026
- Produção: `https://plataformaeleitoral.ia.br`
- Cache: `v76`
- Dataset: `tse-ms-2010-2024-v1`

## Estado atual

- Health check de produção aprovado em 20 verificações.
- Compradores e contas licenciadas entram por link mágico sem código.
- A jornada do comprador exibe campo, botão e passo a passo em sequência direta.
- Convite direto permanece recolhido sob envelope neon e dispensa confirmação por e-mail.
- Compra usa Supabase Auth; convite direto usa sessão opaca, vinculada ao dispositivo, com expiração e revogação.
- Mensagens de envio concluído usam verde de sucesso e erros preservam o estado de alerta.
- Painel administrativo responsivo para celular, com cartões e ações adaptadas ao toque.
- Tela “Sobre” contém compartilhamento comercial, assinatura institucional e saída segura.
- Dataset privado exige licença ou sessão administrativa válida.
- Login orientado ao comprador, com primeira ativação por convite em fluxo secundário próprio.
- Simulador aplica limites independentes por partido ou federação e valida cotas de gênero na lista global e por partido federado.
- Etapa 3 oferece Painel das Listas com cards em tempo real, revisão visual e marcação explícita de conclusão.
- O simulador separa o reinício geral da exclusão individual de listas, exige confirmação e permite desfazer a última ação.
- Cards e controles de exclusão usam apresentação visual mais discreta.
- Modais de exclusão e reinício exibem uma única decisão por vez, com dimensões compactas e ações específicas.
- Tela “Sobre” comunica somente o compartilhamento de links, mantendo a exportação de imagens desabilitada.
- Repositório de produção sincronizado com a branch `main`.

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
