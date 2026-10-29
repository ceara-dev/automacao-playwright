import { test as base, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

type Anexo = { nome: string; conteudo: Buffer | string };

type Anexos = { itens: Anexo[] };

type EvidenceFixtures = {
  protocolo: string;
  anexar: (nome: string, conteudo: Buffer | string) => void;
};

function slug(value: string): string {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized.slice(0, 80) || 'cenario';
}

function evidenceStatus(status: string): 'PASSOU' | 'ERROR' | 'PENDENCIA' {
  if (status === 'passed') {
    return 'PASSOU';
  }

  if (status === 'skipped') {
    return 'PENDENCIA';
  }

  return 'ERROR';
}

export const test = base.extend<EvidenceFixtures & { anexos: Anexos }>({
  protocolo: ['geral', { option: true }],

  anexos: async ({}, use) => {
    const itens: Anexo[] = [];

    await use({ itens });
  },

  anexar: async ({ anexos }, use) => {
    await use((nome, conteudo) => anexos.itens.push({ nome, conteudo }));
  },

  page: async ({ page, protocolo, anexos }, use, testInfo) => {
    await use(page);

    const status = evidenceStatus(testInfo.status ?? 'unknown');
    const directory = path.join('playwright-report', slug(protocolo), status);
    fs.mkdirSync(directory, { recursive: true });

    if (status === 'PENDENCIA') {
      fs.writeFileSync(
        path.join(directory, `${slug(testInfo.title)}.md`),
        [
          `# ${testInfo.title}`,
          '',
          `- Protocolo: ${protocolo}`,
          '- Status: PENDENCIA',
          '- Motivo: cenário não executado.',
          '',
        ].join('\n'),
      );

      return;
    }

    const file = path.join(directory, `${slug(testInfo.title)}.png`);

    await page.screenshot({ path: file, fullPage: true }).catch(() => {});

    for (const anexo of anexos.itens) {
      fs.writeFileSync(path.join(directory, anexo.nome), anexo.conteudo);
    }
  },
});

export { expect };
