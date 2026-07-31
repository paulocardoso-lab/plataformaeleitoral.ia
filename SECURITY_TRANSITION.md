# Transição de autenticação e proteção dos dados

## Registro histórico e estado atual

As referências `2.7`, `2.8` e `2.9` abaixo pertencem à numeração interna anterior. A linha pública atual usa versionamento semântico iniciado em `1.0.0`.

O frontend 2.7.0 substitui a flag booleana por um token opaco. A migration
`20260730120000_criar_sessoes_acesso.sql`:

- guarda somente SHA-256 do token;
- vincula sessão ao código e device ID;
- expira sessões após 30 dias, com renovação durante validação;
- permite revogação;
- remove códigos de origem `admin`, considerados comprometidos.

O cliente revalida a sessão no boot. Não existe tolerância de autorização offline: autenticação e download do dataset protegido exigem conexão. O PWA armazena apenas a estrutura pública e os recursos estáticos.

Na versão 2.8.0, o dataset deixa o HTML e passa para o bucket privado
`private-datasets`. A Edge Function `dataset` valida token + device ID antes de
entregar a versão solicitada. A resposta usa `private, no-store`; o cache
offline é criado explicitamente no dispositivo autorizado e apagado no logout.

O device ID continua sendo um identificador controlado pelo cliente. A próxima
evolução de identidade foi iniciada na versão 2.9 com Supabase Auth por link
mágico. O device ID permanece somente no caminho tester e no legado temporário.

## Modelo híbrido 2.9

- `auth.users` + `licencas`: acesso principal, recuperável em mobile e desktop.
- `tester-access`: valida a master por hash constante, aplica rate limit e emite
  sessão com validade máxima de 90 dias.
- O dataset aceita somente JWT de usuário licenciado ou token tester válido.
- Sessões legadas 2.8 foram revogadas e a RPC anônima antiga foi removida.

## Ordem obrigatória de implantação

1. Fazer backup da tabela `codigos_acesso`.
2. Auditar códigos administrativos e códigos publicados.
3. Aplicar `20260730110000_endurecer_permissoes_ativacao.sql`.
4. Aplicar `20260730120000_criar_sessoes_acesso.sql`.
5. Testar `ativar_codigo` e `validar_sessao` diretamente no Supabase.
6. Publicar o frontend 2.7.0.
7. Criar o bucket privado e enviar o dataset versionado.
8. Implantar a Edge Function `dataset` com `verify_jwt=false`.
9. Publicar o frontend 2.8.0.
10. Confirmar `version.json`, headers, CSP e Service Worker v24 em produção.

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

Implementado:

1. shell público sem dataset;
2. bucket privado sem policies para `anon` ou `authenticated`;
3. entrega mediada por função com sessão revogável;
4. resposta do dataset marcada como privada e `no-store`;
5. ausência de persistência do dataset no Cache Storage.

## Critérios de conclusão

- Alterar `localStorage` não permite baixar o dataset protegido.
- Revogação no backend bloqueia nova leitura em todos os dispositivos.
- Mobile e desktop usam a mesma identidade e a mesma licença.
- A versão do dataset aparece em `version.json` e nos logs de acesso.
- Nenhum código administrativo ou service-role secret existe no Git.
