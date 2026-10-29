import { readFileSync } from 'fs';
import { test, expect, type Page } from '@playwright/test';

async function metricValue(page: Page, label: string): Promise<number> {
  const card = page.getByText(label, { exact: true }).locator('..').locator('..');
  const text = await card.innerText();
  const match = text.match(/(\d[\d.]*)/);
  if (!match) throw new Error(`Valor numérico não encontrado no card "${label}"`);
  return Number(match[1].replace(/\./g, ''));
}

// O <input>/<label> do combobox (Vuetify v-select) fica coberto pelo wrapper
// (v-field__input com data-no-activator), então o clique é forçado no <input>
// — que compartilha a mesma área do campo — para disparar a abertura do menu.
async function abrirSelect(page: Page, field: 'escola' | 'turma' | 'aluno' | 'dispositivo'): Promise<void> {
  await page.locator(`[id="relatorios.notifiq.${field}"]`).click({ force: true });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/relatorios/notifiq');
  await expect(page.getByRole('heading', { name: 'Relatórios Notifiq' })).toBeVisible();
});

test.describe('Dashboards de indicadores', () => {
  test('exibe os cards de Total de registros, Presenças, Saídas e Dispositivos ativos', async ({ page }) => {
    await expect(page.getByText('Total de registros', { exact: true })).toBeVisible();
    await expect(page.getByText('No período selecionado', { exact: true })).toBeVisible();
    await expect(page.getByText('Presenças', { exact: true })).toBeVisible();
    await expect(page.getByText('Saídas', { exact: true })).toBeVisible();
    await expect(page.getByText('Dispositivos ativos', { exact: true })).toBeVisible();
    await expect(page.getByText('Com registros no período', { exact: true })).toBeVisible();
  });

  test('exibe percentuais do total nos cards de Presenças e Saídas', async ({ page }) => {
    await expect(page.getByText(/% do total/).first()).toBeVisible();
  });

  test('exibe valores numéricos em todos os cards', async ({ page }) => {
    for (const label of ['Total de registros', 'Presenças', 'Saídas', 'Dispositivos ativos']) {
      expect(await metricValue(page, label)).toBeGreaterThan(0);
    }
  });

  test('Total de registros é igual a Presenças somadas a Saídas', async ({ page }) => {
    const total = await metricValue(page, 'Total de registros');
    const presencas = await metricValue(page, 'Presenças');
    const saidas = await metricValue(page, 'Saídas');

    expect(presencas + saidas).toBe(total);
  });
});

test.describe('Filtros e ações', () => {
  test('exibe os filtros de período, escola, turma, aluno e dispositivos', async ({ page }) => {
    await expect(page.getByRole('textbox', { name: 'Selecionar período...' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Escola' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Dispositivos Notifiq' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Filtrar relatórios Notifiq' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Limpar filtros' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Exportar relatórios Notifiq' })).toBeVisible();
  });

  test('Turma e Aluno iniciam desabilitados sem escola selecionada', async ({ page }) => {
    await expect(page.getByRole('combobox', { name: 'Turma' })).toBeDisabled();
    await expect(page.getByRole('combobox', { name: 'Aluno' })).toBeDisabled();
  });

  test('selecionar escola habilita o filtro de Turma', async ({ page }) => {
    await abrirSelect(page, 'escola');
    await page.getByRole('option', { name: 'Colégio Apoio' }).click();

    await expect(page.getByRole('combobox', { name: 'Turma' })).toBeEnabled();
    await expect(page.getByRole('combobox', { name: 'Aluno' })).toBeDisabled();
  });

  test('selecionar turma habilita o filtro de Aluno', async ({ page }) => {
    await abrirSelect(page, 'escola');
    await page.getByRole('option', { name: 'Colégio Apoio' }).click();

    await abrirSelect(page, 'turma');
    await page.getByRole('option', { name: '6º Ano' }).click();

    await expect(page.getByRole('combobox', { name: 'Aluno' })).toBeEnabled();
  });

  test('Filtrar mantém a tabela de registros após aplicar filtros', async ({ page }) => {
    await abrirSelect(page, 'escola');
    await page.getByRole('option', { name: 'Colégio Apoio' }).click();
    await abrirSelect(page, 'turma');
    await page.getByRole('option', { name: '6º Ano' }).click();

    await page.getByRole('button', { name: 'Filtrar relatórios Notifiq' }).click();

    await expect(page.getByRole('heading', { name: 'Registros no período' })).toBeVisible();
    await expect(page.getByRole('table').last().getByText('Entrada', { exact: true }).first()).toBeVisible();
  });

  test('Limpar filtros volta a desabilitar Turma e Aluno', async ({ page }) => {
    await abrirSelect(page, 'escola');
    await page.getByRole('option', { name: 'Colégio Apoio' }).click();
    await expect(page.getByRole('combobox', { name: 'Turma' })).toBeEnabled();

    await page.getByRole('button', { name: 'Limpar filtros' }).click();

    await expect(page.getByRole('combobox', { name: 'Turma' })).toBeDisabled();
    await expect(page.getByRole('combobox', { name: 'Aluno' })).toBeDisabled();
  });

  test('Exportar relatórios Notifiq baixa o CSV de registros', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Exportar relatórios Notifiq' }).click(),
    ]);

    expect(download.suggestedFilename()).toContain('.csv');
    expect(download.suggestedFilename()).toContain('notifiq-registros');
  });
});

test.describe('Registros no período', () => {
  test('exibe a tabela com as colunas esperadas', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Registros no período' })).toBeVisible();

    const tabela = page.getByRole('table').last();
    await expect(tabela.getByRole('columnheader', { name: 'Aluno' })).toBeVisible();
    await expect(tabela.getByRole('columnheader', { name: 'Matrícula' })).toBeVisible();
    await expect(tabela.getByRole('columnheader', { name: 'Escola' })).toBeVisible();
    await expect(tabela.getByRole('columnheader', { name: 'Turma' })).toBeVisible();
    await expect(tabela.getByRole('columnheader', { name: 'Data/Hora' })).toBeVisible();
    await expect(tabela.getByRole('columnheader', { name: 'Dispositivo' })).toBeVisible();
    await expect(tabela.getByRole('columnheader', { name: 'Tipo' })).toBeVisible();
  });

  test('apresenta registros com tipo Entrada na coluna Tipo', async ({ page }) => {
    const tabela = page.getByRole('table').last();
    await expect(tabela.getByText('Entrada', { exact: true }).first()).toBeVisible();
  });

  test('exibe paginação', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Próxima página' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ir à página 2' })).toBeVisible();
  });

  test('Total de registros bate com a quantidade de linhas do CSV exportado', async ({ page }) => {
    const total = await metricValue(page, 'Total de registros');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Exportar relatórios Notifiq' }).click(),
    ]);

    const csv = readFileSync(await download.path(), 'utf8');
    const linhas = csv
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0).length - 1;

    expect(linhas).toBe(total);
  });
});
