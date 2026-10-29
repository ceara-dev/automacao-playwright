import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures';

test.use({ protocolo: '7621' });

const VIEWPORTS = [
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 320, height: 568 },
];

async function consultar(page: Page): Promise<void> {
  await page.goto('/relatorios/insercao-aulas', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[id="relatorio_aulas.data_inicio"]')).toBeVisible({ timeout: 60_000 });

  await page.locator('[id="relatorio_aulas.data_inicio"]').fill('01/10/2026');
  await page.locator('[id="relatorio_aulas.data_fim"]').fill('28/10/2026');
  await page.locator('[id="relatorio_aulas.btn_consultar"]').click();

  await expect(page.locator('.relatorio-insercao-aulas-tabela')).toBeVisible({ timeout: 60_000 });
}

async function metricas(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const wrapper = document.querySelector(
      '.relatorio-insercao-aulas-tabela .v-table__wrapper',
    ) as HTMLElement | null;
    const pdf = document.querySelector('[id="relatorio_aulas.btn_gerar_pdf"]') as HTMLElement | null;
    const pdfRect = pdf?.getBoundingClientRect();

    return {
      innerWidth: window.innerWidth,
      docClientWidth: doc.clientWidth,
      docScrollWidth: doc.scrollWidth,
      wrapperClientWidth: wrapper?.clientWidth ?? 0,
      wrapperScrollWidth: wrapper?.scrollWidth ?? 0,
      pdfLeft: pdfRect?.left ?? null,
      pdfRight: pdfRect?.right ?? null,
    };
  });
}

for (const viewport of VIEWPORTS) {
  test(`consulta sem overflow horizontal em ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await consultar(page);

    const m = await metricas(page);

    expect(m.docScrollWidth, 'a página não deve rolar na horizontal').toBeLessThanOrEqual(
      m.docClientWidth + 1,
    );
    expect(
      m.wrapperScrollWidth,
      'a tabela deve rolar dentro do próprio wrapper',
    ).toBeGreaterThan(m.wrapperClientWidth);
    expect(m.pdfRight, 'o botão Gerar PDF deve estar no viewport').toBeLessThanOrEqual(
      m.innerWidth + 1,
    );
  });
}

test('tela inicial em 320px não tem overflow horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/relatorios/insercao-aulas', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[id="relatorio_aulas.data_inicio"]')).toBeVisible({ timeout: 60_000 });

  const m = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));

  expect(m.scroll).toBeLessThanOrEqual(m.client + 1);
});

test('drawer começa fechado no mobile, abre pelo hambúrguer e fecha pelo botão', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/relatorios/insercao-aulas', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[id="relatorio_aulas.data_inicio"]')).toBeVisible({ timeout: 60_000 });

  const drawer = page.locator('.layout__drawer');
  await expect(drawer).not.toHaveClass(/v-navigation-drawer--active/);

  await page.locator('[id="navbar.btn_menu_toggle"]').click();
  await expect(drawer).toHaveClass(/v-navigation-drawer--active/);
  await expect(page.locator('.v-navigation-drawer__scrim')).toBeVisible();

  await page.locator('[id="navbar.btn_fechar_menu"]').click();
  await expect(drawer).not.toHaveClass(/v-navigation-drawer--active/);
});

test('alvos de toque têm ao menos 44px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/relatorios/insercao-aulas', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[id="relatorio_aulas.data_inicio"]')).toBeVisible({ timeout: 60_000 });

  await page.locator('[id="relatorio_aulas.data_inicio"]').fill('01/10/2026');
  await page.locator('[id="relatorio_aulas.data_fim"]').fill('28/10/2026');

  const seletores = [
    '[id="relatorio_aulas.data_inicio.calendario"]',
    '[id="relatorio_aulas.data_inicio.limpar"]',
    '[id="relatorio_aulas.btn_limpar"]',
    '[id="relatorio_aulas.btn_consultar"]',
  ];

  for (const seletor of seletores) {
    const caixa = await page.locator(seletor).boundingBox();
    expect(caixa, `${seletor} deve existir`).not.toBeNull();
    expect(caixa!.width, `${seletor} largura`).toBeGreaterThanOrEqual(44);
    expect(caixa!.height, `${seletor} altura`).toBeGreaterThanOrEqual(44);
  }

  await page.locator('[id="relatorio_aulas.btn_consultar"]').click();
  await expect(page.locator('.relatorio-insercao-aulas-tabela')).toBeVisible({ timeout: 60_000 });

  const pdf = await page.locator('[id="relatorio_aulas.btn_gerar_pdf"]').boundingBox();
  expect(pdf).not.toBeNull();
  expect(pdf!.height).toBeGreaterThanOrEqual(44);

  await page.locator('[id="relatorio_aulas.btn_gerar_pdf"]').click();
  await expect(page.locator('[id="gerar_documento.dialog"]')).toBeVisible({ timeout: 15_000 });

  const fechar = page.locator('[id="gerar_documento.btn_fechar_cabecalho"]');

  await expect.poll(async () => (await fechar.boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(44);
  await expect.poll(async () => (await fechar.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);

  await fechar.click();
});

test('limpar data funciona por teclado', async ({ page }) => {
  await page.goto('/relatorios/insercao-aulas', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[id="relatorio_aulas.data_inicio"]')).toBeVisible({ timeout: 60_000 });

  await page.locator('[id="relatorio_aulas.data_inicio"]').fill('01/10/2026');

  const limpar = page.locator('[id="relatorio_aulas.data_inicio.limpar"]');
  await limpar.focus();
  await expect(limpar).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(page.locator('[id="relatorio_aulas.data_inicio"]')).toHaveValue('');
});

test('date picker cabe inteiro em 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/relatorios/insercao-aulas', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[id="relatorio_aulas.data_inicio"]')).toBeVisible({ timeout: 60_000 });

  await page.locator('[id="relatorio_aulas.data_inicio.calendario"]').click();

  const picker = page.locator('.date-picker-field__picker');
  await expect(picker).toBeVisible({ timeout: 10_000 });

  const caixa = await picker.boundingBox();
  expect(caixa).not.toBeNull();
  expect(caixa!.x).toBeGreaterThanOrEqual(0);
  expect(caixa!.x + caixa!.width).toBeLessThanOrEqual(320 + 1);
});
