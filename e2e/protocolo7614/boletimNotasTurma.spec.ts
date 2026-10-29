import { test, expect, type Browser, type Page } from '@playwright/test';
import {
  PERFIS, TURMA_3SER, TURMA_9ANO, contextoComo, abrirDiario, abrirMenuImprimir, abrirDialogoBoletim, gerarBoletimPelaTela,
  boletimDaTurma, alunosDoDiario, blocos, linhaDoAluno, celulasDoAluno, camposDaDisciplina, frequenciaAnual, type Perfil,
} from './boletim';

// Protocolo #7614 — cenários CT-BOLETIM-001 a 033 (Boletim de notas da turma no Diário).
// BDD e resultado real: Pendencias-Protocolos/protocolo-7614/ct-boletim/ (pasta NN = CT-BOLETIM-0NN).
//
// Perfis considerados: T.I, Gestor, Super Administrador, Profissional, Professor e Aluno.
// Regra de acesso: T.I, Gestor, Super Administrador e Profissional imprimem pela listagem de Diários e pelo Diário;
// o Professor, no diário que pertence a ele; o Aluno, somente o boletim da própria matrícula.
//
// Massa do protocolo × massa do sistema (homologação, 01/10/2026):
//   "Escola Municipal Exemplo" → Colégio Apoio; ano letivo "2026" → 2026 (único ano cadastrado);
//   "5º Ano A" → 3SER-M-2026 (circuito 9, 8 disciplinas, 24 alunos); "5º Ano B" → 9ANO-M-2026 (circuito 6);
//   "Língua Portuguesa / Matemática / Ciências" → Biologia / Física / Química; "Inglês" (fora da turma) → ausente no 9º Ano;
//   alunos → os alunos com as notas lançadas por e2e/lancamentos/notas3Serie.spec.ts (uma condição por aluno).

// A geração do PDF entra numa fila do servidor (~10 s; em picos, alguns minutos): é o único motivo dos timeouts maiores.
test.describe.configure({ timeout: 600_000 });
test.use({ timezoneId: 'America/Sao_Paulo', viewport: { width: 1440, height: 900 } });

const ALUNO = {
  aprovado: 'Alberto do Nascimento Ferreira Neto', // 9,00 e 8,00 → 8,50 em todos os bimestres
  recuperacao: 'Florenço Ferreira da Silva Junior', // 5,00 e 6,00 + REC 8,00 → 8,00
  recMenor: 'Giovanna dos Santos Teixeira', // 6,00 e 6,00 + REC 5,00 → 6,00; 1 falta em Biologia e 1 em Física
  parcial: 'Ingrid Maria do Nascimento dos Santos', // só AV1 8,00
  zero: 'Davi Silva Lima', // 0,00 e 0,00
  semRegistro: 'Yasmim da Silva Rocha', // sem notas
  nomeLongo: 'Carlos Alexandre Cardozo da Silva Fonseca', // 41 caracteres, o maior da turma
  outraTurma: 'Vitor Bruno Diniz Bergamine de Sousa', // aluno do 9º Ano
};
const BIM = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'];

// Notas do diário de Biologia: o boletim usa a grade da tela "Registro de notas/conceitos".
async function lancarNota(page: Page, diario: number, etapa: string, aluno: string, campo: string, valor: string): Promise<void> {
  await abrirDiario(page, diario);
  await page.getByRole('combobox', { name: 'Filtro por etapa' }).click({ force: true });
  await page.getByRole('option', { name: etapa, exact: true }).click();
  await page.getByRole('tab', { name: 'Registro de notas/conceitos' }).click();
  await expect(page.getByRole('columnheader', { name: 'Nota da Etapa' })).toBeVisible();
  const colunas = (await page.getByRole('columnheader').allTextContents()).map((t) => t.trim());
  // A página também tem a tabela de etapas: as colunas de nota contam a partir de "Aluno".
  const inicio = colunas.indexOf('Aluno');
  const indice = colunas.findIndex((c, i) => i > inicio && c.startsWith(campo)) - inicio - 1;
  const linha = page.getByRole('row').filter({ has: page.getByRole('cell', { name: aluno, exact: true }) });
  const caixa = linha.getByRole('textbox').nth(indice);
  const gravou = page.waitForResponse((r) => r.url().endsWith(`/diarios/${diario}/notas`) && r.request().method() === 'POST');
  await caixa.fill(valor);
  await caixa.blur();
  expect((await gravou).status()).toBe(200);
}

