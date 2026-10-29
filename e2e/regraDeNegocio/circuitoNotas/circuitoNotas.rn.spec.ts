import { test, expect, type Page } from '@playwright/test';

// Regras de negócio do módulo Circuito de Notas (menu lateral → Administração → Circuito de Notas).
// Catálogo completo com origem de cada regra: ./REGRAS.md
// Cada teste referencia o identificador RN-CIR-NN do catálogo.

// Homologação oscila bastante no carregamento (> 30s em alguns picos).
test.describe.configure({ timeout: 90_000 });
// Status das etapas depende de "hoje" no fuso do navegador.
test.use({ timezoneId: 'America/Sao_Paulo' });

const RESTRICTED_EMAIL = process.env.RESTRICTED_USER_EMAIL ?? '';
const RESTRICTED_PASSWORD = process.env.RESTRICTED_USER_PASSWORD ?? '';

// Circuito real usado só para leitura (Ensino médio - 3ª Série / 2026).
const CIRCUITO = { id: 9, etapa: 'Ensino médio - 3ª Série', ano: 2026 };
// Etapa de ensino sem circuito nem turmas na homologação — usada pelos circuitos QA-.
const ETAPA_QA = { id: 6, nome: 'Ensino fundamental de 9 anos - 1º Ano' };
const ETAPA_QA_2 = { id: 7, nome: 'Ensino fundamental de 9 anos - 2º Ano' };

const BASES = {
  maior_nota: 'Maior Nota',
  media_aritmetica: 'Média Aritmética',
  media_ponderada: 'Média Ponderada',
  soma_divisor: 'Soma com Divisor',
  soma_simples: 'Soma Simples',
};

type Inertia = { status: number; component?: string; props?: Record<string, any>; errors?: Record<string, string>; flash?: Record<string, string> };

// Payload mínimo válido de um circuito QA-.
const circuitoQA = (nome: string, extra: Record<string, unknown> = {}) => ({
  nome, ano_letivo: 2026, etapa_ensino_id: ETAPA_QA.id, escala_min: 0, escala_max: 10, media_aprovacao: 6, minimo_recuperacao: 4, casas_decimais: 2,
  etapas: [{
    nome: '1º Bimestre', ordem: 1, base_calculo: 'media_ponderada', divisor: null, modo_recuperacao: 'substitui_nota_etapa',
    periodo_calendario_inicio: '2026-02-01', periodo_calendario_fim: '2026-04-30',
    instrumentos: [
      { nome: 'P1', tipo: 'Prova', peso: 2, pontuacao_maxima: 10, obrigatorio: true },
      { nome: 'R1', tipo: 'Recuperação', peso: 1, pontuacao_maxima: 10, obrigatorio: false },
    ],
    composicoes: [],
  }],
  ...extra,
});

async function abrir(page: Page, url: string, pronto: Parameters<Page['getByRole']>): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole(...pronto)).toBeVisible({ timeout: 30_000 });
}

const abrirLista = (page: Page, url = '/circuito-notas') => abrir(page, url, ['searchbox', { name: 'Pesquisar circuitos' }]);
const abrirFormulario = (page: Page, url = '/circuito-notas/criar') => abrir(page, url, ['button', { name: /Salvar (Circuito|Alterações)/ }]);

// Lê as props Inertia de uma página (JSON embutido em <script data-page="app">).
async function inertiaProps(page: Page, url: string): Promise<Record<string, any>> {
  return page.evaluate(async (u) => {
    const html = await (await fetch(u)).text();
    const match = html.match(/<script[^>]*data-page="app"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) throw new Error(`Props Inertia não encontradas em ${u}`);
    return JSON.parse(match[1]).props;
  }, url);
}

// Chamada Inertia (como o front faz): segue o redirect e devolve props, errors e flash.
async function inertia(page: Page, method: string, url: string, body?: unknown): Promise<Inertia> {
  return page.evaluate(async ({ method, url, body }) => {
    const version = JSON.parse(document.querySelector('script[data-page="app"]')!.textContent!).version;
    const token = decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '');
    const res = await fetch(url, {
      method,
      // Mesmos headers do cliente Inertia: sem o Accept, o Laravel responde 422 JSON em vez do redirect com errors.
      headers: { 'Content-Type': 'application/json', Accept: 'text/html, application/xhtml+xml', 'X-XSRF-TOKEN': token, 'X-Inertia': 'true', 'X-Inertia-Version': version, 'X-Requested-With': 'XMLHttpRequest' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => null);
    if (!json?.props) return { status: res.status, errors: json?.errors };
    const flash = Object.fromEntries(Object.entries(json.props.flash ?? {}).filter(([, v]) => v)) as Record<string, string>;
    return { status: res.status, component: json.component, props: json.props, errors: json.props.errors, flash };
  }, { method, url, body });
}

async function todosCircuitos(page: Page): Promise<any[]> {
  const todos: any[] = [];
  for (let p = 1; p < 20; p++) {
    const { circuitos } = await inertiaProps(page, `/circuito-notas?page=${p}`);
    todos.push(...circuitos.data);
    if (!circuitos.next_page_url) break;
  }
  return todos;
}

// Reescreve as props no HTML da listagem para simular dados sem alterá-los no servidor.
async function simularLista(page: Page, alterar: (props: Record<string, any>) => void): Promise<void> {
  await page.route(/\/circuito-notas(\?.*)?$/, async (route) => {
    if (route.request().resourceType() !== 'document') return route.continue();
    const response = await route.fetch();
    const body = (await response.text()).replace(
      /(<script[^>]*data-page="app"[^>]*>)([\s\S]*?)(<\/script>)/,
      (_, abre: string, json: string, fecha: string) => {
        const data = JSON.parse(json);
        alterar(data.props);
        return abre + JSON.stringify(data).replace(/</g, '\\u003c') + fecha;
      },
    );
    await route.fulfill({ response, body });
  });
}

async function loginRestrito(page: Page): Promise<void> {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.getByRole('textbox', { name: 'Login de acesso' }).fill(RESTRICTED_EMAIL);
  await page.getByRole('textbox', { name: 'Senha' }).fill(RESTRICTED_PASSWORD);
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 30_000 });
}

