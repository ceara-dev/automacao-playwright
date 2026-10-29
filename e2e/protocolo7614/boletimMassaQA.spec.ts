import { test, expect, type Browser, type Page } from '@playwright/test';
import {
  PERFIS, TURMA_3SER, contextoComo, abrirDiario, abrirDialogoBoletim, gerarBoletimPelaTela, boletimDaTurma,
  celulasDoAluno, frequenciaAnual, type Boletim,
} from './boletim';

// Protocolo #7614 — cenários que dependem da massa QA criada em 01/10/2026 (ver AGENTS.md › "Massa QA do protocolo 7614"):
//   CT-BOLETIM-016, 019, 029, 032 e 034 (pacote ct-boletim) e o cenário 21 do pacote anterior (professor titular).
//
// Massa (homologação, só registros "QA"):
//   turmas QA-7614-A, QA-7614-B e QA-7614-V (vazia), na etapa "Ensino médio - 3ª Série" (circuito 9);
//   "QA Professor 7614": titular de Biologia nas três turmas (um diário por turma);
//   "QA Aluno Duas Turmas 7614": matriculado em A e B; 1 aula em cada turma (3º Bimestre), falta só em B;
//     notas AV1/AV2 = 8,00 em A e 5,00 em B;
//   "QA Aluno Remanejado 7614": matrícula em B com notas 6,00 e situação "Remanejado"; nova matrícula em A com notas 9,00;
//   "QA-Escola 7614" e o usuário "QA T.I Restrito 7614" (cargo T.I, Escolas Permitidas = só a QA-Escola 7614).

test.describe.configure({ timeout: 600_000 });
test.use({ timezoneId: 'America/Sao_Paulo', viewport: { width: 1440, height: 900 } });

const TURMA = { A: 'QA-7614-A', B: 'QA-7614-B', V: 'QA-7614-V' };
const DUAS = 'QA Aluno Duas Turmas 7614';
const REMANEJADO = 'QA Aluno Remanejado 7614';

// Diário de Biologia de cada turma QA (procurado pelo código da turma; pula se a massa não existir).
const diarios = new Map<string, number>();
async function diarioDa(page: Page, codigo: string): Promise<number> {
  if (!diarios.has(codigo)) {
    const props = await page.evaluate(async (c) => {
      const html = await (await fetch(`/diarios?search=${c}`)).text();
      return JSON.parse(html.match(/<script[^>]*data-page="app"[^>]*>([\s\S]*?)<\/script>/)![1]).props;
    }, codigo);
    const d = props.diarios.data.find((x: { turma: { codigo: string } }) => x.turma.codigo === codigo);
    test.skip(!d, `Massa QA ausente: turma ${codigo}`);
    diarios.set(codigo, d.id);
  }
  return diarios.get(codigo)!;
}

// Boletim de uma turma QA gerado pelo T.I (reaproveitado entre os testes do mesmo worker).
const boletins = new Map<string, Promise<Boletim>>();
function boletimQA(browser: Browser, codigo: string): Promise<Boletim> {
  if (!boletins.has(codigo)) {
    boletins.set(codigo, (async () => {
      const { context, page } = await contextoComo(browser, PERFIS.ti);
      try { return await gerarBoletimPelaTela(page, await diarioDa(page, codigo)); } finally { await context.close(); }
    })());
  }
  return boletins.get(codigo)!;
}

async function postBoletim(page: Page, diario: number): Promise<number> {
  return page.evaluate(async (d) => {
    const token = decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '');
    const r = await fetch(`/diarios/${d}/imprimir/boletim?matriculas[0]=162`, { method: 'POST', headers: { 'X-XSRF-TOKEN': token, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } });
    return r.status;
  }, diario);
}

