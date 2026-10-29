import { test, expect, type Page } from '@playwright/test';
import { PDFParse } from 'pdf-parse';
import { exportPdf, extractStudentNames, DEFAULT_PERIODO } from '../../helpers/pdf';
import { renderPdfPage, analyzePixels, isPdfRasterizerAvailable } from '../../helpers/render';

const PERIODO = {
  data_inicio: '2026-08-24',
  data_fim: '2026-09-23',
};

function exportUrl(page: Page, params?: Record<string, string>): string {
  const origin = new URL(page.url()).origin;
  const query = new URLSearchParams(params ?? {});
  return `${origin}/relatorios/notifiq/registro-entrada-saida/export?${query.toString()}`;
}

function dataUrl(page: Page, tipo: string): string {
  const origin = new URL(page.url()).origin;
  return `${origin}/relatorios/notifiq/data?data_inicio=${PERIODO.data_inicio}&data_fim=${PERIODO.data_fim}&tipo=${tipo}`;
}

function contarMatriculas(text: string): number {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /\s\d{1,3}\s/.test(l))
    .filter((l) => !/^--/.test(l))
    .filter((l) => !/^(Aluno|Matrícula|Registro|Colégio|Data:|Escola:|Turma:|Gerado|Página)/.test(l))
    .reduce<Set<string>>((acc, l) => {
      const m = l.match(/\s(\d{1,3})\s/);
      if (m) acc.add(m[1]);
      return acc;
    }, new Set()).size;
}

test.beforeEach(async ({ page }) => {
  await page.goto('/relatorios/notifiq');
  await expect(page.getByRole('heading', { name: 'Relatórios Notifiq' })).toBeVisible();
});

test.describe('CT-NOTIFIQ — sessão e resiliência', () => {
  test('CT-NOTIFIQ-023: sessão expirada invalida a exportação e redireciona para login', async ({ page }) => {
    await page.context().clearCookies();

    const url = exportUrl(page, { data_inicio: PERIODO.data_inicio, data_fim: PERIODO.data_fim, formato: 'pdf' });
    const response = await page.request.get(url, { maxRedirects: 0 });

    const location = response.headers()['location'] ?? '';
    const redirecionado = (response.status() >= 300 && response.status() < 400 && location.includes('/login')) ||
      response.status() === 401 ||
      response.status() === 403;

    expect(redirecionado).toBe(true);
    expect(response.headers()['content-type'] ?? '').not.toContain('application/pdf');
  });

  test('CT-NOTIFIQ-025: duas exportações concorrentes geram PDFs íntegros com os mesmos dados', async ({ page }) => {
    const url = exportUrl(page, { data_inicio: PERIODO.data_inicio, data_fim: PERIODO.data_fim, formato: 'pdf' });

    const [resp1, resp2] = await Promise.all([page.request.get(url), page.request.get(url)]);

    expect(resp1.status()).toBe(200);
    expect(resp2.status()).toBe(200);
    expect(resp1.headers()['content-type']).toContain('application/pdf');
    expect(resp2.headers()['content-type']).toContain('application/pdf');

    const b1 = Buffer.from(await resp1.body());
    const b2 = Buffer.from(await resp2.body());
    expect(b1.length).toBeGreaterThan(1000);
    expect(b2.length).toBeGreaterThan(1000);

    const t1 = await new PDFParse({ data: b1 }).getText();
    const t2 = await new PDFParse({ data: b2 }).getText();
    expect(extractStudentNames(t1.text)).toEqual(extractStudentNames(t2.text));
  });

  test('CT-NOTIFIQ-035: conexão interrompida não entrega PDF', async ({ page, context }) => {
    const url = exportUrl(page, { data_inicio: PERIODO.data_inicio, data_fim: PERIODO.data_fim, formato: 'pdf' });

    await context.setOffline(true);
    let entregouPdf = false;
    try {
      const resp = await page.goto(url);
      entregouPdf = (resp?.headers()['content-type'] ?? '').includes('application/pdf');
    } catch {
      entregouPdf = false;
    } finally {
      await context.setOffline(false);
    }

    expect(entregouPdf).toBe(false);
  });
});

