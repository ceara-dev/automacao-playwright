---
name: mapear-regras-negocio
description: Mapeia e cataloga as regras de negócio de um módulo do menu lateral do SaaS Apoio (homologação). Gera e2e/regraDeNegocio/<modulo>/REGRAS.md com IDs RN-<MÓD>-NN e um spec Playwright com um teste por regra. Use quando o usuário pedir para mapear, levantar ou catalogar regras de negócio de um módulo (ex.: "/mapear-regras-negocio Escolas").
argument-hint: <nome do módulo no menu lateral, ex.: Escolas>
---

# Mapear regras de negócio de um módulo

Módulo alvo: **$ARGUMENTS**

Referência pronta, que deve ser seguida como modelo de formato e profundidade:
`e2e/regraDeNegocio/dashboard/REGRAS.md` e `e2e/regraDeNegocio/dashboard/dashboard.rn.spec.ts`.

## Premissas do ambiente

- Base: `http://veramendes.local`. O front é Vue 3 + Vuetify + **Inertia** (Laravel).
- O servidor **não responde a Chromium headless**. Use sempre `headless: false`.
- A homologação é lenta. Use `waitUntil: 'domcontentloaded'`, `test.describe.configure({ timeout: 90_000 })` e rode com `--workers=1`.
- Perfis: `USER_EMAIL` (Super Administrador, sessão em `e2e/.auth/user.json`) e `RESTRICTED_USER_EMAIL` (Professor restrito a 1 escola), ambos no `.env`.
- Nunca altere dados reais para simular um estado. Intercepte as props (passo 4).

## Passo a passo

### 1. Localizar o módulo
- Encontre a rota e o id do item em `docs/mapeamento-dashboard.md` (tabela do menu: `navbar.btn_<slug>` → rota).
- Garanta uma sessão válida: `npx playwright test --project=setup --workers=1`.

### 2. Explorar com os dois perfis

```bash
node .claude/skills/mapear-regras-negocio/scripts/explorar.js <rota> admin
node .claude/skills/mapear-regras-negocio/scripts/explorar.js <rota> restrito
```

O script gera, em `.regras-tmp/<slug>-<perfil>/`:

| Arquivo | Uso |
|---|---|
| `aria.yaml` | estrutura acessível da tela, base para os locators `getByRole` |
| `props.json` | props Inertia completas: dados que o backend envia, `auth.permissions`, `counts`… |
| `componente.js` | **código-fonte compilado do componente Vue**: principal fonte das regras |
| `layout.js` | menu lateral: a `permission` exigida por item |
| `resumo.txt` | componente, props, permissões e **status HTTP de cada link** do `<main>` para o perfil |

Se o perfil restrito receber 403 na rota, isso já é uma regra de acesso. Registre.

### 3. Extrair as regras do `componente.js`
Leia o componente inteiro e procure por:
- **`computed` / condicionais** (`? :`, `v-if` → `key: 0 ... : y("", !0)`): regras de exibição e seus limites. Anote os valores exatos (ex.: `dias_restantes <= 15`).
- **Textos literais**: mensagens, rótulos, singular/plural, placeholders, títulos (`<Head title>`).
- **`props`** declaradas (`required`, `default`) e de onde vem cada valor exibido.
- **`route("...")`**: destinos de links e botões.
- **Formulários**: `useForm`, `.post/.put/.delete(route(...))`, validações no cliente, `rules`, `maxlength`, máscaras, campos obrigatórios, mensagens de erro e sucesso (toasts).
- **Permissões**: `can(`, `canAny(`, `canAll(`, `usePermissions`. Compare o que o front esconde com o que o backend libera (status do passo 2).
- **`data-testid`** e `id` estáveis, para os locators.
- Para ações que chamam o backend (salvar, excluir, filtrar), observe a validação real no navegador. Use dados de teste identificáveis (prefixo `QA-`) e limpe o que criar.

### 4. Validar cada regra com evidência
- **Contadores e totais**: compare com o `total` da paginação da listagem (`props.<modulo>.total`).
- **Horário/data**: `page.clock.setFixedTime(...)` antes do `goto`, testando os limites (ex.: 11:59 / 12:00).
- **Estados difíceis de reproduzir** (senha expirando, flags): reescreva a prop no HTML com `page.route` + `route.fetch()` + `route.fulfill()`. Veja `simularSenha()` no spec do dashboard. Escape `<` como `<` ao re-serializar.
- **Permissão**: logue com o perfil restrito e chame `fetch(url, { redirect: 'manual' })` para cada link/ação visível.
- **Segurança/exposição**: veja se as props trazem dados que o perfil não deveria ver.

