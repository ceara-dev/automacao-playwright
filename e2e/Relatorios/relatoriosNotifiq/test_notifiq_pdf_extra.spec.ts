import { test, expect } from '@playwright/test';
import { exportPdf, extractStudentNames, DEFAULT_PERIODO } from '../../helpers/pdf';

test.beforeEach(async ({ page }) => {
  await page.goto('/relatorios/notifiq');
  await expect(page.getByRole('heading', { name: 'Relatórios Notifiq' })).toBeVisible();
});

test('CT-NOTIFIQ-014: exibe apenas dispositivos da instituição', async ({ page }) => {
  const { text } = await exportPdf(page, DEFAULT_PERIODO);

  const devices = [...new Set(text.match(/\b[A-Z]{2,}[A-Z0-9-]*-\d+\b/g) ?? [])];
  expect(devices.length).toBeGreaterThan(0);

  const dispositivosEscola = ['APOIO-1-001', 'PI-CJP-XX-14'];
  for (const device of devices) {
    expect(dispositivosEscola).toContain(device);
  }
});

test('CT-NOTIFIQ-015: organiza os alunos por turma em ordem alfabética', async ({ page }) => {
  const { text } = await exportPdf(page, { ...DEFAULT_PERIODO, turma_id: '1' });

  expect(text).toContain('Turma: 6º Ano');

  const totalAlunos = Number(text.match(/Total de alunos: (\d+)/)?.[1]);
  expect(totalAlunos).toBeGreaterThan(0);

  const names = extractStudentNames(text);
  expect(names.length).toBe(totalAlunos);

  const sorted = [...names].sort();
  expect(names).toEqual(sorted);
});

test('CT-NOTIFIQ-019: conclui com o download automático do PDF', async ({ page }) => {
  await page.getByRole('button', { name: 'Baixar relatório Registro de Entrada e Saída' }).click();

  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('listitem', { name: 'Baixar Registro de Entrada e Saída em PDF' }).click(),
  ]);

  await expect(popup).toHaveURL(/formato=pdf/);
});
