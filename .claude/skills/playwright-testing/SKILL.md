---
name: playwright-testing
description: Implementa e mantém testes E2E com Playwright no projeto QA do SaaS Apoio. Use sempre que precisar criar, corrigir ou revisar specs, smoke tests, testes de protocolo/homologação, evidências visuais ou PDFs. Siga a estrutura de `e2e/` (auth setup, helpers, `protocoloXXXX/`), rode com `--workers=1` e `headless: false`, e grave evidências em `playwright-report/{numero}/{ERROR|PASSOU|PENDENCIA}/`.
argument-hint: "[protocolo ou fluxo]"
---

# Testes com Playwright (QA)

Este repositório (`../QA`) é o projeto de automação E2E do SaaS Apoio. Todo teste de browser/Playwright vive aqui, não no `e-public-saas`.

## Ambiente

- URL base: `http://veramendes.local`.
- Stack: Vue 3 + Vuetify + Inertia + Laravel (SPA).
- `headless: false` — o servidor não responde ao Chromium headless.
- Rodar com `--workers=1` para não sobrecarregar a homologação.
- Credenciais no `.env` (`USER_EMAIL`/`USER_PASSWORD`, `QA_7614_*`). Nunca no código.
- Se `veramendes.local` devolver 503, o `artisan serve` do `../e-public-saas` não está rodando.

## Estrutura

```text
e2e/
├── auth.setup.ts          # storageState do superadmin
├── auth.ti.setup.ts       # storageState do T.I.
├── fixtures.ts            # evidência automática por protocolo
├── helpers/               # pdf.ts, render.ts
├── protocolo7621/         # um diretório por protocolo
├── protocolo7614/
├── protocolo7633/
└── regraDeNegocio/
```

- Um diretório por protocolo: `e2e/protocolo<numero>/`.
- Specs: `*.spec.ts`; helpers locais: `*.ts`.
- Se o teste alterar dados, limpe no `afterAll` ou use a massa QA documentada no `AGENTS.md`.
- Defeitos conhecidos: `test.fail(true, 'motivo')`.
- Evidências geradas: `playwright-report/{numero}/{ERROR|PASSOU|PENDENCIA}/`.
- Índice/documentação do protocolo: `Pendencias-Protocolos/protocolo-<numero>/` quando fizer sentido.

## Evidência automática

Use o fixture `e2e/fixtures.ts`:

```ts
import { expect, test } from '../fixtures';

test.use({ protocolo: '7621' });

test('...', async ({ page, anexar }) => {
  // ...
  anexar('relatorio.pdf', buffer);
});
```

O fixture grava screenshot e anexos em `playwright-report/7621/{PASSOU|ERROR|PENDENCIA}` conforme `testInfo.status`. O reporter HTML fica em `playwright-report/html` para não apagar as evidências.

## Autenticação

- Superadmin: `storageState` de `e2e/auth.setup.ts` (`e2e/.auth/user.json`), projeto `chromium`.
- T.I.: `storageState` de `e2e/auth.ti.setup.ts` (`e2e/.auth/ti.json`), projeto `ti`.
- Outros perfis: `contextoComo(browser, PERFIS.<perfil>)` de `e2e/protocolo7614/boletim.ts` — contexto limpo, sem herdar o superadmin.
- Login: `getByRole('textbox', { name: 'Login de acesso' })`, `getByRole('textbox', { name: 'Senha' })`, botão "Entrar no sistema".

## Comandos

```bash
npx playwright test e2e/protocolo7621 --workers=1
npx playwright test e2e/protocolo7621/agendaDetalhes.spec.ts --workers=1
npx playwright test --workers=1
npx playwright show-report playwright-report/html
```

Para depurar: `--headed`, `--debug`, `--trace on`.

## Protocolo 7621

- `e2e/protocolo7621/agendaDetalhes.spec.ts`: T.I. abre os detalhes da agenda e publica.
- `e2e/protocolo7621/relatorioColunas.spec.ts`: PDF de Inserção de Aulas com `Disciplina` e `Turma` separadas.
- `e2e/protocolo7621/responsividade.spec.ts`: regressão UIUX-7621-01 a 07 (overflow, drawer mobile, alvos de toque, date picker e filtros).
- Massa: diário 61 (Biologia · QA-7614-A); T.I. `PERFIS.ti` (projeto `ti`).
- Evidência: `playwright-report/7621/{PASSOU|ERROR}/`.

## Regras

- Um teste por cenário; use o número do protocolo em `test.use({ protocolo })`.
- Prefira `getByRole`, IDs estáveis (`#agenda.status`, `[id^="agendas.btn_visualizar_"]`) e texto visível.
- Evite `sleep`; use `expect` com auto-wait e `waitForResponse` para chamadas Inertia.
- Não commite `.env`, `e2e/.auth/`, `playwright-report/` ou `test-results/`.
- Se o cenário for backend puro, use os testes Pest no `e-public-saas`; Playwright é para o que o HTTP test não vê.
- A skill `pendencias-protocolos` do `e-public-saas` lê `../QA/playwright-report/{numero}/` para a triagem.
