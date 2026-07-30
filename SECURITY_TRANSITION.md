# Transição de autenticação e proteção dos dados

## Estado desta entrega

O frontend 2.7.0 substitui a flag booleana por um token opaco. A migration
`20260730120000_criar_sessoes_acesso.sql`:

- guarda somente SHA-256 do token;
- vincula sessão ao código e device ID;
- expira sessões após 30 dias, com renovação durante validação;
- permite revogação;
- remove códigos de origem `admin`, considerados comprometidos.

O cliente revalida a sessão no boot quando está online. Para preservar o PWA,
existe uma tolerância offline de 168 horas após a última validação.

Isso ainda não protege o dataset: ele permanece no HTML público. O device ID
também continua sendo um identificador controlado pelo cliente.

## Ordem obrigatória de implantação

1. Fazer backup da tabela `codigos_acesso`.
2. Auditar códigos administrativos e códigos publicados.
3. Aplicar `20260730110000_endurecer_permissoes_ativacao.sql`.
4. Aplicar `20260730120000_criar_sessoes_acesso.sql`.
5. Testar `ativar_codigo` e `validar_sessao` diretamente no Supabase.
6. Publicar o frontend 2.7.0.
7. Confirmar `version.json`, headers, CSP e Service Worker v23 em produção.

Publicar o frontend antes das migrations fará ativações antigas retornarem
sucesso sem `sessao_token`; o cliente recusará esse resultado por segurança.

## Ações obrigatórias antes de uma sessão real

1. Revogar no banco todos os códigos administrativos ou publicados no histórico Git.
2. Definir a política comercial:
   - uma licença por usuário;
   - limite de dispositivos;
   - prazo e regras de revogação.
3. Escolher um provedor de identidade. A recomendação natural é Supabase Auth.
4. Criar uma tabela de licenças ligada a `auth.users`, sem aceitar identidade de dispositivo como prova de autorização.
5. Mover a ativação para uma Edge Function ou RPC chamada por usuário autenticado.
6. Migrar usuários existentes da sessão opaca para Supabase Auth.

## Proteção do dataset

Enquanto o dataset permanecer em `index.html`, a tela de ativação não é uma barreira de segurança. Para conteúdo realmente restrito:

1. publicar o shell do aplicativo sem o dataset;
2. armazenar o dataset versionado em bucket privado;
3. emitir URL assinada curta somente após autorização;
4. validar `datasetVersion` antes de reutilizar Cache Storage;
5. revogar URLs e sessão quando a licença for revogada.

## Critérios de conclusão

- Alterar `localStorage` não libera conteúdo protegido quando online.
- Revogação no backend bloqueia nova leitura em todos os dispositivos.
- Mobile e desktop usam a mesma identidade e a mesma licença.
- A versão do dataset aparece em `version.json` e nos logs de acesso.
- Nenhum código administrativo ou service-role secret existe no Git.
