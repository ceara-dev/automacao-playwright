---
name: responsividade-mobile
description: Audita e testa a responsividade das telas do SaaS Apoio em dispositivos móveis (320–414 px, tablet e landscape) com Playwright. Verifica overflow horizontal, tabelas, filtros, menus/drawer, diálogos, alvos de toque, fontes e estados, gera screenshots e spec de regressão. Use sempre que o usuário pedir responsividade, versão mobile, "como fica no celular", auditoria em dispositivos, quebra de layout ou adaptação de tela para viewports pequenos, mesmo que não use a palavra "responsividade".
argument-hint: "[rota ou tela]"
---

# Responsividade mobile (SaaS Apoio)

Tela/rota alvo: **$ARGUMENTS**

O objetivo é provar, com medições e screenshots, onde a tela quebra em viewport pequeno — e deixar um teste que acusa a regressão. Não basta "olhar e achar feio": overflow, alvo de toque e fonte de input são mensuráveis.

## Ambiente e limites

- Base: `http://veramendes.local`; se der 503, o `artisan serve` do `../e-public-saas` não está rodando.
- Stack: Vue 3 + Vuetify + Inertia. O menu lateral, os overlays (dialogs/menus/date picker) e as tabelas têm comportamento próprio do Vuetify: teste o componente renderizado, não o HTML imaginado.
- **`headless: false`** — o servidor não responde ao Chromium headless.
- `--workers=1` para não sobrecarregar a homologação.
- Sessão: `e2e/.auth/user.json` (superadmin) ou `e2e/.auth/ti.json` (T.I.) via `npx playwright test --project=setup --workers=1`. Outros perfis: `contextoComo()` de `e2e/protocolo7614/boletim.ts`.
- **PDF não é responsivo**: o relatório em PDF é A4 fixo. Responsividade vale para a tela; para o PDF, valide colunas/conteúdo (ver skill `playwright-testing`).

## Viewports mínimos

| Nome | Tamanho | Por quê |
|---|---|---|
| `mobile-320` | 320×568 | Menor tela ainda relevante (iPhone SE 1ª geração / Android antigo). |
| `mobile-360` | 360×640 | Android comum; referência do Material. |
| `mobile-390` | 390×844 | iPhone 12/13/14. |
| `mobile-414` | 414×896 | iPhone Plus/XR. |
| `tablet-768` | 768×1024 | Corte entre menu fixo e drawer. |
| `landscape-844` | 844×390 | Altura curta: dialogs, teclado e rodapé. |

Use `isMobile: true`, `hasTouch: true` e `deviceScaleFactor: 2–3` quando precisar simular toque de verdade; isso exige um contexto novo (`browser.newContext`), porque `test.use` do projeto já define o desktop. Para só medir layout, `page.setViewportSize()` no mesmo teste é suficiente.

## Passo a passo

### 1. Preparar

1. Confirme a rota e o perfil que têm permissão (403 também é achado: a tela não deveria aparecer no menu se o perfil não pode abrir).
2. Gere a sessão.
3. Identifique os estados que precisam ser vistos no mobile: inicial, com filtros preenchidos, tabela com muitas linhas, vazio, erro, modal aberto, date picker aberto, menu lateral aberto, toast.

### 2. Rodar a coleta

Copie [`assets/auditoria-responsiva.spec.ts`](assets/auditoria-responsiva.spec.ts) para `e2e/protocolo<numero>/` (ou `e2e/responsividade/`) e ajuste a rota e a espera inicial. O template:

- percorre os viewports;
- mede `document.documentElement.scrollWidth - innerWidth`;
- lista elementos que ultrapassam a direita da tela;
- lista alvos de toque menores que 44×44;
- acusa inputs com fonte < 16 px (zoom automático no iOS);
- mede diálogos/overlays maiores que a viewport;
- salva screenshot `fullPage` e o JSON de métricas em `playwright-report/<protocolo>/`.

Comando:

```bash
npx playwright test e2e/protocolo7621/auditoriaResponsiva.spec.ts --workers=1
```

### 3. Interpretar (o que é defeito e o que é aceitável)

