# Regras de Negócio

Catálogo das regras de negócio de cada módulo do menu lateral, levantadas e validadas pela automação.

Cada módulo tem uma pasta com:

- `REGRAS.md`: catálogo (`RN-<MÓDULO>-NN`), com a origem de cada regra e os defeitos encontrados;
- `<modulo>.rn.spec.ts`: um teste por regra, com o mesmo ID. Defeitos ficam marcados com `test.fail`.

| Seção do menu | Módulo | Pasta | Regras | Defeitos |
|---------------|--------|-------|--------|----------|
| Início | Dashboard | [`dashboard/`](./dashboard/REGRAS.md) | 15 | 3 |
| Administração | Escolas | [`escolas/`](./escolas/REGRAS.md) | 22 | 10 |
| Administração | Circuito de Notas | [`circuitoNotas/`](./circuitoNotas/REGRAS.md) | 21 | 9 |
| Acadêmico | Turmas | [`turmas/`](./turmas/REGRAS.md) | 16 | 17 |
| Acadêmico | Diários | [`diarios/`](./diarios/REGRAS.md) | 23 | 11 |

```bash
npx playwright test e2e/regraDeNegocio --workers=1
```
