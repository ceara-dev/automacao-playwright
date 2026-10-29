import { test, expect, request } from '@playwright/test';
import { DEFAULT_PERIODO } from '../../helpers/pdf';

test.beforeEach(async ({ page }) => {
  await page.goto('/relatorios/notifiq');
  await expect(page.getByRole('heading', { name: 'Relatórios Notifiq' })).toBeVisible();
});

test('CT-NOTIFIQ-017: nega acesso à exportação sem autenticação', async ({ page }) => {
  const origin = new URL(page.url()).origin;
  const url = `${origin}/relatorios/notifiq/registro-entrada-saida/export?data_inicio=${DEFAULT_PERIODO.data_inicio}&data_fim=${DEFAULT_PERIODO.data_fim}&formato=pdf`;

  const unauthenticated = await request.newContext({ storageState: { cookies: [], origins: [] } });
  const response = await unauthenticated.get(url);

  expect(response.headers()['content-type']).not.toContain('application/pdf');

  const body = await response.text();
  expect(body).not.toContain('Registro de Entrada e Saída');

  await unauthenticated.dispose();
});
