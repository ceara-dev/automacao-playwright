import { test, expect, type Browser } from '@playwright/test';
import {
  PERFIS, TURMA_3SER, TURMA_9ANO, TURMA_2SER, cache, contextoComo, abrirDiario, abrirMenuImprimir, abrirDialogoBoletim,
  chipDisciplina, gerarBoletimPelaTela, boletimDaTurma, alunosDoDiario, blocos, linhaDoAluno, valores, type Boletim, type Perfil,
} from './boletim';

// Protocolo #7614 — [SAAS] Implementar boletim de notas da turma no Diário.
// Cenários BDD e resultado real: Pendencias-Protocolos/protocolo-7614/ (CT-NN = pasta NN).
// Fluxo observado via Playwright MCP em 01/10/2026 (após a atualização do ambiente): Diário › Imprimir › Boletim de notas
// › diálogo "Boletim de notas (N alunos)" (Disciplinas: Todas/Individual; Alunos: todos marcados) › Gerar
// → "Gerando documento" (fila assíncrona) → "Documento pronto" › Baixar (PDF lido com pdftotext -layout).

// A geração do PDF entra numa fila do servidor e leva ~25 s (até ~1 min em picos): é o único motivo dos timeouts maiores.
test.describe.configure({ timeout: 300_000 });
test.use({ timezoneId: 'America/Sao_Paulo', viewport: { width: 1440, height: 900 } });