test.describe('Protocolo 7614 — cenário 21: Professor titular', () => {
  test('21: Professor vê só os próprios diários e gera o boletim do diário que pertence a ele', async ({ browser }) => {
    const { context, page } = await contextoComo(browser, PERFIS.professorTitular);
    try {
      await page.goto('/diarios', { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('searchbox', { name: 'Pesquisar diários' })).toBeVisible();
      // Só os 3 diários das turmas QA, que pertencem a ele.
      await expect(page.getByRole('button', { name: /^Abrir diário de / })).toHaveCount(3);
      await expect(page.getByRole('button', { name: /^Abrir diário de Biologia da turma QA 7614 Turma/ })).toHaveCount(3);
      await expect(page.getByRole('button', { name: /^Abrir diário de .* da turma 3º Série$/ })).toHaveCount(0);

      const boletim = await gerarBoletimPelaTela(page, await diarioDa(page, TURMA.A));
      expect(boletim.texto).toMatch(/Turma\s+QA-7614-A — QA 7614 Turma A/);
      expect(boletim.texto).toContain('Biologia — Professor(a): QA Professor 7614');
      expect(boletim.texto).toContain('Gerado por: QA Professor 7614');
    } finally {
      await context.close();
    }
  });

  test('21/22: o mesmo professor não abre nem gera o boletim de um diário de outro professor', async ({ browser }) => {
    const { context, page } = await contextoComo(browser, PERFIS.professorTitular);
    try {
      expect((await page.goto(`/diarios/${TURMA_3SER.diario}`, { waitUntil: 'domcontentloaded' }))?.status()).toBe(403);
      expect(await postBoletim(page, TURMA_3SER.diario)).toBe(403);
    } finally {
      await context.close();
    }
  });
});

test.describe('CT-BOLETIM — cenários com a massa QA', () => {
  test('CT-BOLETIM-016: a frequência de outra turma não compõe o percentual', async ({ browser }) => {
    const [a, b] = await Promise.all([boletimQA(browser, TURMA.A), boletimQA(browser, TURMA.B)]);
    // Turma A: 1 aula, sem falta → 100. Turma B: 1 aula, 1 falta → 0. Somadas seriam 2 aulas e 50%.
    expect(frequenciaAnual(a, DUAS)).toEqual({ aulas: 1, faltas: 0, freq: 100 });
    expect(frequenciaAnual(b, DUAS)).toEqual({ aulas: 1, faltas: 1, freq: 0 });
    // As notas também ficam cada uma na sua turma.
    expect(celulasDoAluno(a, 'Biologia', DUAS)['3º Bimestre|AV1']).toBe('8,00');
    expect(celulasDoAluno(b, 'Biologia', DUAS)['3º Bimestre|AV1']).toBe('5,00');
  });

  test('CT-BOLETIM-029: aluno remanejado — cada boletim só com o que foi registrado na própria turma', async ({ browser }) => {
    const [a, b] = await Promise.all([boletimQA(browser, TURMA.A), boletimQA(browser, TURMA.B)]);
    // Na turma de origem, o PDF marca a situação ao lado do nome; na nova turma, o nome vem sem marca.
    expect(celulasDoAluno(b, 'Biologia', `${REMANEJADO} (Remanejado)`)['3º Bimestre|AV1']).toBe('6,00');
    expect(celulasDoAluno(a, 'Biologia', REMANEJADO)['3º Bimestre|AV1']).toBe('9,00');
    expect(frequenciaAnual(b, REMANEJADO)).toEqual({ aulas: 1, faltas: 0, freq: 100 });
    // A turma de origem continua listando o aluno, com a situação "Remanejado" no diálogo de seleção.
    const { context, page } = await contextoComo(browser, PERFIS.ti);
    try {
      const selecao = await abrirDialogoBoletim(page, await diarioDa(page, TURMA.B));
      await expect(selecao.getByRole('checkbox', { name: new RegExp(`^${REMANEJADO} Matrícula nº \\d+ · Chamada \\d+ · Remanejado$`) })).toBeChecked();
    } finally {
      await context.close();
    }
  });

  test('CT-BOLETIM-032: turma sem alunos — o diálogo informa e permite gerar', async ({ browser }) => {
    const { context, page } = await contextoComo(browser, PERFIS.ti);
    try {
      await abrirDiario(page, await diarioDa(page, TURMA.V));
      await page.getByRole('button', { name: 'Opções de impressão do diário' }).click();
      await page.getByRole('link', { name: /^Boletim de notas/ }).click();
      const selecao = page.getByRole('dialog').last();
      await expect(selecao.getByRole('heading', { name: 'Boletim de notas', exact: true })).toBeVisible();
      await expect(selecao.getByText('Nenhum aluno encontrado para esta turma. O documento sai com o cabeçalho da turma e este aviso.')).toBeVisible();
      await expect(selecao.getByRole('button', { name: 'Gerar sem alunos' })).toBeEnabled();
    } finally {
      await context.close();
    }
  });

  test('CT-BOLETIM-032: PDF com o cabeçalho e "Nenhum aluno encontrado para esta turma"', async ({ browser }) => {
    const { context, page } = await contextoComo(browser, PERFIS.ti);
    try {
      await abrirDiario(page, await diarioDa(page, TURMA.V));
      await page.getByRole('button', { name: 'Opções de impressão do diário' }).click();
      await page.getByRole('link', { name: /^Boletim de notas/ }).click();
      const selecao = page.getByRole('dialog').last();
      await selecao.getByRole('button', { name: 'Gerar sem alunos' }).click();

      const geracao = page.getByRole('alertdialog');
      await expect(geracao.getByRole('heading', { name: 'Documento pronto' })).toBeVisible({ timeout: 180_000 });
      await expect(geracao.getByRole('button', { name: 'Baixar' })).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test('CT-BOLETIM-019: T.I sem acesso à escola não vê os diários dela', async ({ browser }) => {
    const { context, page } = await contextoComo(browser, PERFIS.tiRestrito);
    try {
      await page.goto('/diarios', { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('searchbox', { name: 'Pesquisar diários' })).toBeVisible();
      await expect(page.getByRole('button', { name: /^Abrir diário de / })).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  test('CT-BOLETIM-019: T.I sem acesso à escola não gera o boletim de uma turma dela', async ({ browser }) => {
    const { context, page } = await contextoComo(browser, PERFIS.tiRestrito);
    try {
      expect(await postBoletim(page, TURMA_3SER.diario)).toBe(403);
    } finally {
      await context.close();
    }
  });
});

test.describe('CT-BOLETIM-034 — layout padronizado: Boletim de notas × Boletim individual', () => {
  test('CT-BOLETIM-034: cabeçalho, identificação, grade, legenda, assinatura e rodapé no mesmo padrão', async ({ browser }) => {
    const turma = await boletimDaTurma(browser, TURMA_3SER.diario);
    const { context, page } = await contextoComo(browser, PERFIS.ti);
    try {
      const individual = await gerarBoletimPelaTela(page, TURMA_3SER.diario, { item: 'Boletim individual', alunos: ['Alberto do Nascimento Ferreira Neto'] });
      for (const b of [turma, individual]) {
        // Cabeçalho da escola.
        expect(b.texto).toMatch(/Colégio Apoio\s*\n\s*Avenida Senador Furtado, 632 - Nova Parnaíba\s*\n\s*Fone: \(86\) 3323-8604/);
        // Identificação (rótulo + valor) e grade agrupada por período.
        expect(b.texto).toMatch(/Escola\s+Colégio Apoio/);
        expect(b.texto).toMatch(/Turma\s+3SER-M-2026 — 3º Série/);
        expect(b.texto).toMatch(/Ano letivo\s+2026/);
        expect(b.texto).toMatch(/Etapa de ensino\s+Ensino médio - 3ª Série/);
        expect(b.texto).toMatch(/1º Bimestre\s+2º Bimestre\s+1º Semestre\s+3º Bimestre\s+4º Bimestre\s+2º Semestre\s+Etapa Final/);
        expect(b.texto).toMatch(/AV1\s+AV2\s+REC\s+Média\s+Faltas/);
        // Legenda, local/data, assinatura e rodapé.
        expect(b.texto).toContain('Escala: 0,00 a 10,00 | Média de aprovação: 7,00 | Células em branco indicam ausência de registro.');
        expect(b.texto).toMatch(/Parnaíba - PI,\s+de\s+de/);
        expect(b.texto).toContain('Assinatura do(a) Diretor(a)');
        expect(b.texto).toMatch(/Gerado por: QA T\.I 7614 \| Data: \d{2}\/\d{2}\/\d{4} \d{2}:\d{2} \| Página 1 de \d+/);
      }
      expect(turma.texto).toContain('BOLETIM DE NOTAS DA TURMA');
      expect(individual.texto).toContain('BOLETIM INDIVIDUAL');
      expect(individual.texto).toMatch(/Escola\s+Colégio Apoio\s+Nº\s+1\s*\n\s*Aluno\s+Alberto do Nascimento Ferreira Neto/);
      // Mesmas notas nos dois documentos.
      expect(individual.texto).toMatch(/Biologia\s+9,00\s+8,00\s+8,50/);
    } finally {
      await context.close();
    }
  });
});