// Rota de geração chamada direto da página (sem a tela): 202 = aceita; 401/403 = negada.
async function postBoletim(page: Page, diario: number): Promise<number> {
  return page.evaluate(async (d) => {
    const token = decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '');
    const r = await fetch(`/diarios/${d}/imprimir/boletim?matriculas[0]=162`, { method: 'POST', headers: { 'X-XSRF-TOKEN': token, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } });
    return r.status;
  }, diario);
}

async function permissoes(page: Page): Promise<string[]> {
  return page.evaluate(() => JSON.parse(document.querySelector('script[data-page="app"]')?.textContent ?? '{}').props?.auth?.permissions ?? []);
}

test.describe('CT-BOLETIM-001 — gerar o boletim pelo Diário, por perfil', () => {
  const geram: [string, Perfil][] = [['T.I', PERFIS.ti], ['Gestor', PERFIS.gestor], ['Super Administrador', PERFIS.superAdmin], ['Profissional', PERFIS.profissional]];
  for (const [tipo, perfil] of geram) {
    test(`CT-BOLETIM-001: ${tipo} gera o boletim da turma pelo Diário`, async ({ browser }) => {
      const { context, page } = await contextoComo(browser, perfil);
      try {
        const boletim = await gerarBoletimPelaTela(page, TURMA_3SER.diario);
        expect(boletim.texto).toContain('BOLETIM DE NOTAS DA TURMA');
        expect(boletim.texto).toMatch(new RegExp(`Turma\\s+${TURMA_3SER.codigo} — ${TURMA_3SER.descricao}`));
        expect(boletim.paginas).toBeGreaterThan(0);
      } finally {
        await context.close();
      }
    });
  }

  test('CT-BOLETIM-001: Professor — o cargo tem a permissão do boletim para o diário que pertence a ele', async ({ browser }) => {
    // qa.restrito (Professor) não é titular de nenhum diário: confere a permissão do cargo. A geração por um
    // professor titular depende de uma conta de teste titular (ver o cenário 01).
    const { context, page } = await contextoComo(browser, PERFIS.professor);
    try {
      await page.goto('/diarios', { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('searchbox', { name: 'Pesquisar diários' })).toBeVisible();
      expect(await permissoes(page)).toEqual(expect.arrayContaining(['diarios.list', 'turmas.diario.print.boletim']));
    } finally {
      await context.close();
    }
  });

  test('CT-BOLETIM-001: Aluno imprime o boletim da própria matrícula em Meu boletim', async ({ browser }) => {
    const { context, page } = await contextoComo(browser, PERFIS.alunoMatriculado);
    try {
      await page.goto('/meu-boletim', { waitUntil: 'domcontentloaded' });
      const imprimir = page.locator('[id^="boletim_aluno.btn_imprimir-"]').first();
      await expect(imprimir).toBeVisible({ timeout: 60_000 });
      const href = await imprimir.getAttribute('href');
      expect(href).toMatch(/\/meu-boletim\/[^/]+\/imprimir$/);

      // O aluno só imprime a própria matrícula: o GET devolve o PDF recortado.
      const pdf = await page.request.get(href!);
      expect(pdf.status()).toBe(200);
      expect(pdf.headers()['content-type']).toContain('application/pdf');
    } finally {
      await context.close();
    }
  });
});

test.describe('CT-BOLETIM — conteúdo do boletim', () => {
  test('CT-BOLETIM-002/015: somente os alunos enturmados na turma; aluno de outra turma não aparece', async ({ browser }) => {
    const boletim = await boletimDaTurma(browser, TURMA_3SER.diario);
    const { context, page } = await contextoComo(browser, PERFIS.ti);
    try {
      await abrirDiario(page, TURMA_3SER.diario);
      const alunos = (await alunosDoDiario(page, TURMA_3SER.diario)).map((a) => a.nome);
      for (const [disciplina, linhas] of blocos(boletim)) {
        expect(linhas.map((l) => l.trim().replace(/^\d+\s+/, '').replace(/\s{2,}.*$/, '').replace(/ \d.*$/, '')), disciplina).toEqual(alunos);
      }
      expect(boletim.texto).not.toContain(ALUNO.outraTurma);
    } finally {
      await context.close();
    }
  });

  test('CT-BOLETIM-003: alunos na sequência da chamada', async ({ browser }) => {
    const boletim = await boletimDaTurma(browser, TURMA_9ANO.diario);
    const { context, page } = await contextoComo(browser, PERFIS.ti);
    try {
      await abrirDiario(page, TURMA_9ANO.diario);
      const linhas = [...blocos(boletim).values()][0];
      for (const a of (await alunosDoDiario(page, TURMA_9ANO.diario)).filter((x) => x.ordem !== null)) {
        expect(linhaDoAluno(linhas, a.nome), a.nome).toMatch(new RegExp(`^\\s+${a.ordem}\\s+${a.nome}`));
      }
    } finally {
      await context.close();
    }
  });

  test('CT-BOLETIM-004/005: cabeçalho com escola, ano letivo e turma da turma acessada', async ({ browser }) => {
    const boletim = await boletimDaTurma(browser, TURMA_3SER.diario);
    expect(boletim.texto).toMatch(/Escola\s+Colégio Apoio\s+Ano letivo\s+2026/);
    expect(boletim.texto).toMatch(new RegExp(`Turma\\s+${TURMA_3SER.codigo} — ${TURMA_3SER.descricao}`));
    // 2026 é o único ano letivo cadastrado: não há notas de 2025 para misturar (ver cenários 04 e 25).
    expect(boletim.texto).not.toMatch(/2025/);
  });

  test('CT-BOLETIM-006/014: disciplinas da turma, cada uma com os seus dados; disciplina de fora não aparece', async ({ browser }) => {
    const [terceira, nono] = await Promise.all([boletimDaTurma(browser, TURMA_3SER.diario), boletimDaTurma(browser, TURMA_9ANO.diario)]);
    const disciplinas = (b: typeof terceira) => [...blocos(b).keys()].filter((k) => k !== 'Frequência anual');
    expect(disciplinas(terceira)).toEqual(['Biologia', 'Filosofia', 'Física', 'Geografia', 'Língua /Literatura estrangeira - Espanhol', 'Língua /Literatura estrangeira - Inglês', 'Química', 'Sociologia']);
    // Biologia e Inglês existem na escola (3ª Série), mas não fazem parte do 9º Ano.
    expect(disciplinas(nono)).toEqual(['Ensino religioso', 'Geografia', 'Língua /Literatura estrangeira - Espanhol', 'Química']);
    expect(nono.texto).not.toMatch(/Biologia|Inglês/);
    // Dados ligados à disciplina: a falta lançada só em Física (3º Bimestre) não aparece em Biologia nesse período.
    expect(celulasDoAluno(terceira, 'Física', ALUNO.recMenor)['3º Bimestre|Faltas']).toBe('1');
    expect(celulasDoAluno(terceira, 'Biologia', ALUNO.recMenor)['3º Bimestre|Faltas']).toBeUndefined();
  });

  test('CT-BOLETIM-007: um aluno por linha, com "Nº" e "Aluno" como primeiras colunas', async ({ browser }) => {
    const boletim = await boletimDaTurma(browser, TURMA_3SER.diario);
    for (const [disciplina, linhas] of blocos(boletim)) {
      if (disciplina === 'Frequência anual') continue;
      expect(linhas, disciplina).toHaveLength(24);
      expect(new Set(linhas.map((l) => l.trim().split(/\s+/)[0])).size, disciplina).toBe(24);
    }
    expect(boletim.texto).toMatch(/^\s*Nº Aluno\s+AV1/m);
  });

  test('CT-BOLETIM-008/023/024: colunas montadas conforme o circuito de cada turma e de cada período', async ({ browser }) => {
    const [terceira, nono] = await Promise.all([boletimDaTurma(browser, TURMA_3SER.diario), boletimDaTurma(browser, TURMA_9ANO.diario)]);
    const bimestre = ['AV1', 'AV2', 'REC', 'Média', 'Faltas'];
    const semestre = ['REC', 'Média'];
    // Circuito 9 (3ª Série): Etapa Final com N1 e N2; circuito 6 (9º Ano): só N1.
    expect(camposDaDisciplina(terceira, 'Biologia')).toEqual([...bimestre, ...bimestre, ...semestre, ...bimestre, ...bimestre, ...semestre, 'N1', 'N2', 'Média', 'Freq.']);
    expect(camposDaDisciplina(nono, 'Geografia')).toEqual([...bimestre, ...bimestre, ...semestre, ...bimestre, ...bimestre, ...semestre, 'N1', 'Média', 'Freq.']);
  });

  test('CT-BOLETIM-009: média do bimestre pela regra do circuito, REC e faltas do período', async ({ browser }) => {
    const boletim = await boletimDaTurma(browser, TURMA_3SER.diario);
    const rec = celulasDoAluno(boletim, 'Biologia', ALUNO.recuperacao);
    // Regra do circuito 9: média aritmética de AV1 e AV2; a REC substitui a média quando é maior.
    expect([rec['1º Bimestre|AV1'], rec['1º Bimestre|AV2'], rec['1º Bimestre|REC'], rec['1º Bimestre|Média']]).toEqual(['5,00', '6,00', '8,00', '8,00']);
    const menor = celulasDoAluno(boletim, 'Biologia', ALUNO.recMenor);
    expect([menor['1º Bimestre|REC'], menor['1º Bimestre|Média'], menor['1º Bimestre|Faltas']]).toEqual(['5,00', '6,00', '1']);
  });

  test('CT-BOLETIM-010: resultados semestrais conforme o circuito', async ({ browser }) => {
    const boletim = await boletimDaTurma(browser, TURMA_3SER.diario);
    for (const aluno of [ALUNO.aprovado, ALUNO.recuperacao, ALUNO.recMenor]) {
      const c = celulasDoAluno(boletim, 'Biologia', aluno);
      const media = (a: string, b: string) => ((Number(c[`${a}|Média`].replace(',', '.')) + Number(c[`${b}|Média`].replace(',', '.'))) / 2).toFixed(2).replace('.', ',');
      expect(c['1º Semestre|Média'], aluno).toBe(media('1º Bimestre', '2º Bimestre'));
      expect(c['2º Semestre|Média'], aluno).toBe(media('3º Bimestre', '4º Bimestre'));
    }
  });

  test('CT-BOLETIM-011/033: percentual de frequência anual (100% e 0%)', async ({ browser }) => {
    const boletim = await boletimDaTurma(browser, TURMA_3SER.diario);
    expect(boletim.texto).toContain('Frequência anual na turma');
    expect(frequenciaAnual(boletim, ALUNO.aprovado)).toEqual({ aulas: 2, faltas: 0, freq: 100 });
    expect(frequenciaAnual(boletim, ALUNO.recMenor)).toEqual({ aulas: 2, faltas: 2, freq: 0 });
    for (const linha of blocos(boletim).get('Frequência anual')!) {
      const [, aulas, faltas, freq] = /(\d+)\s+(\d+)\s+(\d+)\s*$/.exec(linha) ?? [];
      expect(Number(freq), linha).toBe(Math.round(((Number(aulas) - Number(faltas)) / Number(aulas)) * 100));
    }
  });

  test('CT-BOLETIM-013/028: célula sem nota fica vazia; aluno sem registro não ganha valores', async ({ browser }) => {
    const boletim = await boletimDaTurma(browser, TURMA_3SER.diario);
    for (const disciplina of ['Biologia', 'Física', 'Química']) {
      const parcial = celulasDoAluno(boletim, disciplina, ALUNO.parcial);
      for (const b of BIM) {
        expect(parcial[`${b}|AV1`], `${disciplina} · ${b}`).toBe('8,00');
        expect(parcial[`${b}|AV2`], `${disciplina} · ${b}`).toBeUndefined();
        expect(parcial[`${b}|Média`], `${disciplina} · ${b}`).toBeUndefined();
      }
      // Sem notas: nenhuma célula de nota ou média preenchida (só faltas/frequência, quando há aula).
      const vazio = celulasDoAluno(boletim, disciplina, ALUNO.semRegistro);
      expect(Object.keys(vazio).filter((k) => !/Faltas|Freq\./.test(k)), disciplina).toEqual([]);
    }
    // Na posição da chamada (24º).
    expect(linhaDoAluno(blocos(boletim).get('Biologia')!, ALUNO.semRegistro)).toMatch(new RegExp(`^\\s+24\\s+${ALUNO.semRegistro}`));
  });

  test('CT-BOLETIM-027: nota zero aparece como "0,00", diferente de célula sem registro', async ({ browser }) => {
    const boletim = await boletimDaTurma(browser, TURMA_3SER.diario);
    const zero = celulasDoAluno(boletim, 'Biologia', ALUNO.zero);
    expect([zero['1º Bimestre|AV1'], zero['1º Bimestre|AV2'], zero['1º Bimestre|Média']]).toEqual(['0,00', '0,00', '0,00']);
    expect(celulasDoAluno(boletim, 'Biologia', ALUNO.semRegistro)['1º Bimestre|AV1']).toBeUndefined();
  });

  test('CT-BOLETIM-022/031: grade agrupada por período e cabeçalho repetido em cada página', async ({ browser }) => {
    const boletim = await boletimDaTurma(browser, TURMA_3SER.diario);
    const paginas = boletim.texto.split('\f').filter((p) => p.trim());
    expect(paginas).toHaveLength(boletim.paginas);
    for (const [i, pagina] of paginas.entries()) {
      expect(pagina, `página ${i + 1}`).toContain('Colégio Apoio');
      expect(pagina, `página ${i + 1}`).toMatch(new RegExp(`Página ${i + 1} de ${boletim.paginas}`));
      // Toda tabela (inclusive a continuação na página seguinte) traz os títulos dos períodos e das colunas.
      if (/^\s*Nº\s+Aluno\s+AV1/m.test(pagina)) {
        expect(pagina, `página ${i + 1}`).toMatch(/1º Bimestre\s+2º Bimestre\s+1º Semestre\s+3º Bimestre\s+4º Bimestre\s+2º Semestre\s+Etapa Final/);
      }
    }
    // 24 alunos × 8 disciplinas (a maior turma com circuito; não há turma com 45 alunos e 12 disciplinas).
    expect([...blocos(boletim).keys()].filter((k) => k !== 'Frequência anual')).toHaveLength(8);
    expect(blocos(boletim).get('Frequência anual')).toHaveLength(24);
  });

  test('CT-BOLETIM-035: uma disciplina por página, pela listagem de Diários', async ({ browser }) => {
    // Percorre o caminho do cenário: Diários › Imprimir do cartão › Boletim de notas › Gerar.
    const { context, page } = await contextoComo(browser, PERFIS.ti);
    try {
      const boletim = await gerarBoletimPelaTela(page, TURMA_3SER.diario, {
        listagem: { busca: TURMA_3SER.busca, componente: 'Biologia', turma: TURMA_3SER.descricao },
      });
      const paginas = boletim.texto.split('\f');
      const disciplinasPorPagina = paginas.map((pagina) => {
        const nomes = new Set<string>();
        for (const m of pagina.matchAll(/^(.+?)(?: \(continuação\))? — Professor\(a\): /gm)) {
          nomes.add(m[1].trim());
        }
        return [...nomes];
      });

      // Nenhuma página mistura duas disciplinas, nem nas continuações.
      disciplinasPorPagina.forEach((nomes, indice) => {
        expect(nomes.length, `página ${indice + 1} mistura: ${nomes.join(' + ')}`).toBeLessThanOrEqual(1);
      });

      const primeira = new Map<string, number>();
      const ultima = new Map<string, number>();
      disciplinasPorPagina.forEach((nomes, indice) => {
        for (const nome of nomes) {
          if (!primeira.has(nome)) primeira.set(nome, indice);
          ultima.set(nome, indice);
        }
      });

      // A primeira página de cada disciplina vem depois da última página da anterior,
      // mesmo quando a anterior ocupou várias páginas.
      const ordem = [...primeira.entries()].sort((a, b) => a[1] - b[1]).map(([nome]) => nome);
      expect(ordem.length).toBeGreaterThan(1);
      for (let i = 1; i < ordem.length; i++) {
        expect(primeira.get(ordem[i])!, `início de ${ordem[i]}`).toBeGreaterThan(ultima.get(ordem[i - 1])!);
      }
    } finally {
      await context.close();
    }
  });

  test('CT-BOLETIM-036: a assinatura fecha a frequência anual, sem ficar sozinha na última página', async ({ browser }) => {
    const boletim = await boletimDaTurma(browser, TURMA_3SER.diario);
    const paginas = boletim.texto.split('\f').filter((p) => p.trim());
    const comAssinatura = paginas.flatMap((pagina, indice) => (pagina.includes('Assinatura do(a) Diretor(a)') ? [indice] : []));
    // Uma assinatura só, na última página, junto da legenda e de pelo menos o último aluno da frequência anual.
    expect(comAssinatura).toEqual([paginas.length - 1]);
    const ultimaPagina = paginas[paginas.length - 1];
    expect(ultimaPagina).toContain('Escala:');
    const frequencia = blocos(boletim).get('Frequência anual')!;
    expect(ultimaPagina).toContain(frequencia[frequencia.length - 1].trim());
  });

  test('CT-BOLETIM-030: nome longo e acentos exibidos por inteiro', async ({ browser }) => {
    const boletim = await boletimDaTurma(browser, TURMA_3SER.diario);
    for (const nome of [ALUNO.nomeLongo, 'Maria Luíza de Alcântara Moura Costa', 'Florenço Ferreira da Silva Junior', 'Luna Vitória Fontenele da Silva']) {
      // O nome inteiro, seguido de espaço ou fim de linha (não colado nas notas).
      expect(linhaDoAluno(blocos(boletim).get('Biologia')!, nome), nome).toMatch(new RegExp(`\\d+ ${nome}(\\s|$)`));
    }
    // A célula AV1 do nome mais longo continua na coluna certa.
    expect(celulasDoAluno(boletim, 'Biologia', ALUNO.nomeLongo)['1º Bimestre|AV1']).toBe('7,00');
  });
});

test.describe('CT-BOLETIM-012/026 — nota alterada no Diário', () => {
  // ATENÇÃO: grava uma nota na homologação (AV1 do 1º Bimestre de Biologia do aluno "aprovado") e devolve o valor original.
  test('CT-BOLETIM-012/026: a nota alterada aparece na célula da disciplina e do período certos', async ({ page, browser }) => {
    try {
      await lancarNota(page, TURMA_3SER.diario, '1º Bimestre', ALUNO.aprovado, 'AV1', '7,50');
      const { context, page: ti } = await contextoComo(browser, PERFIS.ti);
      try {
        const boletim = await gerarBoletimPelaTela(ti, TURMA_3SER.diario, { alunos: [ALUNO.aprovado], disciplinas: ['Biologia', 'Física'] });
        const biologia = celulasDoAluno(boletim, 'Biologia', ALUNO.aprovado);
        const fisica = celulasDoAluno(boletim, 'Física', ALUNO.aprovado);
        // (7,50 + 8,00) ÷ 2 = 7,75 só em Biologia, 1º Bimestre; Física e os demais bimestres continuam 9,00 / 8,50.
        expect([biologia['1º Bimestre|AV1'], biologia['1º Bimestre|Média'], biologia['2º Bimestre|AV1']]).toEqual(['7,50', '7,75', '9,00']);
        expect([fisica['1º Bimestre|AV1'], fisica['1º Bimestre|Média']]).toEqual(['9,00', '8,50']);
      } finally {
        await context.close();
      }
    } finally {
      await lancarNota(page, TURMA_3SER.diario, '1º Bimestre', ALUNO.aprovado, 'AV1', '9,00');
    }
  });
});

test.describe('CT-BOLETIM — segurança e usabilidade', () => {
  async function opcaoNoDiario(browser: Browser, perfil: Perfil): Promise<{ diario: number; item: boolean; post: number }> {
    const { context, page } = await contextoComo(browser, perfil);
    try {
      const diario = (await page.goto(`/diarios/${TURMA_3SER.diario}`, { waitUntil: 'domcontentloaded' }))?.status() ?? 0;
      let item = false;
      if (diario === 200) {
        await expect(page.getByRole('tab', { name: 'Agendas' })).toBeVisible();
        item = await (await abrirMenuImprimir(page)).isVisible();
      }
      return { diario, item, post: await postBoletim(page, TURMA_3SER.diario) };
    } finally {
      await context.close();
    }
  }

  // "Secretaria" não existe no sistema; os perfis sem acesso ao diário de outra pessoa são o Professor não titular e o Aluno.
  test('CT-BOLETIM-017: Professor não titular não vê a opção no diário de outro professor', async ({ browser }) => {
    expect(await opcaoNoDiario(browser, PERFIS.professor)).toEqual({ diario: 403, item: false, post: 403 });
  });

  test('CT-BOLETIM-017: Aluno não vê a opção do boletim da turma', async ({ browser }) => {
    expect(await opcaoNoDiario(browser, PERFIS.aluno)).toEqual({ diario: 403, item: false, post: 403 });
  });

  test('CT-BOLETIM-018: acesso direto do Professor não titular é negado', async ({ browser }) => {
    const { context, page } = await contextoComo(browser, PERFIS.professor);
    try {
      expect(await postBoletim(page, TURMA_3SER.diario)).toBe(403);
      await page.goto(`/diarios/${TURMA_3SER.diario}`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText('Acesso não permitido')).toBeVisible();
      await expect(page.getByText('Você não tem permissão para acessar esta página.')).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test('CT-BOLETIM-018: mensagem "Acesso não permitido"', async ({ browser }) => {
    const { context, page } = await contextoComo(browser, PERFIS.professor);
    try {
      await page.goto(`/diarios/${TURMA_3SER.diario}`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText('Acesso não permitido')).toBeVisible({ timeout: 5_000 });
    } finally {
      await context.close();
    }
  });

  test('CT-BOLETIM-020: com a sessão expirada, nenhum PDF é gerado', async ({ browser }) => {
    const { context, page } = await contextoComo(browser, PERFIS.ti);
    try {
      const selecao = await abrirDialogoBoletim(page, TURMA_3SER.diario);
      await context.clearCookies();
      const resposta = page.waitForResponse((r) => r.url().includes(`/diarios/${TURMA_3SER.diario}/imprimir/boletim`));
      await selecao.getByRole('button', { name: /^Gerar para todos \(\d+\)$/ }).click();
      // Sessão expirada: o backend responde 302 para o login e o cliente segue.
      expect((await resposta).status()).toBe(302);
      await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
      await expect(page.getByRole('button', { name: 'Baixar' })).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  test('CT-BOLETIM-020: sessão expirada redireciona para o login', async ({ browser }) => {
    const { context, page } = await contextoComo(browser, PERFIS.ti);
    try {
      const selecao = await abrirDialogoBoletim(page, TURMA_3SER.diario);
      await context.clearCookies();
      await selecao.getByRole('button', { name: /^Gerar para todos \(\d+\)$/ }).click();
      await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    } finally {
      await context.close();
    }
  });

  // Gera o boletim de 1 aluno (documento pequeno) e conta os pedidos de geração enviados.
  async function gerarComClique(page: Page, clique: 'click' | 'dblclick'): Promise<string[]> {
    const pedidos: string[] = [];
    page.on('request', (r) => { if (r.method() === 'POST' && r.url().includes('/imprimir/boletim')) pedidos.push(r.url()); });
    const selecao = await abrirDialogoBoletim(page, TURMA_3SER.diario);
    await selecao.getByRole('button', { name: 'Desmarcar todos' }).click();
    await selecao.getByRole('checkbox', { name: new RegExp(`^${ALUNO.aprovado}`) }).click();
    await selecao.getByRole('button', { name: `Gerar para ${ALUNO.aprovado}` })[clique]();
    return pedidos;
  }

  test('CT-BOLETIM-021: indicador de processamento até o documento ficar pronto', async ({ browser }) => {
    const { context, page } = await contextoComo(browser, PERFIS.ti);
    try {
      await gerarComClique(page, 'click');
      const geracao = page.getByRole('alertdialog');
      await expect(geracao.getByRole('heading', { name: 'Gerando documento' }).or(geracao.getByRole('heading', { name: 'Documento pronto' }))).toBeVisible();
      await expect(geracao.getByRole('list', { name: 'Etapas da geração' })).toBeVisible();
      // Fila assíncrona do servidor (ver comentário no topo).
      await expect(geracao.getByRole('heading', { name: 'Documento pronto' })).toBeVisible({ timeout: 420_000 });
      await expect(geracao.getByRole('button', { name: 'Baixar' })).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test('CT-BOLETIM-021: clique duplo em "Gerar" não dispara a geração duas vezes', async ({ browser }) => {
    const { context, page } = await contextoComo(browser, PERFIS.ti);
    try {
      const pedidos = await gerarComClique(page, 'dblclick');
      // O indicador continua aberto: o segundo clique não cai no "Fechar".
      const geracao = page.getByRole('alertdialog');
      await expect(geracao.getByRole('heading', { name: 'Documento pronto' })).toBeVisible({ timeout: 420_000 });
      expect(pedidos).toHaveLength(1);
    } finally {
      await context.close();
    }
  });

  test('CT-BOLETIM-021: o indicador continua visível depois de um clique duplo em "Gerar"', async ({ browser }) => {
    const { context, page } = await contextoComo(browser, PERFIS.ti);
    try {
      await gerarComClique(page, 'dblclick');
      const geracao = page.getByRole('alertdialog');
      await expect(geracao.getByRole('heading', { name: 'Documento pronto' })).toBeVisible({ timeout: 180_000 });
    } finally {
      await context.close();
    }
  });
});

test.describe('CT-BOLETIM — sem massa de teste na homologação', () => {
  // 016, 019, 029 e 032 rodam com a massa QA em boletimMassaQA.spec.ts.
  const semMassa: [string, string][] = [
    ['CT-BOLETIM-025', 'só existe o ano letivo 2026'],
  ];
  for (const [ct, motivo] of semMassa) {
    test(`${ct}: sem massa de teste`, () => {
      test.skip(true, `Sem massa: ${motivo}`);
    });
  }
});
