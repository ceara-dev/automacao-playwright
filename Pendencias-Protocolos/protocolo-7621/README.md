# Protocolo 7621 — Agenda: detalhes/publicação e colunas do PDF

Índice da automação e das evidências do protocolo 7621.

## Automação

- [`agendaDetalhes.spec.ts`](../../e2e/protocolo7621/agendaDetalhes.spec.ts) — T.I. abre os detalhes da agenda do diário 61 e altera o status para Publicada.
- [`relatorioColunas.spec.ts`](../../e2e/protocolo7621/relatorioColunas.spec.ts) — PDF do Relatório de Inserção de Aulas com `Disciplina` e `Turma` em colunas separadas.
- [`responsividade.spec.ts`](../../e2e/protocolo7621/responsividade.spec.ts) — regressão dos achados UIUX-7621-01 a 07 (overflow, drawer mobile, alvos de toque, date picker e filtros).

```bash
npx playwright test e2e/protocolo7621 --workers=1
```

- **Perfil:** T.I. (`e2e/.auth/ti.json`, projeto `ti`).
- **Massa:** diário 61 (Biologia · QA-7614-A), da QA-Escola 7614.
- **Evidências geradas:** `playwright-report/7621/PASSOU/` (ignorado pelo Git).
  - `t-i-abre-os-detalhes-da-agenda-e-publica.png`
  - `pdf-separa-as-colunas-disciplina-e-turma.png`
  - `insercao-aulas.pdf`
  - capturas de responsividade: `consulta-sem-overflow-horizontal-em-{768,390,320}px.png`, `tela-inicial-em-320px-nao-tem-overflow-horizontal.png`, `drawer-comeca-fechado-no-mobile-abre-pelo-hamburguer-e-fecha-pelo-botao.png`, `alvos-de-toque-tem-ao-menos-44px.png`, `date-picker-cabe-inteiro-em-320px.png`.

## Resultado

| # | Cenário | Status |
|---|---------|--------|
| 01 | T.I. abre os detalhes da agenda e publica | PASSOU |
| 02 | PDF separa as colunas Disciplina e Turma | PASSOU |
| UIUX | Responsividade e UI/UX (8 verificações) | PASSOU (8/8) |

## Correções no `e-public-saas`

- `turmas.diario.agendas.show` incluída em `SincronizaCatalogoAcl::DIARIO_PERMISSIONS` — o T.I. tomava 403 nos detalhes, embora a edição abrisse.
- Template `latex.relatorio-insercao-aulas` com as colunas `Disciplina` e `Turma` separadas (antes: `Disciplina/Turma`).
- Layout: `min-width: 0`/`overflow-x: clip` e tabela com rolagem interna; a página não estoura mais em 768/390/320.
- Drawer: inicia fechado abaixo de `lg`, com scrim e botão de fechar no mobile.
- Alvos de toque de calendário, limpar, ações e fechar do diálogo com ≥ 44×44; limpar agora é botão focável.
- Date picker limitado a `calc(100vw - 24px)` e períodos agrupados no mesmo bloco do desktop.

A triagem do backlog fica no `e-public-saas`, em `.pendencias-protocolos/7621/7621.md`, e lê estas evidências via `../QA/playwright-report/7621/`.
