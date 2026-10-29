import { test, expect, type Page } from '@playwright/test';
import { exportPdf } from '../../helpers/pdf';

const DIA = '2026-09-15';

function exportUrl(page: Page, params?: Record<string, string>): string {
  const origin = new URL(page.url()).origin;
  const query = new URLSearchParams(params ?? {});
  return `${origin}/relatorios/notifiq/registro-entrada-saida/export?${query.toString()}`;
}

async function abrirSelect(page: Page, field: 'escola' | 'turma'): Promise<void> {
  await page.locator(`[id="relatorios.notifiq.${field}"]`).click({ force: true });
}

async function headerPdf(page: Page, params: Record<string, string>): Promise<string> {
  const { text } = await exportPdf(page, params);
  const header = text
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.startsWith('Data:'));
  return header ?? '';
}

test.beforeEach(async ({ page }) => {
  await page.goto('/relatorios/notifiq');
  await expect(page.getByRole('heading', { name: 'Relatórios Notifiq' })).toBeVisible();
});

test.describe('CT-NOTIFIQ — filtros por data, turma e escola', () => {
  test('CT-NOTIFIQ-041: exportar filtrando apenas por Data exibe a data no cabeçalho', async ({ page }) => {
    const header = await headerPdf(page, { data_inicio: DIA, data_fim: DIA });

    expect(header).toContain('Data: 15/09/2026');
    expect(header).toContain('Total de alunos:');
  });

  test('CT-NOTIFIQ-042: exportar filtrando por Data e Turma exibe a turma no cabeçalho', async ({ page }) => {
    const header = await headerPdf(page, { data_inicio: DIA, data_fim: DIA, turma_id: '1' });

    expect(header).toContain('Data: 15/09/2026');
    expect(header).toContain('Turma: 6º Ano');
  });

  test('CT-NOTIFIQ-043: exportar filtrando por Data e Escola exibe a escola no cabeçalho', async ({ page }) => {
    const header = await headerPdf(page, { data_inicio: DIA, data_fim: DIA, escola_id: '1' });

    expect(header).toContain('Data: 15/09/2026');
    expect(header).toContain('Escola: Colégio Apoio');
  });

  test('CT-NOTIFIQ-044: exportar filtrando por Data, Turma e Escola exibe os três filtros', async ({ page }) => {
    const header = await headerPdf(page, { data_inicio: DIA, data_fim: DIA, escola_id: '1', turma_id: '1' });

    expect(header).toContain('Data: 15/09/2026');
    expect(header).toContain('Turma: 6º Ano');
    expect(header).toContain('Escola: Colégio Apoio');
  });

  test('CT-NOTIFIQ-051: data futura deve retornar Total de alunos 0', async ({ page }) => {
    test.fail(true, 'DEFEITO: data futura retorna "Total de alunos: 188" em vez de 0');

    const { text } = await exportPdf(page, { data_inicio: '2026-12-25', data_fim: '2026-12-25' });

    expect(text).toContain('Total de alunos: 0');
    expect(text).not.toMatch(/\d{2}:\d{2}:\d{2}/);
  });
});

test.describe('CT-NOTIFIQ — estado da pesquisa e validação', () => {
  test('CT-NOTIFIQ-049: nova pesquisa sobrescreve os filtros anteriores', async ({ page }) => {
    await abrirSelect(page, 'escola');
    await page.getByRole('option', { name: 'Colégio Apoio' }).click();
    await abrirSelect(page, 'turma');
    await page.getByRole('option', { name: '6º Ano' }).click();
    await page.getByRole('button', { name: 'Filtrar relatórios Notifiq' }).click();

    await abrirSelect(page, 'turma');
    await page.getByRole('option', { name: '7º Ano' }).click();
    await page.getByRole('button', { name: 'Filtrar relatórios Notifiq' }).click();

    const tabela = page.getByRole('table').last();
    await expect(tabela.getByText('7º Ano', { exact: true }).first()).toBeVisible();
    await expect(tabela.getByText('6º Ano', { exact: true })).toHaveCount(0);
  });

  test('CT-NOTIFIQ-052: data em formato inválido deve ser rejeitada', async ({ page }) => {
    test.fail(true, 'DEFEITO: o campo aceita "32/13/2026" sem validação de dia/mês');

    const periodo = page.getByRole('textbox', { name: 'Selecionar período...' });
    await periodo.fill('32/13/2026 - 32/13/2026');

    await expect(periodo).not.toHaveValue(/32\/13\/2026/);
  });

  test('CT-NOTIFIQ-053: limpar filtros restaura o comportamento padrão da exportação', async ({ page }) => {
    await abrirSelect(page, 'escola');
    await page.getByRole('option', { name: 'Colégio Apoio' }).click();
    await abrirSelect(page, 'turma');
    await page.getByRole('option', { name: '6º Ano' }).click();
    await page.getByRole('button', { name: 'Filtrar relatórios Notifiq' }).click();
    await expect(page.getByRole('combobox', { name: 'Turma' })).toBeEnabled();

    await page.getByRole('button', { name: 'Limpar filtros' }).click();

    await expect(page.getByRole('combobox', { name: 'Turma' })).toBeDisabled();
    await expect(page.getByRole('combobox', { name: 'Aluno' })).toBeDisabled();

    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('button', { name: 'Visualizar relatório Registro de Entrada e Saída' }).click(),
    ]);
    await expect(popup).toHaveURL(/formato=pdf/);
    expect(popup.url()).not.toContain('turma_id=');
    await popup.close();
  });

  test('CT-NOTIFIQ-056: Data em branco deve desabilitar a exportação', async ({ page }) => {
    test.fail(true, 'DEFEITO: o botão Exportar permanece habilitado com o campo Data em branco');

    await page.getByRole('textbox', { name: 'Selecionar período...' }).fill('');

    await expect(page.getByRole('button', { name: 'Exportar relatórios Notifiq' })).toBeDisabled();
  });
});

test.describe('CT-NOTIFIQ — cenários sem dados de teste no ambiente', () => {
  test('CT-NOTIFIQ-045: período com feriado sem registros', async () => {
    test.skip(true, 'Sem dados de teste: não há feriado configurado no período do ambiente de homologação');
  });

  test('CT-NOTIFIQ-046: aluno transferido no meio do período', async () => {
    test.skip(true, 'Sem dados de teste: não há aluno transferido (vínculo com data de saída) no ambiente de homologação');
  });

  test('CT-NOTIFIQ-047: registros em múltiplos dispositivos (Catraca Portaria/Estacionamento)', async () => {
    test.skip(true, 'Sem dados de teste: os dispositivos do ambiente são APOIO-1-001 e PI-CJP-XX-14 (a renderização por dispositivo já é coberta por CT-NOTIFIQ-005/006)');
  });

  test('CT-NOTIFIQ-048: múltiplas entradas e saídas no mesmo dia', async () => {
    test.skip(true, 'Sem dados de teste: regra de agregação de múltiplas entradas/saídas não especificada e sem caso claro no ambiente');
  });

  test('CT-NOTIFIQ-050: exportar durante o processamento da pesquisa', async () => {
    test.skip(true, 'Não reproduzível de forma determinística: a exportação usa o estado atual dos filtros via window.open');
  });

  test('CT-NOTIFIQ-054: turma desativada após a pesquisa', async () => {
    test.skip(true, 'Não reproduzível: não há como desativar uma turma no meio do fluxo de teste');
  });

  test('CT-NOTIFIQ-055: registros excluídos após a pesquisa', async () => {
    test.skip(true, 'Não reproduzível: não há como excluir um registro Notifiq no meio do fluxo de teste');
  });
});
