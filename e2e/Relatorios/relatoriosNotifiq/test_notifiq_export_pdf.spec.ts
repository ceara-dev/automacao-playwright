import { test, expect } from '@playwright/test';

test('CT-NOTIFIQ-001: exporta o Relatório NOTIFIQ em PDF', async ({ page }) => {
  await page.goto('/relatorios/notifiq');

  await expect(page.getByRole('heading', { name: 'Relatórios Notifiq' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Exportar relatórios Notifiq' })).toBeVisible();

  await page.getByRole('button', { name: 'Baixar relatório Registro de Entrada e Saída' }).click();

  await expect(page.getByRole('listitem', { name: 'Baixar Registro de Entrada e Saída em PDF' })).toBeVisible();
  await expect(page.getByRole('listitem', { name: 'Baixar Registro de Entrada e Saída em CSV' })).toBeVisible();

  const responsePromise = page.context().waitForEvent('response', (response) =>
    response.url().includes('registro-entrada-saida/export') && response.url().includes('formato=pdf')
  );

  await page.getByRole('listitem', { name: 'Baixar Registro de Entrada e Saída em PDF' }).click();

  const response = await responsePromise;
  expect(response.headers()['content-type']).toContain('application/pdf');
  expect(response.headers()['content-disposition']).toContain('.pdf');
});