// Texto exibido por um v-select (a seleção fica fora do <input> do combobox).
const campoSelect = (combobox: ReturnType<Page['getByRole']>) =>
  combobox.locator('xpath=ancestor::div[contains(@class,"v-field")][1]');

test.describe('Circuito de Notas — acesso e listagem', () => {
  test('RN-CIR-01: item do menu leva à listagem; título, breadcrumb e botões Novo/Importar', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.locator('[id="navbar.btn_circuito_notas"]').click();
    await expect(page).toHaveURL(/\/circuito-notas$/, { timeout: 30_000 });
    await expect(page).toHaveTitle(/^Circuito de Notas - /);
    await expect(page.getByRole('heading', { level: 5, name: 'Circuito de Notas' })).toBeVisible();
    const breadcrumb = page.getByRole('main').getByRole('list').first();
    await expect(breadcrumb.getByRole('listitem')).toHaveText(['Dashboard', 'Administração', 'Circuito de Notas', 'Listar']);
    await expect(breadcrumb.getByRole('link', { name: 'Administração' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Importar circuito de notas' }).click();
    await expect(page).toHaveURL(/\/circuito-notas\/importar\/tela$/, { timeout: 30_000 });
    await page.goBack();
    await page.getByRole('button', { name: 'Criar novo circuito de notas' }).click();
    await expect(page).toHaveURL(/\/circuito-notas\/criar$/, { timeout: 30_000 });
  });

  test('RN-CIR-02: cada linha mostra nome, ano, etapa de ensino, escala, nº de etapas e versão ativa', async ({ page }) => {
    await abrirLista(page);
    const { circuitos } = await inertiaProps(page, '/circuito-notas');
    expect(circuitos.per_page).toBe(15);
    await expect(page.getByText(/Exibindo de \d/)).toHaveText(`Exibindo de 1 até ${circuitos.to} de ${circuitos.total}`);

    const linhas = page.getByRole('button', { name: /^Ver detalhes do circuito / });
    await expect(linhas).toHaveCount(circuitos.data.length);
    for (const [i, c] of circuitos.data.entries()) {
      const linha = linhas.nth(i);
      await expect(linha).toContainText(`Nome ${c.nome}`);
      await expect(linha).toContainText(`Ano Letivo ${c.ano_letivo}`);
      await expect(linha).toContainText(`Etapa de Ensino ${c.etapa_ensino.nome}`);
      await expect(linha).toContainText(`Escala ${c.escala_min} - ${c.escala_max}`);
      await expect(linha).toContainText(`Etapas ${c.versao_ativa.etapas.length}`);
      await expect(linha).toContainText(`Versão v${c.versao_ativa.versao_major}.${c.versao_ativa.versao_minor}`);
    }
  });

  test('RN-CIR-02: sem versão ativa ou sem etapa de ensino, exibe "---" e 0 etapas', async ({ page }) => {
    await simularLista(page, (props) => {
      props.circuitos.data = [{ ...props.circuitos.data[0], id: 999, nome: 'Simulado', etapa_ensino: null, versao_ativa: null }];
    });
    await abrirLista(page);
    const linha = page.getByRole('button', { name: 'Ver detalhes do circuito Simulado' });
    await expect(linha).toContainText('Etapa de Ensino ---');
    await expect(linha).toContainText('Etapas 0');
    await expect(linha).toContainText('Versão ---');
  });

  test('RN-CIR-03: (esperado) "Carregar mais" só aparece quando há próxima página', async ({ page }) => {
    test.fail(true, 'DEFEITO CIR-06: "Carregar mais Circuito de Notas" aparece com 7 de 7 (next_page_url = null)');
    await abrirLista(page);
    await expect(page.getByRole('button', { name: 'Carregar mais circuitos' })).toHaveCount(0);
  });

  const buscas = [
    { termo: '3ª Série', total: 1, criterio: 'etapa de ensino' },
    { termo: 'Ensino médio', total: 3, criterio: 'parte da etapa de ensino' },
    { termo: '2026', total: 7, criterio: 'ano letivo' },
  ];
  for (const { termo, total, criterio } of buscas) {
    test(`RN-CIR-04: busca por ${criterio} ("${termo}") → ${total}`, async ({ page }) => {
      await abrirLista(page);
      await page.getByRole('searchbox', { name: 'Pesquisar circuitos' }).fill(termo);
      await expect(page).toHaveURL(/[?&]search=/, { timeout: 30_000 });
      await expect(page.getByText(/Exibindo de \d/)).toHaveText(`Exibindo de 1 até ${total} de ${total}`, { timeout: 30_000 });
    });
  }

  test('RN-CIR-04: (esperado) busca encontra pelo nome do circuito exibido na lista', async ({ page }) => {
    test.fail(true, 'DEFEITO CIR-05: buscar "Sistema de Notas" (nome dos 7 circuitos) retorna 0 — a busca ignora o nome');
    await abrirLista(page, '/circuito-notas?search=Sistema%20de%20Notas');
    await expect(page.getByText(/Exibindo de \d/)).toHaveText('Exibindo de 1 até 7 de 7');
  });

  test('RN-CIR-04: busca sem resultado mostra o estado vazio', async ({ page }) => {
    await abrirLista(page, '/circuito-notas?search=zzzz-inexistente');
    await expect(page.getByText(/Exibindo de \d/)).toHaveText('Exibindo de 0 até 0 de 0');
    await expect(page.getByText('Não existem circuitos de notas cadastrados')).toBeVisible();
  });

  test('RN-CIR-05: menu de ações tem Visualizar, Editar, Histórico, Exportar, Ativar/Desativar e Excluir', async ({ page }) => {
    await abrirLista(page);
    await page.locator(`[id="circuito-notas.btn_acoes-${CIRCUITO.id}"]`).click();
    const acoes = ['show', 'edit', 'historico', 'export', 'toggle', 'delete'];
    const textos = ['Visualizar', 'Editar', 'Histórico', 'Exportar', 'Ativar/Desativar', 'Excluir'];
    for (const [i, acao] of acoes.entries()) {
      await expect(page.locator(`[id="circuito-notas.btn_${acao}-${CIRCUITO.id}"]`)).toHaveText(textos[i]);
    }
  });

  test('RN-CIR-05: Ativar/Desativar pede confirmação com etapa e ano (cancelado)', async ({ page }) => {
    await abrirLista(page);
    await page.locator(`[id="circuito-notas.btn_acoes-${CIRCUITO.id}"]`).click();
    await page.locator(`[id="circuito-notas.btn_toggle-${CIRCUITO.id}"]`).click();
    const modal = page.getByRole('dialog');
    await expect(modal).toContainText('Alterar Status');
    await expect(modal).toContainText(`Deseja desativar o circuito ${CIRCUITO.etapa} / ${CIRCUITO.ano}?`);
    await expect(modal.getByRole('button', { name: 'Desativar' })).toBeVisible();
    await modal.getByRole('button', { name: 'Cancelar' }).click();
    await expect(modal).toBeHidden();
  });

  test('RN-CIR-05: Excluir exige digitar o id do circuito (cancelado)', async ({ page }) => {
    await abrirLista(page);
    await page.locator(`[id="circuito-notas.btn_acoes-${CIRCUITO.id}"]`).click();
    await page.locator(`[id="circuito-notas.btn_delete-${CIRCUITO.id}"]`).click();
    const modal = page.getByRole('dialog');
    const excluir = modal.getByRole('button', { name: 'Excluir' });
    await expect(modal.getByText(String(CIRCUITO.id), { exact: true })).toBeVisible();
    await expect(excluir).toBeDisabled();
    await modal.getByRole('textbox').fill(String(CIRCUITO.id));
    await expect(excluir).toBeEnabled();
    await modal.getByRole('button', { name: 'Cancelar' }).click();
    await expect(modal).toBeHidden();
  });

  test('RN-CIR-05: (esperado) modal de exclusão fala de circuito', async ({ page }) => {
    test.fail(true, 'DEFEITO CIR-07: ModalConfirmation compartilhado exibe "Tem certeza que deseja apagar este cargo?"');
    await abrirLista(page);
    await page.locator(`[id="circuito-notas.btn_acoes-${CIRCUITO.id}"]`).click();
    await page.locator(`[id="circuito-notas.btn_delete-${CIRCUITO.id}"]`).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).not.toContainText('cargo');
  });
});

test.describe('Circuito de Notas — visualizar', () => {
  test('RN-CIR-06: cabeçalho com etapa — ano, versão, parâmetros e links Editar/Histórico', async ({ page }) => {
    await abrir(page, `/circuito-notas/${CIRCUITO.id}`, ['link', { name: 'Histórico' }]);
    const { circuito } = await inertiaProps(page, `/circuito-notas/${CIRCUITO.id}`);
    const main = page.getByRole('main');
    await expect(page.getByRole('heading', { level: 5, name: circuito.nome })).toBeVisible();
    await expect(main).toContainText(`${CIRCUITO.etapa} — ${CIRCUITO.ano}`);
    await expect(main).toContainText(`v${circuito.versao_ativa.versao_major}.${circuito.versao_ativa.versao_minor}`);
    await expect(main).toContainText(new RegExp(`Média Aprovação\\s*${circuito.media_aprovacao}`));
    await expect(main).toContainText(new RegExp(`Etapas\\s*${circuito.versao_ativa.etapas.length}`));
    // "Modo Recuperação" = Sim quando alguma etapa tem modo de recuperação.
    const temRecuperacao = circuito.versao_ativa.etapas.some((e: { modo_recuperacao: string | null }) => e.modo_recuperacao);
    await expect(main).toContainText(new RegExp(`Modo Recuperação\\s*${temRecuperacao ? 'Sim' : 'Não'}`));
    await expect(page.getByRole('link', { name: 'Editar' })).toHaveAttribute('href', new RegExp(`/circuito-notas/${CIRCUITO.id}/editar$`));
    await expect(page.getByRole('link', { name: 'Histórico' })).toHaveAttribute('href', new RegExp(`/circuito-notas/${CIRCUITO.id}/historico$`));
  });

  // Etapas do circuito 9: 1º Bim 01/02–30/04, 3º Bim 01/08–31/10, 4º Bim 01/11–31/12.
  const status = [
    { hoje: '2026-01-31', etapa: '1º Bimestre', esperado: 'Inicia em 1 dia' },
    { hoje: '2026-01-30', etapa: '1º Bimestre', esperado: 'Inicia em 2 dias' },
    { hoje: '2026-04-29', etapa: '1º Bimestre', esperado: 'Faltam 1 dia' },
    { hoje: '2026-04-30', etapa: '1º Bimestre', esperado: 'Último dia' },
    { hoje: '2026-05-01', etapa: '1º Bimestre', esperado: 'Encerrado' },
    { hoje: '2026-09-30', etapa: '3º Bimestre', esperado: 'Faltam 31 dias' },
    { hoje: '2026-09-30', etapa: '4º Bimestre', esperado: 'Inicia em 32 dias' },
  ];
  for (const { hoje, etapa, esperado } of status) {
    test(`RN-CIR-07: em ${hoje}, "${etapa}" mostra "${esperado}"`, async ({ page }) => {
      await page.clock.setFixedTime(new Date(`${hoje}T10:00:00-03:00`));
      await abrir(page, `/circuito-notas/${CIRCUITO.id}`, ['link', { name: 'Histórico' }]);
      await expect(page.getByRole('main')).toContainText(new RegExp(`${etapa}\\s*${esperado}\\s*Média`));
    });
  }
});

test.describe('Circuito de Notas — formulário (sem salvar)', () => {
  test('RN-CIR-08: novo circuito nasce com escala 0–10, média 6, mín. recuperação 4, 2 casas e sem etapas', async ({ page }) => {
    await abrirFormulario(page);
    await expect(page.getByRole('heading', { level: 5 })).toHaveText('Circuito de Notas - Novo Circuito');
    await expect(page.getByRole('textbox', { name: 'Escala Mínima' })).toHaveValue('0,00');
    await expect(page.getByRole('textbox', { name: 'Escala Máxima' })).toHaveValue('10,00');
    await expect(page.getByRole('textbox', { name: 'Média de Aprovação' })).toHaveValue('6,00');
    await expect(page.getByRole('textbox', { name: 'Mínimo para Recuperação' })).toHaveValue('4,00');
    await expect(campoSelect(page.getByRole('combobox', { name: 'Arredondamento (casas decimais)' }))).toContainText('2');
    await expect(page.getByText('Nenhuma etapa avaliativa cadastrada. Clique em "Adicionar Etapa" para começar.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Salvar Circuito' })).toBeVisible();
  });

  test('RN-CIR-09: nova etapa = "Nª Etapa" + Média Ponderada; novo instrumento = N1 / Prova / peso 1 / pontuação = escala máx. / obrigatório', async ({ page }) => {
    await abrirFormulario(page);
    await page.getByRole('button', { name: 'Adicionar etapa avaliativa' }).click();
    await page.getByRole('button', { name: 'Adicionar etapa avaliativa' }).click();
    await expect(page.getByRole('main')).toContainText('1ª Etapa');
    await expect(page.getByRole('main')).toContainText('2ª Etapa');

    await page.getByRole('button', { name: 'Adicionar instrumento na etapa' }).first().click();
    await page.getByRole('main').getByRole('button', { name: '', exact: true }).first().click();
    await expect(page.getByRole('textbox', { name: 'Nome da Etapa' }).first()).toHaveValue('1ª Etapa');
    await expect(campoSelect(page.getByRole('combobox', { name: 'Base de Cálculo' }).first())).toContainText('Média Ponderada');
    const linha = page.getByRole('main').getByRole('table').first().getByRole('row').nth(1);
    await expect(linha.getByRole('textbox').nth(0)).toHaveValue('N1');
    await expect(linha.locator('input[role="combobox"]')).toHaveValue('Prova');
    await expect(linha.getByRole('textbox').nth(1)).toHaveValue('1,0');
    await expect(linha.getByRole('textbox').nth(2)).toHaveValue('10,00');
    await expect(linha.getByRole('checkbox')).toBeChecked();
  });

  test('RN-CIR-10: base de cálculo mostra a explicação; Peso só na Média Ponderada; Divisor só na Soma com Divisor', async ({ page }) => {
    await abrirFormulario(page);
    await page.getByRole('button', { name: 'Adicionar etapa avaliativa' }).click();
    await page.getByRole('button', { name: 'Adicionar instrumento na etapa' }).click();
    await page.getByRole('main').getByRole('button', { name: '', exact: true }).first().click();
    const tabela = page.getByRole('main').getByRole('table').first();

    await expect(tabela.getByRole('columnheader', { name: 'Peso' })).toBeVisible();
    await expect(page.getByRole('main')).toContainText('Média Ponderada: Cada nota é multiplicada pelo peso do instrumento');

    for (const [valor, rotulo] of Object.entries(BASES)) {
      await page.getByRole('combobox', { name: 'Base de Cálculo' }).click({ force: true });
      await page.getByRole('listbox').getByRole('option', { name: rotulo, exact: true }).click();
      await expect(page.getByRole('main').getByRole('alert').filter({ hasText: `${rotulo}:` })).toBeVisible();
      await expect(tabela.getByRole('columnheader', { name: 'Peso' })).toHaveCount(valor === 'media_ponderada' ? 1 : 0);
      await expect(page.getByRole('textbox', { name: 'Divisor' })).toHaveCount(valor === 'soma_divisor' ? 1 : 0);
    }
  });

  test('RN-CIR-11: "Modo de Recuperação" só aparece quando a etapa tem instrumento do tipo Recuperação', async ({ page }) => {
    await abrirFormulario(page);
    await page.getByRole('button', { name: 'Adicionar etapa avaliativa' }).click();
    await page.getByRole('button', { name: 'Adicionar instrumento na etapa' }).click();
    await page.getByRole('main').getByRole('button', { name: '', exact: true }).first().click();
    await expect(page.getByRole('combobox', { name: 'Modo de Recuperação' })).toHaveCount(0);

    await page.getByRole('main').getByRole('table').first().getByRole('row').nth(1).locator('input[role="combobox"]').click({ force: true });
    const tipos = page.getByRole('listbox').getByRole('option');
    await expect(tipos).toHaveText(['Prova', 'Trabalho', 'Atividade', 'Recuperação', 'Outro']);
    await tipos.filter({ hasText: 'Recuperação' }).click();
    await expect(page.getByRole('combobox', { name: 'Modo de Recuperação' })).toBeVisible();

    await page.getByRole('combobox', { name: 'Modo de Recuperação' }).click({ force: true });
    await expect(page.getByRole('listbox').getByRole('option')).toHaveText(['Substitui a menor nota', 'Substitui a nota da etapa', 'Adiciona ao conjunto de notas']);
    await page.getByRole('listbox').getByRole('option', { name: 'Substitui a nota da etapa' }).click();
    await expect(page.getByRole('main')).toContainText('apenas se for maior que a média original');
  });

  test('RN-CIR-12: etapa de referência só com 2+ etapas; remover etapa pede confirmação e renumera', async ({ page }) => {
    await abrirFormulario(page);
    await page.getByRole('button', { name: 'Adicionar etapa avaliativa' }).click();
    await page.getByRole('main').getByRole('button', { name: '', exact: true }).first().click();
    await expect(page.getByRole('button', { name: 'Adicionar etapa de referência' })).toBeDisabled();

    await page.getByRole('button', { name: 'Adicionar etapa avaliativa' }).click();
    await expect(page.getByRole('button', { name: 'Adicionar etapa de referência' }).first()).toBeEnabled();

    await page.getByRole('button', { name: 'Remover etapa' }).first().click();
    const confirmacao = page.getByRole('dialog');
    await expect(confirmacao).toContainText('Tem certeza que deseja remover a etapa "1ª Etapa"? Esta ação não pode ser desfeita.');
    await confirmacao.getByRole('button', { name: /Confirmar|Remover|Sim/ }).click();
    await expect(page.getByRole('button', { name: 'Remover etapa' })).toHaveCount(1);
    await expect(page.getByRole('main')).toContainText('2ª Etapa');
  });
});

