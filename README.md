# SaaS_Privados_Playwright

## Executando testes

### Comando geral

```bash
npx playwright test
```

### Comandos específicos

- **Todos os testes (1 worker para não sobrecarregar o servidor de homologação):**
  ```bash
  npx playwright test --workers=1
  ```

- **Spec específico:**
  ```bash
  npx playwright test e2e/test_dashboard.spec.ts
  ```

- **Suíte do protocolo 7614:**
  ```bash
  npx playwright test e2e/protocolo7614 --workers=1
  ```

- **Suíte do protocolo 7633 (limite de 50 caracteres):**
  ```bash
  npx playwright test e2e/protocolo7633 --workers=1
  ```

- **Suíte do protocolo 7621 (T.I. agenda + colunas do PDF):**
  ```bash
  npx playwright test e2e/protocolo7621 --workers=1
  ```

- **Suíte de regras de negócio de um módulo:**
  ```bash
  npx playwright test e2e/regraDeNegocio/<modulo>/<modulo>.rn.spec.ts --workers=1
  ```

### Ambiente

- Node 20+ (`nvm use 22`); o Playwright 1.63 não roda no Node 18.
- URL base: `http://veramendes.local`
- Stack: Vue 3 + Vuetify + Inertia + Laravel (SPA). Autenticado como Super Administrador.
- Config: `headless: false`, `testDir: ./e2e`, `fullyParallel: true`.
- O servidor não responde ao Chromium headless — manter `headless: false`.
