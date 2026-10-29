import { test, expect } from '@playwright/test';
import { DEFAULT_PERIODO } from '../../helpers/pdf';
import { renderPdfPage, analyzePixels, isPdfRasterizerAvailable } from '../../helpers/render';

test.beforeEach(async ({ page }) => {
  test.skip(!isPdfRasterizerAvailable(), 'pdftoppm não está disponível neste ambiente');
  await page.goto('/relatorios/notifiq');
  await expect(page.getByRole('heading', { name: 'Relatórios Notifiq' })).toBeVisible();
});

test('CT-NOTIFIQ-010: aplica o novo padrão visual diferenciando as colunas', async ({ page }) => {
  const rendered = await renderPdfPage(page, DEFAULT_PERIODO);
  const { distinctLightHues } = analyzePixels(rendered);

  expect(distinctLightHues).toBeGreaterThanOrEqual(2);
});

test('CT-NOTIFIQ-013: aplica espaçamento entre os dados e as bordas', async ({ page }) => {
  const rendered = await renderPdfPage(page, DEFAULT_PERIODO);
  const { margins } = analyzePixels(rendered);

  expect(margins.left).toBeGreaterThan(10);
  expect(margins.top).toBeGreaterThan(10);
  expect(margins.right).toBeGreaterThan(10);
  expect(margins.bottom).toBeGreaterThan(10);
});
