---
name: ui-ux
description: Audita UI/UX das telas do SaaS Apoio (Vue 3 + Vuetify + Inertia) em homologação, com heurísticas de Nielsen, consistência visual, microcopy, estados de feedback, formulários, tabelas e acessibilidade básica. Use sempre que o usuário pedir revisão de usabilidade, análise de UI/UX, crítica de interface, melhoria de tela, avaliação de fluxo ou "o que dá para melhorar nessa tela", mesmo que ele não diga "UI/UX". Gera achados priorizados, evidências e, quando pedido, spec Playwright.
argument-hint: "[rota ou tela]"
---

# Auditoria de UI/UX (SaaS Apoio)

Tela/rota alvo: **$ARGUMENTS**

Aplique esta skill para transformar uma tela em uma lista de achados **verificáveis**, não em opinião de gosto. Cada achado precisa de: heurística violada, impacto para o usuário, evidência e correção sugerida. O objetivo é que o time de produto/dev consiga agir sem precisar reabrir a tela.

## Ambiente

- Base: `http://veramendes.local` (homologação; se der 503, o `artisan serve` do `../e-public-saas` não está rodando).
- Stack: Vue 3 + Vuetify + Inertia + Laravel (SPA).
- **`headless: false`** — o servidor não responde ao Chromium headless.
- Rode com `--workers=1` para não sobrecarregar a homologação.
- Credenciais no `.env`: superadmin (`USER_EMAIL`/`USER_PASSWORD`), T.I. (`QA_7614_TI_EMAIL`), restrito (`RESTRICTED_USER_EMAIL`/`RESTRICTED_USER_PASSWORD`). Nunca escreva senha em spec ou doc.
- Sessões prontas: `e2e/.auth/user.json` (superadmin) e `e2e/.auth/ti.json` (T.I.). Gere com `npx playwright test --project=setup --workers=1`.
- Outros perfis: `contextoComo(browser, PERFIS.<perfil>)` de `e2e/protocolo7614/boletim.ts`.

## Passo a passo

### 1. Enquadrar a auditoria

Antes de abrir a tela, responda:

1. **Objetivo do usuário** naquela tela (o que ele veio fazer?).
2. **Perfil e permissão** usados (Super Admin, T.I., Gestor, Professor, Aluno). A mesma tela muda por permissão; audite o perfil do cenário.
3. **Fluxo**: de onde se chega, o que acontece depois de salvar/exportar, como se volta.
4. **Critério de sucesso**: o que precisa estar visível/possível para a tarefa terminar.

Se o protocolo/card tiver regras e cenários, use-os como fonte da verdade. Não invente requisito.

### 2. Capturar o estado real

```ts
import { test, expect } from '../fixtures';

test.use({ protocolo: 'geral', viewport: { width: 1440, height: 900 } });

test('auditoria ui/ux', async ({ page }) => {
  const erros: string[] = [];
  page.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
  page.on('response', (r) => r.status() >= 400 && erros.push(`${r.status()} ${r.url()}`));

  await page.goto('/relatorios/insercao-aulas', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 60_000 });
  // ...interaja com filtros, abra modais, gere o PDF...
});
```

Capture:

- screenshot da tela inteira (`fullPage: true`) **e** do viewport (o que o usuário vê sem rolar);
- screenshot de cada estado: inicial, carregando, vazio, erro, sucesso, modal aberto, validação;
- console/network com erro;
- `ariaSnapshot()` ou `page.accessibility.snapshot()` da região principal;
- textos reais (labels, placeholders, mensagens, toasts) — copie literalmente, não parafraseie.

### 3. Avaliar com o checklist

Percorra os blocos abaixo. Marque só o que virar achado; não preencha tabela vazia.

**Feedback e estados**
- Carregando: existe indicador? O botão desabilita e evita duplo clique?
- Vazio: explica o que fazer, ou só mostra tabela sem linhas?
- Erro: mensagem no campo e/ou toast? Diz o que corrigir? Some sozinho cedo demais?
- Sucesso: toast/redirect claro? A lista reflete o que foi salvo?
- Ação assíncrona longa (PDF, fila): há progresso, tempo estimado, como baixar depois?

**Hierarquia e densidade**
- Título, breadcrumb e subtítulo dizem onde estou e o que a tela faz?
- A ação principal é a mais evidente? "Limpar" e "Consultar" têm pesos diferentes?
- Filtros, resumo e tabela estão na ordem do fluxo mental (filtrar → conferir totais → ler linhas → exportar)?
- Excesso de informação por linha (colunas que ninguém usa) ou falta (dado essencial escondido)?

**Consistência Vuetify e do produto**
- Componentes iguais para a mesma função (combobox, date picker, dialog, chips).
- Rótulos e ícones consistentes com o menu/resto do sistema.
- Cores semânticas: erro/vermelho, sucesso/verde, aviso/âmbar — não usar cor só como decoração.
- Mensagens no padrão do produto ("cadastrado" × "cadastrados", singular/plural, acentuação).
- Não vazar nome técnico (tabela, campo, "cargo", "registro") para o usuário final.

