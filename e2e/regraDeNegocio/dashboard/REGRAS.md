# Regras de Negócio — Dashboard

- **Menu:** Início › Dashboard (`[id="navbar.btn_dashboard"]`)
- **Rota:** `/dashboard` (`dashboard.index`), componente Inertia `TenantDashboard`
- **Automação:** [`dashboard.rn.spec.ts`](./dashboard.rn.spec.ts)
- **Levantamento:** 30/09/2026, homologação, versão 0.1.0. Perfis usados: Super Administrador (`USER_EMAIL`) e Professor restrito (`RESTRICTED_USER_EMAIL`).

**Como as regras foram levantadas:**

- Navegação automatizada com os dois perfis.
- Leitura das props Inertia (`<script data-page="app">`).
- Leitura do componente compilado `build/assets/TenantDashboard-*.js` e do layout `AuthenticatedLayout-*.js`.
- Cada regra tem pelo menos um teste com o mesmo ID.

## Dados que o backend envia (props)

| Prop | Conteúdo | Uso na tela |
|------|----------|-------------|
| `user` | usuário logado (`name`, `ano_id`, `franquias_permitidas`…) | saudação, ano letivo |
| `role` | cargo (`label`) | subtítulo |
| `tenant` | `name` ("Apoio"), tema | subtítulo |
| `counts` | `{alunos, franquias, usuarios, turmas, matriculas, profissionais}` | contadores dos cards |
| `senha` | `{primeiro_acesso, expirada, dias_restantes, deve_trocar}` | alerta de senha |
| `auth.permissions` | lista de permissões | filtro do menu lateral |
| `anos` | anos letivos disponíveis | botão de ano letivo |

## Catálogo

| ID | Regra | Origem | Teste |
|----|-------|--------|-------|
| RN-DASH-01 | `/dashboard` exige sessão. Um visitante sem sessão é redirecionado para `/login`. | Navegação | ✅ |
| RN-DASH-02 | "Dashboard" é o 1º item do menu, na seção **Início**. Não depende de permissão, aparece para qualquer cargo e fica `aria-selected` na rota. Os demais itens só aparecem se o usuário tiver a permissão `*.list` correspondente (ex.: `franquias.list` → Escolas). | Layout (`permission` + `can()`) | ✅ |
| RN-DASH-03 | O título da aba é `Início - <nome da aplicação>` (ex.: "Início - SAAS - Homologação"). | `<Head title="Início">` | ✅ |
| RN-DASH-04 | Breadcrumb: **Dashboard** (link para `/dashboard`) › **Início** (desabilitado, sem link). | Componente | ✅ |
| RN-DASH-05 | A saudação usa a **hora local do navegador**: hora < 12 → "Bom dia"; hora < 18 → "Boa tarde"; caso contrário → "Boa noite". Limites testados: 00:00, 11:59, 12:00, 17:59, 18:00, 23:59. | `new Date().getHours()` | ✅ |
| RN-DASH-06 | A saudação exibe só o **primeiro nome** (`name.split(' ')[0]`). Ex.: "QA Restrito Playwright" → "Boa noite, QA". | Componente | ✅ |
| RN-DASH-07 | O subtítulo é `<tenant> · <cargo>` (ex.: "Apoio · Super Administrador"). Sem cargo, aparece só o nome do tenant. | Componente | ✅ |
| RN-DASH-08 | Alerta de expiração de senha (warning, pode ser fechado, botão **"Alterar agora"** → `/password/change`). Detalhes abaixo. | Componente | ✅ (props simuladas) |
| RN-DASH-09 | Seção **Módulos principais**: 6 cards fixos, nesta ordem: Alunos, Escolas, Usuários, Turmas, Matrículas, Profissionais. Cada card tem ícone, título (h3), descrição, contador + rótulo e `data-testid` `dashboard.card-<modulo>`. | Componente | ✅ |
| RN-DASH-10 | O contador de cada card é igual ao `total` da listagem do módulo. O número aparece sem formatação de milhar, seguido do rótulo (ex.: "245 aluno(s) cadastrado(s)"). | `counts` × paginação das listagens | ✅ |
| RN-DASH-11 | Seção **Acesso rápido**: Cargos ("Perfis de acesso" → `/cargos`) e Permissões ("Autorizações do sistema" → `/permissoes`). | Componente | ✅ |
| RN-DASH-12 | Clicar num card navega (Inertia) para a rota do módulo. | Componente | ✅ |
| RN-DASH-13 | O botão de ano letivo mostra o ano do usuário (`user.ano_id`). A troca faz POST em `update-ano-letivo`. No sucesso, abre o diálogo "Ano letivo alterado" e volta ao dashboard. Na falha, mostra o toast "Não foi possível alterar o ano letivo. Tente novamente." | Layout | ✅ exibição / ⏭️ troca (só existe o ano 2026) |
| RN-DASH-14 | *(esperado)* Cards e atalhos só aparecem se o usuário puder acessar o destino, como já acontece no menu. | Coerência com RN-DASH-02 | ❌ DASH-01 |
| RN-DASH-15 | *(esperado)* Os contadores não expõem totais de módulos sem permissão `.list`. | Segurança | ❌ DASH-02 |