test.describe('Protocolo 7614 — Boletim de notas da turma', () => {
  test('CT-01/04/05: gerar o boletim pelo Diário, com escola, ano letivo e turma no cabeçalho', async ({ browser }) => {
    const { context, page } = await contextoComo(browser, PERFIS.ti);
    try {
      const boletim = await gerarBoletimPelaTela(page, TURMA_3SER.diario);
      cache.set(`turma-${TURMA_3SER.diario}`, Promise.resolve(boletim));
      expect(boletim.paginas).toBeGreaterThan(0);
      expect(boletim.texto).toContain('BOLETIM DE NOTAS DA TURMA');
      expect(boletim.texto).toMatch(/Escola\s+Colégio Apoio\s+Ano letivo\s+2026/);
      expect(boletim.texto).toMatch(new RegExp(`Turma\\s+${TURMA_3SER.codigo} — ${TURMA_3SER.descricao}`));
      expect(boletim.texto).toMatch(new RegExp(`Etapa de ensino\\s+${TURMA_3SER.etapa}`));
    } finally {
      await context.close();
    }
  });

  test('CT-02/08: somente os alunos da turma, um por linha, em todas as disciplinas', async ({ browser }) => {
    const boletim = await boletimDaTurma(browser, TURMA_3SER.diario);
    const { context, page } = await contextoComo(browser, PERFIS.ti);
    try {
      await abrirDiario(page, TURMA_3SER.diario);
      const alunos = await alunosDoDiario(page, TURMA_3SER.diario);
      for (const [disciplina, linhas] of blocos(boletim)) {
        expect(linhas, disciplina).toHaveLength(alunos.length);
        for (const a of alunos) expect(linhaDoAluno(linhas, a.nome), `${disciplina} · ${a.nome}`).not.toBe('');
      }
    } finally {
      await context.close();
    }
  });

  test('CT-03: alunos numerados pela ordem da chamada', async ({ browser }) => {
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

  test('CT-06/07: somente as disciplinas (diários) da turma, cada uma com o seu professor', async ({ browser }) => {
    const boletim = await boletimDaTurma(browser, TURMA_3SER.diario);
    const { context, page } = await contextoComo(browser, PERFIS.ti);
    try {
      await page.goto(`/diarios?search=${TURMA_3SER.busca}`, { waitUntil: 'domcontentloaded' });
      const abrir = page.getByRole('button', { name: /^Abrir diário de .* da turma 3º Série$/ });
      await expect(abrir.first()).toBeVisible();
      const componentes = (await abrir.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label') ?? '')))
        .map((n) => n.replace(/^Abrir diário de /, '').replace(/ da turma 3º Série$/, ''));
      const disciplinas = [...blocos(boletim).keys()].filter((k) => k !== 'Frequência anual');
      expect(disciplinas.sort()).toEqual(componentes.sort());
    } finally {
      await context.close();
    }
  });

  test('CT-09: colunas montadas conforme o circuito de cada turma', async ({ browser }) => {
    const [terceira, nono] = await Promise.all([boletimDaTurma(browser, TURMA_3SER.diario), boletimDaTurma(browser, TURMA_9ANO.diario)]);
    for (const b of [terceira, nono]) {
      expect(b.texto).toMatch(/1º Bimestre\s+2º Bimestre\s+1º Semestre\s+3º Bimestre\s+4º Bimestre\s+2º Semestre\s+Etapa Final/);
      expect(b.texto).toMatch(/Nº Aluno\s+AV1\s+AV2\s+REC\s+Média\s+Faltas/);
    }
    // Etapa Final: circuito 9 (3ª Série) tem N1 e N2; circuito 6 (9º Ano) só N1.
    expect(terceira.texto).toMatch(/REC\s+Média\s+N1\s+N2\s+Média\s+Freq\./);
    expect(nono.texto).toMatch(/REC\s+Média\s+N1\s+Média\s+Freq\./);
  });

  test('CT-10/12/14: médias, recuperação e células vazias conforme o circuito', async ({ browser }) => {
    const biologia = blocos(await boletimDaTurma(browser, TURMA_3SER.diario)).get('Biologia')!;
    // Aprovado: 9,00 e 8,00 → 8,50 em cada bimestre e nos semestres.
    expect(valores(linhaDoAluno(biologia, 'Alberto do Nascimento Ferreira Neto')).slice(0, 3)).toEqual(['9,00', '8,00', '8,50']);
    // Recuperação substitui a nota da etapa: 5,00 / 6,00 + REC 8,00 → 8,00.
    expect(valores(linhaDoAluno(biologia, 'Florenço Ferreira da Silva Junior')).slice(0, 4)).toEqual(['5,00', '6,00', '8,00', '8,00']);
    // Recuperação menor não substitui: 6,00 / 6,00 + REC 5,00 → 6,00.
    expect(valores(linhaDoAluno(biologia, 'Giovanna dos Santos Teixeira')).slice(0, 4)).toEqual(['6,00', '6,00', '5,00', '6,00']);
    // Arredondamento: (7,00 + 6,99) ÷ 2 = 6,995 → 7,00.
    expect(valores(linhaDoAluno(biologia, 'Carlos Vinícius Bezerra de Araujo')).slice(0, 3)).toEqual(['7,00', '6,99', '7,00']);
    // Sem AV2: a média do bimestre não é calculada (célula vazia, não "0,00").
    expect(valores(linhaDoAluno(biologia, 'Ingrid Maria do Nascimento dos Santos'))).toEqual(['8,00', '8,00', '8,00', '8,00']);
    // Aluno sem lançamentos: nenhuma nota inventada.
    expect(valores(linhaDoAluno(biologia, 'Yasmim da Silva Rocha'))).toEqual([]);
  });

  test('CT-11/13/25: faltas por período e frequência anual consolidada', async ({ browser }) => {
    const boletim = await boletimDaTurma(browser, TURMA_3SER.diario);
    const anual = blocos(boletim).get('Frequência anual')!;
    expect(anual.length).toBeGreaterThan(0);
    for (const linha of anual) {
      const [, aulas, faltas, freq] = /(\d+)\s+(\d+)\s+(\d+)\s*$/.exec(linha) ?? [];
      expect(Number(freq), linha).toBe(Math.round(((Number(aulas) - Number(faltas)) / Number(aulas)) * 100));
    }
    expect(boletim.texto).toContain('Frequência anual na turma');
    expect(boletim.texto).toContain('Escala: 0,00 a 10,00 | Média de aprovação: 7,00 | Células em branco indicam ausência de registro.');
  });

  test('CT-15: turma sem circuito traz aviso e só a frequência', async ({ browser }) => {
    const boletim = await boletimDaTurma(browser, TURMA_2SER.diario);
    expect(boletim.texto).toContain('A turma não tem circuito de notas ativo neste ano letivo — o boletim traz apenas a frequência.');
    expect(boletim.texto).not.toMatch(/AV1|1º Bimestre/);
  });

  test('CT-16/28: gerar apenas para os alunos e as disciplinas escolhidos', async ({ browser }) => {
    const { context, page } = await contextoComo(browser, PERFIS.ti);
    try {
      const alunos = ['Ana Maria Veras Brito Melo', 'Isaac dos Santos de Sousa Filho'];
      const disciplinas = ['Física', 'Química'];
      const boletim = await gerarBoletimPelaTela(page, TURMA_3SER.diario, { alunos, disciplinas });
      expect(boletim.titulo).toBe('Boletim de notas — 2 alunos');
      expect(boletim.arquivo).toMatch(/-2-alunos\.pdf$/);
      const mapa = blocos(boletim);
      expect([...mapa.keys()]).toEqual([...disciplinas, 'Frequência anual']);
      for (const [bloco, linhas] of mapa) {
        expect(linhas.map((l) => l.trim().replace(/^\d+\s+/, '').replace(/\s{2,}.*$/, '')), bloco).toEqual(alunos);
      }
    } finally {
      await context.close();
    }
  });

  test('CT-28: modo "Individual" exige ao menos uma disciplina e lista as disciplinas da turma', async ({ browser }) => {
    const { context, page } = await contextoComo(browser, PERFIS.ti);
    try {
      const selecao = await abrirDialogoBoletim(page, TURMA_3SER.diario);
      await expect(selecao.getByRole('heading', { name: 'Disciplinas', exact: true })).toBeVisible();
      await selecao.getByRole('button', { name: 'Individual' }).click();
      await expect(selecao.getByRole('heading', { name: 'Disciplinas · 0 de 8' })).toBeVisible();
      await expect(selecao.getByText('Marque as disciplinas que o boletim deve mostrar.')).toBeVisible();
      await expect(selecao.getByRole('button', { name: 'Selecione ao menos uma disciplina' })).toBeDisabled();
      await chipDisciplina(selecao, 'Biologia').click();
      await expect(selecao.getByRole('heading', { name: 'Disciplinas · 1 de 8' })).toBeVisible();
      await expect(selecao.getByRole('button', { name: 'Gerar para todos (24)' })).toBeEnabled();
      await selecao.getByRole('button', { name: 'Todas' }).click();
      await expect(selecao.getByRole('heading', { name: 'Disciplinas', exact: true })).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test('CT-30: gerar pelo menu Imprimir da listagem de Diários dá o mesmo boletim que pela tela do diário', async ({ browser }) => {
    const peloDiario = await boletimDaTurma(browser, TURMA_9ANO.diario);
    const { context, page } = await contextoComo(browser, PERFIS.ti);
    try {
      const pelaListagem = await gerarBoletimPelaTela(page, TURMA_9ANO.diario, { listagem: { busca: TURMA_9ANO.busca, componente: 'Geografia', turma: '9º Ano' } });
      expect(pelaListagem.arquivo).toBe(peloDiario.arquivo);
      // Mesmo conteúdo por disciplina (alunos, notas e frequência), ignorando espaçamento e quebras de página.
      const normalizar = (b: Boletim) => [...blocos(b)].map(([k, linhas]) => [k, linhas.map((l) => l.trim().replace(/\s+/g, ' '))]);
      expect(normalizar(pelaListagem)).toEqual(normalizar(peloDiario));
    } finally {
      await context.close();
    }
  });

  test('CT-29: disciplinas anunciam o estado marcada/desmarcada', async ({ browser }) => {
    const { context, page } = await contextoComo(browser, PERFIS.ti);
    try {
      const selecao = await abrirDialogoBoletim(page, TURMA_3SER.diario);
      await selecao.getByRole('button', { name: 'Individual' }).click();
      await chipDisciplina(selecao, 'Biologia').click();
      await expect(selecao.getByRole('checkbox', { name: 'Biologia' }).or(selecao.getByRole('button', { name: 'Biologia', pressed: true }))).toBeVisible({ timeout: 5_000 });
    } finally {
      await context.close();
    }
  });

  test('CT-24: a continuação de uma tabela repete o nome da disciplina', async ({ browser }) => {
    const boletim = await boletimDaTurma(browser, TURMA_3SER.diario);
    // Cada página que começa com o cabeçalho de colunas deve trazer antes o nome da disciplina.
    for (const pagina of boletim.texto.split('\f').slice(1)) {
      const antesDaTabela = pagina.split(/\n\s+1º Bimestre/)[0];
      if (pagina.includes('1º Bimestre')) expect(antesDaTabela).toMatch(/— Professor\(a\):/);
    }
  });

  test('CT-27: arquivo sem o ano repetido', async ({ browser }) => {
    const boletim = await boletimDaTurma(browser, TURMA_3SER.diario);
    expect(boletim.arquivo).not.toMatch(/2026-2026/);
  });
});

// Regra de acesso: T.I, Gestor, Super Administrador e Profissional imprimem pela listagem de Diários e pelo Diário;
// o Professor, no diário que pertence a ele; o Aluno, somente o boletim da própria matrícula.
test.describe('Protocolo 7614 — acesso ao boletim por perfil', () => {
  type Acesso = { lista: number; itemLista: boolean; diario: number; item: boolean; post: number; permissoes: string[] };

  // Para cada perfil: item "Boletim de notas" no Imprimir do cartão (listagem) e no Diário, e resposta da rota de geração.
  async function acesso(browser: Browser, perfil: Perfil): Promise<Acesso> {
    const { context, page } = await contextoComo(browser, perfil);
    try {
      const lista = (await page.goto(`/diarios?search=${TURMA_3SER.busca}`, { waitUntil: 'domcontentloaded' }))?.status() ?? 0;
      let itemLista = false;
      if (lista === 200) {
        await expect(page.getByRole('searchbox', { name: 'Pesquisar diários' })).toBeVisible({ timeout: 60_000 });
        const cartoes = page.getByRole('button', { name: /^Opções de impressão do diário de .* da turma 3º Série$/ });
        // Espera a lista renderizar (contador "Exibindo de …") antes de contar os cartões; sem diários visíveis, count = 0.
        await expect(page.getByText(/Exibindo de \d+ até \d+ de \d+/)).toBeVisible({ timeout: 60_000 });
        if (await cartoes.count()) {
          await cartoes.first().click();
          await expect(page.getByRole('link', { name: 'Relação de alunos' })).toBeVisible();
          itemLista = await page.getByRole('link', { name: /^Boletim de notas/ }).isVisible();
          await page.keyboard.press('Escape');
        }
      }
      // Props Inertia da página atual (a de erro 403 também traz auth.permissions).
      const permissoes: string[] = await page.evaluate(() => JSON.parse(document.querySelector('script[data-page="app"]')?.textContent ?? '{}').props?.auth?.permissions ?? []);

      const diario = (await page.goto(`/diarios/${TURMA_3SER.diario}`, { waitUntil: 'domcontentloaded' }))?.status() ?? 0;
      let item = false;
      if (diario === 200) {
        await expect(page.getByRole('tab', { name: 'Agendas' })).toBeVisible({ timeout: 60_000 });
        item = await (await abrirMenuImprimir(page)).isVisible();
        await page.keyboard.press('Escape');
      }
      // Geração para 1 aluno (documento pequeno): 202 = aceita; 403 = negada.
      const post = await page.evaluate(async (d) => {
        const token = decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '');
        const r = await fetch(`/diarios/${d}/imprimir/boletim?matriculas[0]=162`, { method: 'POST', headers: { 'X-XSRF-TOKEN': token, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } });
        return r.status;
      }, TURMA_3SER.diario);
      return { lista, itemLista, diario, item, post, permissoes };
    } finally {
      await context.close();
    }
  }

  const permitidos: [string, keyof typeof PERFIS][] = [['CT-17', 'ti'], ['CT-18', 'gestor'], ['CT-19', 'superAdmin']];
  for (const [ct, chave] of permitidos) {
    test(`${ct}: ${PERFIS[chave].nome} imprime o boletim pela listagem e pelo Diário`, async ({ browser }) => {
      const { lista, itemLista, diario, item, post } = await acesso(browser, PERFIS[chave]);
      expect({ lista, itemLista, diario, item, post }).toEqual({ lista: 200, itemLista: true, diario: 200, item: true, post: 202 });
    });
  }

  test('CT-20: Profissional imprime o boletim pelo Diário', async ({ browser }) => {
    const { diario, item, post } = await acesso(browser, PERFIS.profissional);
    expect({ diario, item, post }).toEqual({ diario: 200, item: true, post: 202 });
  });

  test('CT-20: Profissional imprime o boletim pela listagem de Diários', async ({ browser }) => {
    const { lista, itemLista } = await acesso(browser, PERFIS.profissional);
    expect({ lista, itemLista }).toEqual({ lista: 200, itemLista: true });
  });

  test('CT-21: (parcial) o cargo Professor tem a permissão do boletim para os diários que pertencem a ele', async ({ browser }) => {
    // qa.restrito tem o cargo Professor, mas não é titular de nenhum diário: confere a permissão do cargo.
    // A geração por um professor titular depende de uma conta de teste titular (ver o cenário 21).
    const { permissoes } = await acesso(browser, PERFIS.professor);
    expect(permissoes).toEqual(expect.arrayContaining(['diarios.list', 'turmas.diario.print.boletim']));
  });

  test('CT-22: Professor não gera o boletim de um diário que não pertence a ele', async ({ browser }) => {
    const { itemLista, diario, item, post } = await acesso(browser, PERFIS.professor);
    expect({ itemLista, diario, item, post }).toEqual({ itemLista: false, diario: 403, item: false, post: 403 });
  });

  test('CT-23: Aluno não gera o boletim da turma nem de outra matrícula', async ({ browser }) => {
    const { lista, diario, post } = await acesso(browser, PERFIS.aluno);
    expect({ lista, diario, post }).toEqual({ lista: 403, diario: 403, post: 403 });
  });

  test('CT-23: Aluno imprime o boletim da própria matrícula em Meu boletim', async ({ browser }) => {
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
