import { test, expect } from '@playwright/test';
import { exportPdf, DEFAULT_PERIODO } from '../../helpers/pdf';

test.beforeEach(async ({ page }) => {
  await page.goto('/relatorios/notifiq');
  await expect(page.getByRole('heading', { name: 'Relatórios Notifiq' })).toBeVisible();
});

test('CT-NOTIFIQ-002: exibe título e identificação da escola no PDF', async ({ page }) => {
  const { text } = await exportPdf(page, DEFAULT_PERIODO);

  expect(text).toContain('Registro de Entrada e Saída');
  expect(text).toContain('Colégio Apoio');
});

test('CT-NOTIFIQ-003: exibe Data, Turma, Escola e Total de alunos no cabeçalho', async ({ page }) => {
  const { text } = await exportPdf(page, DEFAULT_PERIODO);

  expect(text).toContain('Data:');
  expect(text).toContain('Turma:');
  expect(text).toContain('Escola:');
  expect(text).toContain('Total de alunos:');
  expect(text).toContain('Data: 22/08/2026');
  expect(text).toContain('Escola: Colégio Apoio');
  expect(text).toMatch(/Total de alunos: \d+/);
});

test('CT-NOTIFIQ-004: exibe as colunas Aluno, Matrícula, Entrada, Saída e Situação', async ({ page }) => {
  const { text } = await exportPdf(page, DEFAULT_PERIODO);

  expect(text).toContain('Aluno');
  expect(text).toContain('Matrícula');
  expect(text).toContain('Entrada');
  expect(text).toContain('Saída');
  expect(text).toContain('Situação');
});

test('CT-NOTIFIQ-005: exibe horário e dispositivo de entrada', async ({ page }) => {
  const { text } = await exportPdf(page, DEFAULT_PERIODO);

  expect(text).toMatch(/\d{2}:\d{2}:\d{2}/);
  expect(text).toMatch(/\d{2}:\d{2}:\d{2}\n(APOIO-1-001|PI-CJP-XX-14)/);
});

test('CT-NOTIFIQ-006: exibe horário e dispositivo de saída', async ({ page }) => {
  const { text } = await exportPdf(page, DEFAULT_PERIODO);

  const matches = text.match(/\d{2}:\d{2}:\d{2}\n(APOIO-1-001|PI-CJP-XX-14)/g) ?? [];
  expect(matches.length).toBeGreaterThanOrEqual(2);
});

test('CT-NOTIFIQ-007: exibe situação "Completo"', async ({ page }) => {
  const { text } = await exportPdf(page, DEFAULT_PERIODO);

  expect(text).toContain('Completo');
});

test('CT-NOTIFIQ-008: exibe situação "Só entrada" e saída "sem registro"', async ({ page }) => {
  const { text } = await exportPdf(page, DEFAULT_PERIODO);

  expect(text).toContain('Só entrada');
  expect(text).toContain('sem registro');
});

test('CT-NOTIFIQ-009: exibe situação "Sem registro"', async ({ page }) => {
  const { text } = await exportPdf(page, DEFAULT_PERIODO);

  expect(text).toContain('Sem registro');
});

test('CT-NOTIFIQ-011: lista em múltiplas páginas mantendo as colunas', async ({ page }) => {
  const { numPages, pages } = await exportPdf(page, DEFAULT_PERIODO);

  expect(numPages).toBeGreaterThan(1);
  for (const pageText of pages) {
    expect(pageText).toContain('Aluno');
  }
});

test('CT-NOTIFIQ-022: renderiza nomes com caracteres especiais', async ({ page }) => {
  const { text } = await exportPdf(page, DEFAULT_PERIODO);

  expect(text).toContain('Ana Cecílya da Cunha Correia');
  expect(text).toContain('Andréia Silva Gomes do Nascimento');
  expect(text).toContain('Júlia Fernanda Veras de Araujo');
});