### Detalhe da RN-DASH-08 (alerta de senha)

| `primeiro_acesso` | `expirada` | `dias_restantes` | Alerta | Mensagem |
|---|---|---|---|---|
| `true` | qualquer | qualquer | não | — |
| `false` | `true` | qualquer | sim | "Sua senha expirou. Altere-a para continuar utilizando o sistema." |
| `false` | `false` | 1 | sim | "Sua senha expira em 1 **dia**. Altere-a para não perder o acesso." |
| `false` | `false` | 2 a 15 | sim | "Sua senha expira em N **dias**. Altere-a para não perder o acesso." |
| `false` | `false` | 0 ou ≥ 16 | não | — |

O teste reescreve a prop `senha` na resposta HTML do `/dashboard` (`page.route`). Assim os estados de expiração são simulados sem alterar o usuário no servidor.

## Defeitos encontrados

| ID | Severidade | Descrição | Evidência |
|----|------------|-----------|-----------|
| DASH-01 | **Alta** | Os cards e atalhos do dashboard não respeitam permissões. O Professor (4 itens no menu) vê os 6 cards e os 2 atalhos. 7 dos 8 destinos respondem **HTTP 403**: `/alunos`, `/franquias`, `/usuarios`, `/matriculas`, `/profissionais`, `/cargos`, `/permissoes`. Só `/turmas` é permitido. | RN-DASH-14 (`test.fail`) |
| DASH-02 | **Média** (exposição de dados) | A prop `counts` traz os totais globais do tenant para qualquer cargo. O Professor vê 61 usuários, 42 profissionais e 188 matrículas sem ter permissão de listar esses módulos. | RN-DASH-15 (`test.fail`) |
| DASH-03 | Baixa (exposição de informação) | O payload da página traz o `ziggy` completo (321 rotas), com rotas `central.*`, webhooks e IPs internos (`192.168.0.x`) no `wheres`. Traz também o objeto `user`/`role` com a lista completa de permissões duplicada (~48 KB). | Inspeção das props. Sem teste automatizado. |

## Observações de ambiente

- **O servidor não responde ao Chromium headless**: a navegação fica pendente até o timeout. Os testes funcionam em modo headed (`headless: false`, já definido no `playwright.config.ts`). Isso é relevante para rodar em CI.
- A homologação oscila no carregamento (picos acima de 30 s). O spec usa timeout de 90 s por teste e `waitUntil: 'domcontentloaded'`.
- Dados no levantamento: 245 alunos, 1 escola, 61 usuários ativos, 7 turmas, 188 matrículas ativas, 42 profissionais, 1 ano letivo (2026).

## Execução

```bash
npx playwright test e2e/regraDeNegocio/dashboard --workers=1
```

Resultado em 30/09/2026: **29 passaram**, incluindo os 2 `test.fail` dos defeitos DASH-01 e DASH-02, e **1 foi pulado** (troca de ano letivo).