**Defeito**
- A página inteira rola na horizontal (`scrollWidth > clientWidth`).
- Conteúdo essencial cortado sem scroll próprio (texto, botão, coluna de ação).
- Tabela larga que empurra a página; o correto é o wrapper da tabela rolar sozinho.
- Filtros que não empilham e ficam ilegais/inclicáveis; labels sobrepostos.
- Dialog/date picker maior que a viewport, sem scroll interno, ou botão de confirmar fora da tela.
- Menu lateral cobrindo a tela sem botão de fechar; hambúrguer inexistente.
- Alvo de toque < 44×44 em ação primária ou item de menu.
- Input com `font-size < 16px` em iOS (a página dá zoom ao focar).
- Texto truncado sem ellipsis/tooltip quando o dado é necessário para decidir.

**Aceitável**
- Scroll horizontal **dentro** de `.v-table__wrapper`/container da tabela, com o resto da página estável.
- Overlay temporário (menu, tooltip) que encosta na borda, desde que fique utilizável.
- Elemento decorativo fora da tela (`position: fixed`, carrossel) que não gera scroll no documento.
- Densidade maior no desktop; no mobile a prioridade é legibilidade e toque, não mostrar todas as colunas.

### 4. Confirmar no dispositivo simulado

Meça e interaja, não só tire print:

```ts
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(rota, { waitUntil: 'domcontentloaded' });

// overflow real
const overflow = await page.evaluate(() =>
  document.documentElement.scrollWidth - document.documentElement.clientWidth,
);
expect(overflow, 'scroll horizontal na página').toBeLessThanOrEqual(1);

// tabela com scroll próprio
const tabela = page.locator('.v-table__wrapper').first();
await expect(tabela).toHaveCSS('overflow-x', 'auto');

// dialog cabe na tela
await page.getByRole('button', { name: 'Gerar PDF' }).click();
const box = await page.getByRole('dialog').boundingBox();
expect(box!.width).toBeLessThanOrEqual(390);
expect(box!.x).toBeGreaterThanOrEqual(0);
```

- Abra o menu (hambúrguer) e confirme que fecha.
- Abra o date picker: os dias precisam caber e ser tocáveis.
- Preencha um filtro e confirme que o teclado virtual não esconde o botão de consultar (simule reduzindo a altura).
- Role até o fim: nada de rodapé/ação principal inacessível.
- Repita o fluxo principal inteiro (consultar → exportar), não só a abertura da tela.

### 5. Entregar

- **Achados**: `| ID | Viewport | Elemento | O que acontece | Impacto | Correção sugerida | Evidência |`.
  - IDs `RESP-NN` (ou `PEN-<protocolo>-NN`).
  - Sempre cite o viewport e o seletor/elemento; "quebra no mobile" não é acionável.
- **Evidências**: `playwright-report/{protocolo}/{PASSOU|ERROR|PENDENCIA}/resp-NN-<viewport>.png` + `metricas.json`.
- **Documento**: `docs/protocolo NNNN [SAAS]-<ASSUNTO>/` ou `Pendencias-Protocolos/protocolo-<numero>/`, no padrão do projeto.
- **Spec de regressão**: um `test.describe` por viewport ou um teste por achado, com `test.use({ protocolo })`; use `expect.soft` para medir tudo antes de falhar e `test.fail(true, 'DEFEITO ...')` para defeito conhecido.

## Armadilhas do Vuetify/Apoio

- O `.v-field__input` costuma interceptar o clique no combobox; nos testes do projeto usamos `click({ force: true })` no `[id="..."]`.
- Overlays (`v-dialog`, `v-menu`, `v-date-picker`) são teleportados para o `body`; procure por `getByRole('dialog')` e espere a animação.
- `v-data-table` já tem `.v-table__wrapper` com overflow; não confunda o scroll interno com overflow da página.
- `v-navigation-drawer` pode ser permanente no desktop e temporário no mobile; valide o estado pelo botão do menu, não pela classe.
- Safe area (notch) e barra do navegador reduzem a altura útil; teste também em landscape.
- `fullPage: true` em telas longas gera imagens enormes; para o relatório final, prefira também um print do viewport.

## Regras

- Sempre teste pelo menos **320, 390 e landscape**; só 375 esconde quebras de borda.
- Não "conserte" o app neste repositório: aqui é QA. Registre o achado e, se pedido, a correção no `e-public-saas`.
- Não use dados reais; massa QA com prefixo `QA-`, limpeza no `afterAll`.
- Rode `--workers=1` e mantenha `headless: false`.
- Se a tela tiver protocolo, leia as regras antes: o que o card pede tem prioridade sobre o checklist genérico.
- Combine com a skill `ui-ux`: responsividade é um recorte; usabilidade, microcopy e estados continuam valendo no mobile.
