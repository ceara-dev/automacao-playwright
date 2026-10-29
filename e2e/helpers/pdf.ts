import { expect, type Page } from '@playwright/test';
import { PDFParse } from 'pdf-parse';

export const DEFAULT_PERIODO = {
  data_inicio: '2026-08-22',
  data_fim: '2026-09-21',
};

export interface ExportParams {
  data_inicio: string;
  data_fim: string;
  formato?: 'pdf' | 'csv';
  turma_id?: string;
  escola_id?: string;
  aluno_id?: string;
  dispositivo_id?: string;
}

export interface PdfResult {
  text: string;
  pages: string[];
  numPages: number;
  contentDisposition: string;
  contentTypes: string[];
  durationMs: number;
}

export async function exportPdf(page: Page, params: ExportParams): Promise<PdfResult> {
  const origin = new URL(page.url()).origin;
  const query = new URLSearchParams({
    data_inicio: params.data_inicio,
    data_fim: params.data_fim,
    formato: params.formato ?? 'pdf',
  });
  for (const key of ['turma_id', 'escola_id', 'aluno_id', 'dispositivo_id'] as const) {
    if (params[key] !== undefined) query.set(key, params[key]);
  }
  const url = `${origin}/relatorios/notifiq/registro-entrada-saida/export?${query.toString()}`;

  const started = Date.now();
  const response = await page.request.get(url);
  const durationMs = Date.now() - started;

  expect(response.status()).toBe(200);

  const buffer = Buffer.from(await response.body());
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();

  return {
    text: result.text,
    pages: result.pages.map((p) => p.text),
    numPages: result.pages.length,
    contentDisposition: response.headers()['content-disposition'] ?? '',
    contentTypes: [response.headers()['content-type'] ?? ''],
    durationMs,
  };
}

export function extractStudentNames(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && /\s\d{1,3}\s/.test(line))
    .filter((line) => !/^(Registro de|Colégio|Data:|Aluno Matrícula|Gerado por:|Página)/.test(line))
    .filter((line) => !/^--\s*\d+\s+of\s+\d+\s+--$/.test(line))
    .map((line) => line.replace(/\s+\d{1,3}\s.*$/, '').trim());
}
