import { test, expect } from '@playwright/test';

const RELATORIOS = [
  'Registros por Período',
  'Presença por Escola',
  'Presença por Turma',
  'Registros por Aluno',
  'Registro de Entrada e Saída',
  'Painel de Presença (Dashboard)',
  'Registros por Dispositivo',
];

test.beforeEach(async ({ page }) => {
  await page.goto('/relatorios/notifiq');
  await expect(page.getByRole('heading', { name: 'Relatórios Notifiq' })).toBeVisible();
});

test.describe('Relatórios disponíveis', () => {
  test('exibe os 7 relatórios disponíveis', async ({ page }) => {
    const tabela = page.getByRole('table').first();
    for (const relatorio of RELATORIOS) {
      await expect(tabela.getByText(relatorio)).toBeVisible();
    }
  });

  test('exibe as colunas Relatório, Descrição, Tipo e Ações', async ({ page }) => {
    const tabela = page.getByRole('table').first();
    await expect(tabela.getByRole('columnheader', { name: 'Relatório' })).toBeVisible();
    await expect(tabela.getByRole('columnheader', { name: 'Descrição' })).toBeVisible();
    await expect(tabela.getByRole('columnheader', { name: 'Tipo' })).toBeVisible();
    await expect(tabela.getByRole('columnheader', { name: 'Ações' })).toBeVisible();
  });

  const RELATORIOS_DIALOG = RELATORIOS.filter((r) => r !== 'Registro de Entrada e Saída');

  for (const relatorio of RELATORIOS_DIALOG) {
    test(`Visualizar abre o preview de "${relatorio}"`, async ({ page }) => {
      await page.getByRole('button', { name: `Visualizar relatório ${relatorio}` }).click();

      await expect(page.getByRole('button', { name: 'Fechar', exact: true })).toBeVisible();
      await expect(page.getByRole('dialog').getByText(relatorio)).toBeVisible();

      await page.getByRole('button', { name: 'Fechar', exact: true }).click();
    });
  }

  test('Visualizar de Registro de Entrada e Saída abre o PDF em nova aba', async ({ page }) => {
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('button', { name: 'Visualizar relatório Registro de Entrada e Saída' }).click(),
    ]);

    await expect(popup).toHaveURL(/registro-entrada-saida\/export/);
    await expect(popup).toHaveURL(/formato=pdf/);
    await popup.close();
  });

  test('Baixar do Painel de Presença está desabilitado', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'Baixar relatório Painel de Presença (Dashboard)' })
    ).toBeDisabled();
  });
});

test.describe('Ação Gerar/Baixar', () => {
  test('Registro de Entrada e Saída oferece opções PDF e CSV', async ({ page }) => {
    await page.getByRole('button', { name: 'Baixar relatório Registro de Entrada e Saída' }).click();

    await expect(page.getByRole('listitem', { name: 'Baixar Registro de Entrada e Saída em PDF' })).toBeVisible();
    await expect(page.getByRole('listitem', { name: 'Baixar Registro de Entrada e Saída em CSV' })).toBeVisible();
  });

  test('Registro de Entrada e Saída baixa em PDF via menu', async ({ page }) => {
    await page.getByRole('button', { name: 'Baixar relatório Registro de Entrada e Saída' }).click();

    const responsePromise = page.context().waitForEvent('response', (response) =>
      response.url().includes('registro-entrada-saida/export') && response.url().includes('formato=pdf')
    );

    await page.getByRole('listitem', { name: 'Baixar Registro de Entrada e Saída em PDF' }).click();

    const response = await responsePromise;
    expect(response.headers()['content-type']).toContain('application/pdf');
  });

  // Requisito: todos os relatórios devem gerar em PDF.
  //
  // DEFEITO CONHECIDO (confirmado no fonte RelatorioNotifiq): o handler de
  // "Baixar" (função St) chama `relatorios.notifiq.export` para TODOS os
  // relatórios que não são dashboard, ignorando o tipo. O resultado é o
  // download do CSV genérico `notifiq-registros-*.csv`, em vez do PDF do
  // relatório específico. Apenas "Registro de Entrada e Saída" possui
  // exportação em PDF (via `registro-entrada-saida.export?formato=pdf`).
  for (const relatorio of ['Presença por Escola', 'Presença por Turma', 'Registros por Aluno', 'Registros por Dispositivo', 'Registros por Período']) {
    test(`Baixar de "${relatorio}" gera PDF`, async ({ page }) => {
      test.fail(true, 'Defeito: Baixar baixa o CSV genérico (notifiq-registros-*.csv) em vez do PDF do relatório');

      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: `Baixar relatório ${relatorio}` }).click(),
      ]);

      expect(download.suggestedFilename()).toBeTruthy();
      expect(download.suggestedFilename()).toContain('.pdf');
      expect(download.suggestedFilename()).not.toContain('notifiq-registros');
    });
  }
});
