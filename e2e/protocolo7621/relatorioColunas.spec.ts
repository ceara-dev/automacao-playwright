import { PDFParse } from 'pdf-parse';
import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures';

test.use({ protocolo: '7621' });

async function baixarPdf(page: Page): Promise<{ buffer: Buffer; texto: string }> {
  const query = new URLSearchParams({
    data_inicio: '2026-01-01',
    data_fim: '2026-12-31',
  });

  const response = await page.request.get(`/relatorios/insercao-aulas/export?${query.toString()}`);
  expect(response.status(), 'exportação do PDF de Inserção de Aulas').toBe(200);

  const buffer = Buffer.from(await response.body());
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();

  return { buffer, texto: result.text };
}

test('PDF separa as colunas Disciplina e Turma', async ({ page, anexar }) => {
  await page.goto('/relatorios/insercao-aulas', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Relatório de Inserção de Aulas').first()).toBeVisible({ timeout: 60_000 });

  const { buffer, texto } = await baixarPdf(page);
  anexar('insercao-aulas.pdf', buffer);

  expect(texto, 'o cabeçalho não deve juntar Disciplina e Turma').not.toContain('Disciplina/Turma');
  expect(texto).toContain('Disciplina');
  expect(texto).toContain('Turma');
  expect(texto, 'a disciplina não deve vir entre parênteses com a turma').not.toMatch(/Biologia\s*\(QA 7614/);
});
