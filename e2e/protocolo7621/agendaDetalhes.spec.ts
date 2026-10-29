import { expect, test } from '../fixtures';

test.use({ protocolo: '7621' });

const DIARIO = 61;

async function garantirAgenda(page: import('@playwright/test').Page): Promise<number> {
  await page.goto(`/diarios/${DIARIO}?aba=agendas`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('tab', { name: 'Agendas' })).toBeVisible({ timeout: 60_000 });

  const botao = page.locator('[id^="agendas.btn_visualizar_"]').first();
  const vazio = page.getByText('Nenhuma agenda cadastrada para este diário');

  await expect(botao.or(vazio)).toBeVisible({ timeout: 30_000 });

  if ((await botao.count()) === 0) {
    const xsrf = (await page.context().cookies()).find((cookie) => cookie.name === 'XSRF-TOKEN')?.value ?? '';
    const response = await page.request.post(`/diarios/${DIARIO}/agendas`, {
      headers: {
        'X-XSRF-TOKEN': decodeURIComponent(xsrf),
        Accept: 'text/html, application/xhtml+xml',
      },
      form: {
        titulo: `QA 7621 ${Date.now()}`,
        data: '2026-10-28',
        conteudo: 'Agenda criada para validar o protocolo 7621.',
      },
    });

    expect(response.ok(), `criar agenda: HTTP ${response.status()}`).toBeTruthy();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('tab', { name: 'Agendas' }).click();
    await expect(botao).toBeVisible({ timeout: 30_000 });
  }

  const id = await botao.getAttribute('id');

  return Number(id?.replace('agendas.btn_visualizar_', ''));
}

function valorStatus(page: import('@playwright/test').Page): Promise<string> {
  return page.locator('[id="agenda.status"]').evaluate((element) => (element as HTMLInputElement).value);
}

async function trocarStatus(page: import('@playwright/test').Page, status: string): Promise<void> {
  const seletor = page
    .locator('[id="agenda.status"]')
    .locator('xpath=ancestor::div[contains(@class,"v-field")]')
    .first();

  await seletor.click();

  const opcao = page.getByRole('option', { name: status, exact: true });
  await expect(opcao).toBeVisible();

  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.request().method() === 'PUT' && new URL(r.url()).pathname.endsWith('/status'),
    ),
    opcao.click(),
  ]);

  expect(response.status(), `atualizar status para ${status}`).toBeLessThan(400);
  await expect.poll(() => valorStatus(page)).toBe(status);
}

test('T.I. abre os detalhes da agenda e publica', async ({ page }) => {
  const id = await garantirAgenda(page);

  const [response] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.request().method() === 'GET' &&
        new URL(r.url()).pathname === `/diarios/${DIARIO}/agendas/${id}`,
    ),
    page.locator(`[id="agendas.btn_visualizar_${id}"]`).click(),
  ]);

  expect(response.status(), 'detalhes da agenda devem abrir sem 403').toBe(200);
  await expect(page).toHaveURL(new RegExp(`/diarios/${DIARIO}/agendas/${id}$`), { timeout: 15_000 });

  for (const aba of ['Detalhes', 'Aulas', 'Arquivos', 'Histórico']) {
    await expect(page.getByRole('tab', { name: aba })).toBeVisible();
  }

  const statusAtual = await valorStatus(page);

  if (!statusAtual.includes('Rascunho')) {
    await trocarStatus(page, 'Rascunho');
  }

  await trocarStatus(page, 'Publicada');

  await expect.poll(() => valorStatus(page)).toBe('Publicada');
});