**Microcopy**
- Verbo no infinitivo/imperativo consistente ("Consultar", "Gerar PDF", "Limpar").
- Placeholder não substitui label; label permanece visível.
- Datas e números no formato brasileiro (`dd/mm/aaaa`, `1.234`, `R$`).
- Erros dizem **o que fazer**, não só "inválido".

**Formulários**
- Obrigatórios marcados; opcionais não parecem obrigatórios.
- Validação no blur/submit, mensagem junto ao campo, foco no primeiro erro.
- Máscara e `maxlength` coerentes (ex.: CNPJ 18 × 14 é defeito conhecido).
- Contador de caracteres quando há limite.
- Preserva o que o usuário digitou ao errar; não limpa a tela.
- Autofill/teclado correto no mobile (delegar à skill `responsividade-mobile`).

**Tabelas e listas**
- Cabeçalho legível, colunas alinhadas por tipo (texto à esquerda, número/data à direita).
- Ordenação/paginação/busca visíveis e com estado claro.
- Linha vazia, "Carregar mais" sem próxima página, total que não bate com a lista.
- Ação por linha (ver/editar/excluir) acessível e não ambígua.
- Exportação diz o formato e o que será exportado.

**Navegação e fluxo**
- Breadcrumb leva de volta; filtros sobrevivem ao voltar?
- Ação destrutiva pede confirmação e diz o que será afetado.
- Não há becos sem saída (ex.: botão que abre outra tela, "Entregar" sem ação).
- Deep link/refresh mantém o estado esperado.

**Acessibilidade básica**
- Tudo que é clicável tem role/nome acessível (`getByRole` encontra).
- Foco visível e ordem de tabulação lógica; modal prende o foco.
- Contraste de texto e de estados (cinza claro em branco é suspeito).
- Não depender só de cor (chip verde/vermelho precisa de texto).
- Alvos de toque ≥ 44×44 px (no mobile, ver skill `responsividade-mobile`).
- Imagens/ícones com significado têm `alt`/`aria-label`.

### 4. Confirmar cada achado

Achado visual é hipótese até ser reproduzido. Confirme com uma das opções:

- **Comportamento**: Playwright (`expect`, `waitForResponse`, `page.route` para simular estado).
- **Permissão**: repita com o perfil restrito; 403/lista vazia é achado de acesso.
- **Dados**: compare o que a tela mostra com as props Inertia (`<script data-page="app">`) ou com o endpoint.
- **Acessibilidade**: `getByRole`/`ariaSnapshot`; se o nome acessível não existe, o leitor de tela também não lê.
- **Estado difícil**: intercepte a resposta com `page.route` + `route.fetch()` + `route.fulfill()`; não altere dados reais.

Classifique a severidade pelo impacto na tarefa:

| Severidade | Critério |
|---|---|
| **Alta** | Impede ou torna insegura a tarefa principal (não consigo consultar/exportar/salvar; dado sensível exposto). |
| **Média** | Concluo a tarefa, mas com erro, retrabalho ou risco de interpretação errada. |
| **Baixa** | Atrito cosmético, inconsistência de texto/layout, melhoria de percepção. |

### 5. Entregar

- **Achados**: `| ID | Severidade | Tela | Heurística | O que acontece | Impacto | Correção sugerida | Evidência |`.
  - IDs `UIUX-NN` (ou `PEN-<protocolo>-NN` se fizer parte de um protocolo).
  - Uma linha por problema; não agrupe coisas diferentes.
- **Evidências**: `playwright-report/{protocolo}/{PASSOU|ERROR|PENDENCIA}/` via fixture `anexar`/screenshot automático; nomes `uiux-NN-descricao.png`.
- **Documento**: siga o padrão do projeto em `docs/protocolo NNNN [SAAS]-<ASSUNTO>/` (arquivo com o assunto em snake_case) ou `Pendencias-Protocolos/protocolo-<numero>/` quando for pacote de protocolo.
- **Spec**, quando pedido: `e2e/protocolo<numero>/<tema>.spec.ts`, um `test` por achado/cenário, com `test.use({ protocolo })` e `test.fail(true, 'DEFEITO ...')` para o que já se sabe quebrado.

## Regras

- Audite o **estado real da homologação**, não o mock. Se precisar de massa, use a massa QA do `AGENTS.md`.
- Não confunda preferência pessoal com problema: todo achado precisa de impacto declarado.
- Não proponha redesenho inteiro quando o problema é microcopy; aponte a correção mínima que resolve.
- Se a tela tiver protocolo, leia as regras antes; o que o card pede tem prioridade sobre heurística genérica.
- Verifique o mesmo fluxo no mobile com a skill `responsividade-mobile` antes de fechar a auditoria.
- Não grave alterações em dados reais (escola id 1, turmas reais). Use prefixo `QA-` e limpe no `afterAll`.