test.describe('Circuito de Notas — validação do backend (nada é criado: etapa de ensino sempre ausente)', () => {
  test.beforeEach(async ({ page }) => {
    await abrirLista(page);
  });

  test('RN-CIR-13: obrigatórios = ano, etapa de ensino, escalas, média, mín. recuperação e casas decimais (nome e etapas são opcionais)', async ({ page }) => {
    const { errors } = await inertia(page, 'POST', '/circuito-notas/criar', {});
    expect(Object.keys(errors ?? {}).sort()).toEqual(
      ['ano_letivo', 'casas_decimais', 'escala_max', 'escala_min', 'etapa_ensino_id', 'media_aprovacao', 'minimo_recuperacao'],
    );
  });

  const faixas = [
    { caso: 'nome > 120 caracteres', dados: { nome: 'x'.repeat(121) }, campo: 'nome', msg: 'O campo nome não pode ser superior a 120 caracteres.' },
    { caso: 'ano < 2000', dados: { ano_letivo: 1999 }, campo: 'ano_letivo', msg: 'O campo ano letivo deve ser pelo menos 2000.' },
    { caso: 'escala mín ≥ máx', dados: { escala_min: 10, escala_max: 5 }, campo: 'escala_min', msg: 'A escala mínima deve ser menor que a escala máxima.' },
    { caso: 'média > escala máx', dados: { media_aprovacao: 11 }, campo: 'media_aprovacao', msg: 'A média de aprovação deve ser menor ou igual à escala máxima.' },
    { caso: 'mín. recuperação < escala mín', dados: { minimo_recuperacao: -1 }, campo: 'minimo_recuperacao', msg: 'O mínimo para recuperação deve ser maior ou igual à escala mínima.' },
    { caso: 'mín. recuperação ≥ média', dados: { minimo_recuperacao: 8 }, campo: 'minimo_recuperacao', msg: 'O mínimo para recuperação deve ser menor que a média de aprovação.' },
    { caso: 'casas decimais > 4', dados: { casas_decimais: 5 }, campo: 'casas_decimais', msg: 'O campo casas decimais não pode ser superior a 4.' },
  ];
  for (const { caso, dados, campo, msg } of faixas) {
    test(`RN-CIR-13: rejeita ${caso}`, async ({ page }) => {
      const payload = { ...circuitoQA('QA-validacao', dados), etapa_ensino_id: undefined };
      const { errors } = await inertia(page, 'POST', '/circuito-notas/criar', payload);
      expect(errors?.[campo]).toBe(msg);
    });
  }

  test('RN-CIR-13: etapas — nome, base/modo válidos, divisor ≥ 1 (obrigatório na Soma com Divisor), fim ≥ início, pesos > 0', async ({ page }) => {
    const etapa = circuitoQA('').etapas[0];
    const payload = {
      ...circuitoQA('QA-validacao'), etapa_ensino_id: undefined,
      etapas: [
        { ...etapa, nome: '', base_calculo: 'xpto', modo_recuperacao: 'zz', divisor: 0, periodo_calendario_inicio: '2026-05-01', periodo_calendario_fim: '2026-02-01',
          instrumentos: [{ nome: '', tipo: 'Prova', peso: -1, pontuacao_maxima: 10, obrigatorio: true }],
          composicoes: [{ etapa_fonte_ordem: 2, peso: 0, pontuacao_maxima: 0 }] },
        { ...etapa, ordem: 2, base_calculo: 'soma_divisor', divisor: null },
      ],
    };
    const { errors } = await inertia(page, 'POST', '/circuito-notas/criar', payload);
    expect(Object.keys(errors ?? {})).toEqual(expect.arrayContaining([
      'etapas.0.nome', 'etapas.0.base_calculo', 'etapas.0.modo_recuperacao', 'etapas.0.divisor', 'etapas.0.periodo_calendario_fim',
      'etapas.0.instrumentos.0.nome', 'etapas.0.instrumentos.0.peso', 'etapas.0.composicoes.0.peso', 'etapas.0.composicoes.0.pontuacao_maxima',
      'etapas.1.divisor',
    ]));
    expect(errors?.['etapas.1.divisor']).toContain('obrigatório quando');
  });

  test('RN-CIR-13: (esperado) mensagens usam o rótulo do campo, não o nome técnico', async ({ page }) => {
    test.fail(true, 'DEFEITO CIR-04: "O campo etapa ensino id é obrigatório.", "O campo etapas.0.nome é obrigatório."…');
    const { errors } = await inertia(page, 'POST', '/circuito-notas/criar', { ...circuitoQA('QA-validacao'), etapa_ensino_id: undefined, etapas: [{ ...circuitoQA('').etapas[0], nome: '' }] });
    expect(errors?.etapa_ensino_id).toBe('A etapa de ensino é obrigatória.');
    expect(errors?.['etapas.0.nome']).not.toContain('etapas.0');
  });

  test('RN-CIR-14: (esperado) instrumento com tipo da lista, pontuação ≤ escala, referência a etapa existente e ordens únicas', async ({ page }) => {
    test.fail(true, 'DEFEITO CIR-03: backend aceita tipo "Zzz", pontuação 50 em escala 0–10, etapa de referência inexistente e ordens duplicadas');
    const etapa = circuitoQA('').etapas[0];
    const payload = {
      ...circuitoQA('QA-validacao'), etapa_ensino_id: undefined,
      etapas: [
        { ...etapa, instrumentos: [{ nome: 'X', tipo: 'Zzz', peso: 1, pontuacao_maxima: 50, obrigatorio: true }], composicoes: [{ etapa_fonte_ordem: 9, peso: 1, pontuacao_maxima: 10 }] },
        { ...etapa, ordem: 1 },
      ],
    };
    const { errors } = await inertia(page, 'POST', '/circuito-notas/criar', payload);
    // Além do erro proposital (etapa_ensino_id), deveria apontar tipo, pontuação, referência e ordem.
    expect(Object.keys(errors ?? {}).length).toBeGreaterThan(1);
  });
});

