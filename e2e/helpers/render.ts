import { execFileSync } from 'child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { PNG } from 'pngjs';
import type { Page } from '@playwright/test';
import type { ExportParams } from './pdf';

export interface RenderedPage {
  width: number;
  height: number;
  data: Buffer;
}

export function isPdfRasterizerAvailable(): boolean {
  try {
    execFileSync('pdftoppm', ['-v'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export async function renderPdfPage(page: Page, params: ExportParams, pageNum = 1): Promise<RenderedPage> {
  const origin = new URL(page.url()).origin;
  const query = new URLSearchParams({
    data_inicio: params.data_inicio,
    data_fim: params.data_fim,
    formato: 'pdf',
  });
  for (const key of ['turma_id', 'escola_id', 'aluno_id', 'dispositivo_id'] as const) {
    if (params[key] !== undefined) query.set(key, params[key]);
  }

  const response = await page.request.get(`${origin}/relatorios/notifiq/registro-entrada-saida/export?${query.toString()}`);
  const pdfBuffer = Buffer.from(await response.body());

  const dir = mkdtempSync(join(tmpdir(), 'notifiq-pdf-'));
  const pdfPath = join(dir, 'report.pdf');
  const outPrefix = join(dir, 'page');
  try {
    writeFileSync(pdfPath, pdfBuffer);
    execFileSync('pdftoppm', ['-png', '-r', '96', '-f', String(pageNum), '-l', String(pageNum), pdfPath, outPrefix]);
    const pngBuffer = readFileSync(`${outPrefix}-${pageNum}.png`);
    const png = PNG.sync.read(pngBuffer);
    return { width: png.width, height: png.height, data: png.data };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export interface PixelAnalysis {
  distinctLightHues: number;
  margins: { left: number; top: number; right: number; bottom: number };
}

export function analyzePixels(page: RenderedPage): PixelAnalysis {
  const { width, height, data } = page;
  const hues = new Set<number>();

  let minX = width;
  let maxX = -1;
  let minY = height;
  let maxY = -1;

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (!(r === 255 && g === 255 && b === 255)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max > 170 && max - min > 15) {
        hues.add((r >> 4) * 256 + (g >> 4) * 16 + (b >> 4));
      }
    }
  }

  return {
    distinctLightHues: hues.size,
    margins: {
      left: minX,
      top: minY,
      right: width - 1 - maxX,
      bottom: height - 1 - maxY,
    },
  };
}