test.describe('CT-NOTIFIQ — validação e acessibilidade', () => {
  test('CT-NOTIFIQ-024: exportar sem pesquisa usa o período padrão exibido na tela', async ({ page }) => {
    const periodo = await page.getByRole('textbox', { name: 'Selecionar período...' }).inputValue();
    const match = periodo.match(/(\d{2})\/(\d{2})\/(\d{4}) - (\d{2})\/(\d{2})\/(\d{4})/);
    expect(match).toBeTruthy();
    const inicio = `${match![3]}-${match![2]}-${match![1]}`;
    const fim = `${match![6]}-${match![5]}-${match![4]}`;

    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('button', { name: 'Visualizar relatório Registro de Entrada e Saída' }).click(),
    ]);

    await expect(popup).toHaveURL(/formato=pdf/);
    expect(popup.url()).toContain(`data_inicio=${inicio}`);
    expect(popup.url()).toContain(`data_fim=${fim}`);
    await popup.close();
  });

  test('CT-NOTIFIQ-026: datas invertidas devem ser rejeitadas com mensagem de validação', async ({ page }) => {
    test.fail(true, 'DEFEITO: a API aceita data_inicio=2026-09-30 e data_fim=2026-09-01 e retorna 200 PDF sem validação');

    const response = await page.request.get(
      exportUrl(page, { data_inicio: '2026-09-30', data_fim: '2026-09-01', formato: 'pdf' })
    );

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('CT-NOTIFIQ-027: script injetado no filtro não é executado', async ({ page }) => {
    let dialogOpened = false;
    page.on('dialog', async (dialog) => {
      dialogOpened = true;
      await dialog.dismiss();
    });

    await page.locator('[id="relatorios.notifiq.escola"]').click({ force: true });
    await page.keyboard.type('<script>alert("xss")</script>');

    expect(dialogOpened).toBe(false);
  });

  test('CT-NOTIFIQ-036: botão Exportar é acionável por teclado e anuncia rótulo acessível', async ({ page }) => {
    const exportar = page.getByRole('button', { name: 'Exportar relatórios Notifiq' });

    await expect(exportar).toBeVisible();
    await expect(exportar).toBeEnabled();

    await exportar.focus();
    await expect(exportar).toBeFocused();

    await expect(exportar).toHaveAttribute('aria-label', /Exportar/);
  });
});

test.describe('CT-NOTIFIQ — integridade de dados do PDF', () => {
  test('CT-NOTIFIQ-028: endpoint sem parâmetros válidos deve rejeitar a requisição', async ({ page }) => {
    test.fail(true, 'DEFEITO: registro-entrada-saida/export retorna 200 PDF mesmo sem data_inicio/data_fim (usa período padrão)');

    const response = await page.request.get(exportUrl(page));

    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.headers()['content-type'] ?? '').not.toContain('application/pdf');
  });

  test('CT-NOTIFIQ-029: Total de alunos bate com o número de linhas do relatório', async ({ page }) => {
    test.fail(true, 'DEFEITO: cabeçalho informa "Total de alunos: 188" mas o relatório lista 183 alunos (5 ausentes)');

    const { text } = await exportPdf(page, DEFAULT_PERIODO);

    const totalAlunos = Number(text.match(/Total de alunos: (\d+)/)?.[1]);
    expect(totalAlunos).toBeGreaterThan(0);

    expect(contarMatriculas(text)).toBe(totalAlunos);
  });

  test('CT-NOTIFIQ-030: soma dos totais por turma iguala o total geral', async ({ page }) => {
    const response = await page.request.get(dataUrl(page, 'presenca-turma'));
    expect(response.status()).toBe(200);

    const data = await response.json();
    const resumo: Array<{ total: number; presencas: number; saidas: number }> = data.resumo;

    expect(resumo.length).toBeGreaterThan(0);

    for (const turma of resumo) {
      expect(turma.presencas + turma.saidas).toBe(turma.total);
    }

    const somaTurmas = resumo.reduce((acc, turma) => acc + turma.total, 0);
    expect(somaTurmas).toBe(data.indicadores.total_registros);
  });

  test('CT-NOTIFIQ-031: ordenação alfabética desconsidera acentos e caixa', async ({ page }) => {
    test.fail(true, 'DEFEITO: a ordenação é sensível a acentos (ex.: "José" aparece antes de "João")');

    const { text } = await exportPdf(page, { ...DEFAULT_PERIODO, turma_id: '1' });

    const names = extractStudentNames(text);
    expect(names.length).toBeGreaterThan(0);

    const sorted = [...names].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
    expect(names).toEqual(sorted);
  });
});