test.describe('Circuito de Notas — ciclo com circuitos QA- descartáveis', () => {
  const inicio = new Date();

  // Limpeza em contexto próprio: roda mesmo se um teste estourar o timeout.
  test.afterAll(async ({ browser }, testInfo) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/user.json', baseURL: testInfo.project.use.baseURL });
    const page = await context.newPage();
    await page.goto('/circuito-notas', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    const criadosAgora = (c: { created_at: string }) => new Date(c.created_at) >= inicio;
    for (const c of (await todosCircuitos(page)).filter((c) => c.nome?.startsWith('QA-') || ([ETAPA_QA.id, ETAPA_QA_2.id].includes(c.etapa_ensino_id) && criadosAgora(c)))) {
      await inertia(page, 'DELETE', `/circuito-notas/${c.id}`);
    }
    const { modelos } = await inertiaProps(page, '/circuito-notas/importar/tela');
    const modelosQA = modelos.filter((m: { etapa_ensino_id: number; created_at: string }) => [ETAPA_QA.id, ETAPA_QA_2.id].includes(m.etapa_ensino_id) && criadosAgora(m));
    for (const m of modelosQA) await inertia(page, 'DELETE', `/circuito-notas/modelos-exportados/${m.id}`);
    await context.close();
  });

  test('RN-CIR-15/16/17/19/20: criar v1.0 › editar exige motivo e gera v1.1 › ativar/desativar › exportar › excluir', async ({ page }) => {
    test.setTimeout(300_000);
    const nome = `QA-Circuito RN ${Date.now()}`;
    await abrirLista(page);

    // RN-CIR-15: criação gera a versão 1.0 com motivo automático.
    const criado = await inertia(page, 'POST', '/circuito-notas/criar', circuitoQA(nome));
    expect(criado.flash?.success).toBe('Circuito de Notas criado com sucesso!');
    const circuito = (await todosCircuitos(page)).find((c) => c.nome === nome);
    expect(circuito.ativo).toBe(true);
    expect(`${circuito.versao_ativa.versao_major}.${circuito.versao_ativa.versao_minor}`).toBe('1.0');
    expect(circuito.versao_ativa.motivo_alteracao).toBe('Criação inicial do circuito');

    // RN-CIR-16: tela de edição — aviso de versão, etapa de ensino travada, motivo obrigatório.
    await abrirFormulario(page, `/circuito-notas/${circuito.id}/editar`);
    await expect(page.getByRole('alert').filter({ hasText: 'Atenção:' })).toContainText('uma nova versão será criada automaticamente');
    await expect(page.getByRole('combobox', { name: 'Etapa de Ensino' })).toBeDisabled();
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    await expect(page.getByText('O motivo da alteração é obrigatório ao editar um circuito.').first()).toBeVisible({ timeout: 30_000 });

    await page.getByRole('textbox', { name: 'Motivo da Alteração (obrigatório)' }).fill('RN-CIR-16 edição de teste');
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    await expect(page).toHaveURL(/\/circuito-notas$/, { timeout: 60_000 });

    // RN-CIR-17: histórico — nova versão minor ativa, anterior inativa.
    await abrir(page, `/circuito-notas/${circuito.id}/historico`, ['table']);
    await expect(page.getByRole('heading', { level: 5 })).toHaveText(`Histórico de Versões — ${nome}`);
    const linhas = page.getByRole('table').getByRole('row');
    await expect(linhas.nth(1)).toContainText(/v1\.1.*RN-CIR-16 edição de teste.*Ativa/);
    await expect(linhas.nth(2)).toContainText(/v1\.0.*Criação inicial do circuito.*Inativa/);
    await expect(page.getByRole('main')).toContainText(/Total Versões\s*2/);

    // RN-CIR-19: ativar/desativar alterna o status.
    const toggle = await inertia(page, 'PUT', `/circuito-notas/${circuito.id}/toggle-ativo`);
    expect(toggle.flash?.success).toBe('Status do circuito alterado com sucesso!');
    expect((await todosCircuitos(page)).find((c) => c.id === circuito.id).ativo).toBe(false);

    // RN-CIR-20: exportar cria o modelo "<etapa> - Padrão <ano>" na tela de importação.
    const exportado = await inertia(page, 'GET', `/circuito-notas/${circuito.id}/exportar`);
    expect(exportado.flash?.success).toBe('Circuito exportado como modelo com sucesso!');
    const { modelos } = await inertiaProps(page, '/circuito-notas/importar/tela');
    const modelo = modelos.find((m: { circuito_origem_id: number }) => m.circuito_origem_id === circuito.id);
    expect(modelo.nome_modelo).toBe(`${ETAPA_QA.nome} - Padrão 2026`);

    // Exclusão: remove o circuito (GET passa a 404); o modelo exportado permanece.
    const excluido = await inertia(page, 'DELETE', `/circuito-notas/${circuito.id}`);
    expect(excluido.flash?.success).toBe('Circuito de Notas removido com sucesso!');
    expect(await page.evaluate(async (id) => (await fetch(`/circuito-notas/${id}`, { redirect: 'manual' })).status, circuito.id)).toBe(404);
    const depois = (await inertiaProps(page, '/circuito-notas/importar/tela')).modelos;
    expect(depois.some((m: { id: number }) => m.id === modelo.id), 'modelo exportado continua disponível').toBe(true);
  });

  test('RN-CIR-16: (esperado) salvar a edição pela tela confirma o sucesso e limpa o erro anterior', async ({ page }) => {
    test.fail(true, 'DEFEITO CIR-09: após salvar, não há toast de sucesso e o toast "O motivo da alteração é obrigatório…" da tentativa anterior continua visível');
    test.setTimeout(180_000);
    await abrirLista(page);
    const nome = `QA-Toast Edicao ${Date.now()}`;
    await inertia(page, 'POST', '/circuito-notas/criar', circuitoQA(nome));
    const circuito = (await todosCircuitos(page)).find((c) => c.nome === nome);

    await abrirFormulario(page, `/circuito-notas/${circuito.id}/editar`);
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    await expect(page.getByText('O motivo da alteração é obrigatório ao editar um circuito.').first()).toBeVisible({ timeout: 30_000 });
    await page.getByRole('textbox', { name: 'Motivo da Alteração (obrigatório)' }).fill('toast');
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    await expect(page).toHaveURL(/\/circuito-notas$/, { timeout: 60_000 });

    await expect(page.getByRole('alert').filter({ hasText: 'O motivo da alteração é obrigatório' })).toHaveCount(0);
    await expect(page.getByText('Circuito de Notas atualizado com sucesso!')).toBeVisible({ timeout: 20_000 });
  });

  test('RN-CIR-18: (esperado) não permite dois circuitos para a mesma etapa de ensino e ano', async ({ page }) => {
    test.fail(true, 'DEFEITO CIR-01: dois circuitos ativos para a mesma etapa/ano são aceitos');
    test.setTimeout(180_000);
    await abrirLista(page);
    await inertia(page, 'POST', '/circuito-notas/criar', circuitoQA(`QA-Duplicado A ${Date.now()}`));
    const segundo = await inertia(page, 'POST', '/circuito-notas/criar', circuitoQA(`QA-Duplicado B ${Date.now()}`));
    expect(segundo.errors?.etapa_ensino_id).toBeTruthy();
  });

  test('RN-CIR-16: (esperado) etapa de ensino não pode ser trocada na edição (backend)', async ({ page }) => {
    test.fail(true, 'DEFEITO CIR-02: o campo fica travado na tela, mas o PUT com outra etapa_ensino_id é aceito');
    test.setTimeout(180_000);
    await abrirLista(page);
    const nome = `QA-Troca Etapa ${Date.now()}`;
    await inertia(page, 'POST', '/circuito-notas/criar', circuitoQA(nome));
    const circuito = (await todosCircuitos(page)).find((c) => c.nome === nome);
    await inertia(page, 'PUT', `/circuito-notas/${circuito.id}/editar`, { ...circuitoQA(nome), etapa_ensino_id: ETAPA_QA_2.id, motivo_alteracao: 'troca de etapa' });
    const depois = await inertiaProps(page, `/circuito-notas/${circuito.id}`);
    expect(depois.circuito.etapa_ensino_id).toBe(ETAPA_QA.id);
  });
});

