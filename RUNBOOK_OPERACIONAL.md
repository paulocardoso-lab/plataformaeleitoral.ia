# Runbook operacional — PE.IA

## Escopo

Produção: `https://plataformaeleitoral.ia.br`  
Supabase: `rclbjiqfabuuhiwxmjwp`  
Branch de produção: `main`

Nunca registre senha master, token de sessão, service role ou API key em
Git, issues, logs ou capturas de tela.

## Verificação diária

1. Confira o workflow **Production health** no GitHub Actions.
2. Confirme que `/version.json` corresponde à última release.
3. Teste uma consulta autenticada no desktop e no celular.
4. Verifique falhas nas Edge Functions `dataset`, `tester-access` e
   `admin-access`.

Execução manual:

```bash
node scripts/audit-config.mjs
node scripts/healthcheck-production.mjs
```

## Administração de acessos

1. Entre com o e-mail administrador por link mágico.
2. Abra **Administração**.
3. Emita códigos somente na quantidade necessária.
4. Revogue licenças ou sessões individualmente quando possível.
5. Confira a ação na tabela de auditoria.

## Rotação da senha master

1. Abra **Administração > Rotacionar senha master**.
2. Gere uma senha no formato `XXXX-XXXX-XXXX`.
3. Marque a revogação das sessões existentes somente em incidente ou troca
   coordenada.
4. Confirme e guarde a senha em gerenciador seguro.
5. Teste uma sessão e revogue a sessão criada para o teste.

A senha não deve ser enviada por e-mail comum nem incluída no repositório.

## Incidente de acesso

1. Revogue a licença ou sessão afetada no painel.
2. Em caso de exposição da master, rotacione-a e revogue todas as sessões
   tester.
3. Consulte `auditoria_administrativa` e logs das Edge Functions.
4. Preserve horários, IDs e evidências sem copiar tokens.
5. Registre causa, alcance, contenção e prevenção.

## Falha no dataset

1. Confirme o workflow **Production health**.
2. Verifique a Edge Function `dataset` e o bucket privado
   `private-datasets`.
3. Confirme `datasetVersion` em `runtime-config.js` e `version.json`.
4. Não torne o bucket público e não incorpore o dataset no HTML.

## Falha de autenticação por e-mail

1. Confira logs do Supabase Auth.
2. Verifique o limite de e-mails em **Authentication > Rate Limits**.
3. Evite múltiplos reenvios; o SMTP padrão permite apenas dois e-mails por
   hora.
4. Para operação em escala, configure SMTP transacional próprio.

## Rollback

Use `git revert` no commit defeituoso, execute a auditoria e envie para
`main`. Não use `git reset --hard` na branch de produção.

```bash
git revert <commit>
node scripts/audit-config.mjs
git push origin main
```

Migrações de banco devem ser corrigidas por uma nova migration; não edite
uma migration já aplicada.

## Critérios de liberação

- Auditoria e health check aprovados.
- Versão e cache consistentes.
- Dataset exige autorização.
- Administração anônima retorna `403`.
- Teste mobile sem rolagem horizontal.
- Nenhum segredo no diff.
- Release e ressalvas documentadas.