### 5. Escrever os artefatos
Crie `e2e/regraDeNegocio/<modulo>/`:

- **`REGRAS.md`**, com as seções:
  1. Cabeçalho (menu, rota, componente, data, perfis, técnica usada);
  2. Tabela de props;
  3. **Catálogo** `| ID | Regra | Origem | Teste |`, com IDs `RN-<MÓD>-NN` e sigla curta do módulo (ex.: ESC, ALU, TUR);
  4. Tabelas de decisão para regras com vários casos;
  5. **Defeitos** `| ID | Severidade | Descrição | Evidência |`, com IDs `<MÓD>-NN`;
  6. Observações de ambiente;
  7. Comando de execução e resultado.
- **`<modulo>.rn.spec.ts`**:
  - cada `test`/`describe` começa com o ID da regra;
  - locators com `getByRole` primeiro;
  - regra esperada, mas quebrada: `test.fail(true, 'DEFEITO <MÓD>-NN: ...')`;
  - sem dados de teste: `test.skip(true, 'Sem dados de teste: ...')`.
- Separe claramente **regra observada** (comportamento atual) de **regra esperada** (marcada como *(esperado)* e ligada a um defeito).
- Liste o que **não** foi possível verificar (regras só do backend, falta de massa de dados).

### Lições aprendidas (Dashboard, Escolas)
- **Subcomponentes:** o `componente.js` importa outros chunks (`./EnderecoFields-*.js`, `./useCep-*.js`, `ModalConfirmation-*.js`…). Baixe-os de `build/assets/` e formate com `npx prettier@3 --parser babel < arquivo`. Muitas regras (máscaras, cascatas, validação de upload, textos de toast em `messages-*.js`) estão neles.
- **Máscaras:** procure diretivas `[[M(L), "##.###-###"]]` e compare com `maxlength` e com a regra do backend. No Escolas, máscara de 18 caracteres com `maxlength=14` impedia salvar o CNPJ.
- **Validação do backend sem criar dados:** envie o formulário com um obrigatório vazio (ex.: nome) e os campos sob teste preenchidos com valores inválidos. A contagem do toast "Por favor, corrija N campos" revela quais valores inválidos foram **aceitos**.
- **Componentes compartilhados** (modal de exclusão, mensagens) costumam ter texto fixo de outro módulo. Confira o texto exibido.
- **Locators de texto:** o Vue deixa espaços nas pontas do texto. Não use `^`/`$` em regex de `getByText`/`toContainText`.
- **Suítes longas** (> 10 min na homologação): rode com `run_in_background` e grave o log em `.regras-tmp/`.
- **Validação via chamada Inertia direta** (mais rápida e precisa que a tela): `fetch` com os headers `X-Inertia: true`, `X-Inertia-Version`, `X-XSRF-TOKEN`, `X-Requested-With` **e `Accept: text/html, application/xhtml+xml`**. Sem o `Accept`, o Laravel responde 422 JSON com as mensagens em arrays. A resposta traz `props.errors` e `props.flash`. Deixe sempre um obrigatório ausente para que nada seja criado. Primeiro envie `{}` para descobrir quais campos são obrigatórios: no Circuito de Notas, o nome **não** era.
- **Texto colado e v-select:** o Vue junta rótulo e valor ("Média Aprovação7.00"); use regex com `\s*`. O valor de um v-select fica no `<input role="combobox">` (`toHaveValue`). Numa linha de tabela há dois elementos com papel combobox, então use `locator('input[role="combobox"]')`.
- **Efeitos colaterais:** ações como Exportar criam registros em outro lugar (modelos). Limpe também esses registros, e localize os registros `QA-` pela **listagem completa** (paginando), porque a busca pode não procurar pelo nome. Faça a limpeza num `test.afterAll` com contexto próprio (`browser.newContext({ storageState, baseURL })`), que roda mesmo após timeout.
- **Nunca toque nos registros reais.** Na exclusão, teste o modal e **cancele**. O ciclo completo usa um registro `QA-<nome> <timestamp>`, com limpeza no `finally`.

### 6. Rodar e registrar

```bash
npx playwright test e2e/regraDeNegocio/<modulo> --workers=1
```

- Se falhar por timeout, reexecute antes de concluir que é defeito. A homologação oscila.
- Atualize a tabela de módulos em `e2e/regraDeNegocio/README.md` (regras / defeitos).
- Acrescente o resumo de defeitos do módulo na seção "Regras de negócio" do `AGENTS.md`.
- Informe ao usuário: regras catalogadas, defeitos (com severidade), o que ficou sem verificação e o resultado da execução.