test.describe('Circuito de Notas — importar (sem confirmar)', () => {
  test('RN-CIR-21: Importar só habilita com ano e etapa de destino; confirmação mostra modelo, origem e destino', async ({ page }) => {
    await abrir(page, '/circuito-notas/importar/tela', ['table']);
    await expect(page).toHaveTitle(/^Importar Circuito de Notas - /);
    await expect(page.getByRole('spinbutton', { name: 'Ano Letivo de Destino' })).toHaveValue('2026');
    const importar = page.getByRole('button', { name: 'Importar' }).first();
    await expect(importar).toBeDisabled();

    await page.getByRole('combobox', { name: 'Etapa de Ensino de Destino' }).click({ force: true });
    await page.getByRole('listbox').getByRole('option', { name: ETAPA_QA.nome, exact: true }).click();
    await expect(importar).toBeEnabled();
    await importar.click();
    const modal = page.getByRole('dialog');
    await expect(modal).toContainText('Modelo:');
    await expect(modal).toContainText('Origem:');
    await expect(modal).toContainText(`Destino:`);
    await expect(modal).toContainText(ETAPA_QA.nome);
    await modal.getByRole('button', { name: 'Cancelar' }).click();
    await expect(modal).toBeHidden();
  });
});

test.describe('Circuito de Notas — usuário restrito (Professor)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('RN-CIR-01: sem permissões circuito-notas.*, o item some do menu e as rotas respondem 403', async ({ page }) => {
    await loginRestrito(page);
    await expect(page.locator('[id="navbar.btn_circuito_notas"]')).toHaveCount(0);
    for (const url of ['/circuito-notas', '/circuito-notas/criar', `/circuito-notas/${CIRCUITO.id}`, `/circuito-notas/${CIRCUITO.id}/historico`, '/circuito-notas/importar/tela']) {
      const status = await page.evaluate(async (u) => (await fetch(u, { redirect: 'manual' })).status, url);
      expect(status, url).toBe(403);
    }
  });
});
