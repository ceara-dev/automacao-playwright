import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/relatorios');
  await expect(page.getByRole('heading', { name: 'Relatórios', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Todos os relatórios' }).click();
});

test.describe('Aba Todos os relatórios', () => {
  test('navega para a aba e exibe o card do Notifiq', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Todos os relatórios' })).toBeVisible();
    await expect(page.getByText('5 relatórios')).toBeVisible();
    await expect(page.getByText('Relatórios de registros e presenças coletadas pelo sistema Notifiq.')).toBeVisible();
  });

  test('exibe os 5 relatórios do card e o botão Ver todos', async ({ page }) => {
    const card = page.getByText('Relatórios de registros e presenças coletadas pelo sistema Notifiq.').locator('..');
    for (const nome of [
      'Registros por Período',
      'Presença por Escola',
      'Presença por Turma',
      'Registros por Aluno',
      'Registro de Entrada e Saída',
    ]) {
      await expect(page.getByRole('button', { name: `Ver relatório ${nome}` })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: 'Ver todos os relatórios de Notifiq' })).toBeVisible();
    void card;
  });

  test('Ver todos navega para a aba Notifiq', async ({ page }) => {
    await page.getByRole('button', { name: 'Ver todos os relatórios de Notifiq' }).click();
    await expect(page).toHaveURL(/relatorios\/notifiq/);
    await expect(page.getByRole('heading', { name: 'Relatórios Notifiq' })).toBeVisible();
  });
});

test.describe('Relatórios recentes', () => {
  test('exibe a tabela de relatórios recentes com colunas', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Relatórios recentes' })).toBeVisible();

    const tabela = page.getByRole('table').first();
    await expect(tabela.getByRole('columnheader', { name: 'Relatório' })).toBeVisible();
    await expect(tabela.getByRole('columnheader', { name: 'Tipo' })).toBeVisible();
    await expect(tabela.getByRole('columnheader', { name: 'Gerado por' })).toBeVisible();
    await expect(tabela.getByRole('columnheader', { name: 'Data/Hora' })).toBeVisible();
    await expect(tabela.getByRole('columnheader', { name: 'Ações' })).toBeVisible();
  });

  test('Registro de Entrada e Saída recente possui ações Visualizar e Baixar', async ({ page }) => {
    const linha = page.locator('tr').filter({ hasText: 'Registro de Entrada e Saída' }).first();
    await expect(linha.getByRole('button', { name: 'Visualizar relatório Registro de Entrada e Saída' })).toBeVisible();
    await expect(linha.getByRole('button', { name: 'Baixar relatório Registro de Entrada e Saída' })).toBeVisible();
  });

  test('Visualizar de Registro de Entrada e Saída recente abre o PDF em nova aba', async ({ page }) => {
    const linha = page.locator('tr').filter({ hasText: 'Registro de Entrada e Saída' }).first();

    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      linha.getByRole('button', { name: 'Visualizar relatório Registro de Entrada e Saída' }).click(),
    ]);

    await expect(popup).toHaveURL(/formato=pdf/);
    await popup.close();
  });

  test('Baixar de Registro de Entrada e Saída recente abre o PDF em nova aba', async ({ page }) => {
    const linha = page.locator('tr').filter({ hasText: 'Registro de Entrada e Saída' }).first();

    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      linha.getByRole('button', { name: 'Baixar relatório Registro de Entrada e Saída' }).click(),
    ]);

    await expect(popup).toHaveURL(/formato=pdf/);
    await popup.close();
  });
});