test.describe('CT-NOTIFIQ — endpoint e impressão', () => {
  test('CT-NOTIFIQ-038: endpoint de exportação retorna 200 com application/pdf', async ({ page }) => {
    const response = await page.request.get(
      exportUrl(page, { data_inicio: PERIODO.data_inicio, data_fim: PERIODO.data_fim, formato: 'pdf' })
    );

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/pdf');
    expect(response.headers()['content-disposition']).toContain('.pdf');
  });

  test('CT-NOTIFIQ-039: endpoint legado de .csv deve estar desativado', async ({ page }) => {
    test.fail(true, 'DEFEITO: relatorios/notifiq/export (CSV legado) ainda retorna 200 text/csv em vez de 404/410');

    const origin = new URL(page.url()).origin;
    const response = await page.request.get(
      `${origin}/relatorios/notifiq/export?data_inicio=${PERIODO.data_inicio}&data_fim=${PERIODO.data_fim}`
    );

    expect([404, 410]).toContain(response.status());
  });

  test('CT-NOTIFIQ-040: turma sem registros no período reflete a ausência de dados', async ({ page }) => {
    const vazio = await exportPdf(page, { data_inicio: '2026-12-01', data_fim: '2026-12-31', turma_id: '1' });

    expect(vazio.text).toContain('Sem registro');
    expect(vazio.text).not.toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  test('CT-NOTIFIQ-037: PDF renderiza em proporção A4 sem cortes nas margens', async ({ page }) => {
    test.skip(!isPdfRasterizerAvailable(), 'pdftoppm não está disponível neste ambiente');

    const rendered = await renderPdfPage(page, DEFAULT_PERIODO);
    const { margins } = analyzePixels(rendered);

    const ratio = rendered.width / rendered.height;
    expect(ratio).toBeGreaterThan(0.6);
    expect(ratio).toBeLessThan(0.8);

    expect(margins.left).toBeGreaterThan(10);
    expect(margins.top).toBeGreaterThan(10);
    expect(margins.right).toBeGreaterThan(10);
    expect(margins.bottom).toBeGreaterThan(10);
  });
});

test.describe('CT-NOTIFIQ — cenários sem dados de teste', () => {
  test('CT-NOTIFIQ-032: registro de frequência cruzando a meia-noite', async () => {
    test.skip(true, 'Sem dados de teste: não há registros de entrada/saída próximos à meia-noite no ambiente de homologação');
  });

  test('CT-NOTIFIQ-033: dispositivo com nome longo ou vazio', async () => {
    test.skip(true, 'Sem dados de teste: o ambiente possui apenas dois dispositivos com nomes curtos (APOIO-1-001 e PI-CJP-XX-14)');
  });

  test('CT-NOTIFIQ-034: matrícula com zeros à esquerda', async () => {
    test.skip(true, 'Sem dados de teste: as matrículas do ambiente são inteiros sem zeros à esquerda');
  });
});
