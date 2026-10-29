import { expect, type Browser, type BrowserContext, type Page, type Locator } from '@playwright/test';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Helpers do boletim de notas da turma (protocolo #7614), compartilhados pelos specs desta pasta.
// Fluxo: Diário › Imprimir › Boletim de notas › diálogo "Boletim de notas (N alunos)" › Gerar
// → "Gerando documento" (fila assíncrona) → "Documento pronto" › Baixar (PDF lido com pdftotext -layout).

export const BASE_URL = 'http://veramendes.local';
export const SENHA_QA = process.env.QA_7614_PASSWORD ?? '';

export type Perfil = { nome: string; email: string; senha: string };
export const PERFIS: Record<string, Perfil> = {
  ti: { nome: 'T.I', email: process.env.QA_7614_TI_EMAIL ?? '', senha: SENHA_QA },
  superAdmin: { nome: 'Super Administrador', email: process.env.USER_EMAIL ?? '', senha: process.env.USER_PASSWORD ?? '' },
  gestor: { nome: 'Gestor', email: process.env.QA_7614_DIRETOR_EMAIL ?? '', senha: SENHA_QA },
  profissional: { nome: 'Profissional', email: process.env.QA_7614_PROFISSIONAL_EMAIL ?? '', senha: SENHA_QA },
  professor: { nome: 'Professor (não titular)', email: process.env.RESTRICTED_USER_EMAIL ?? '', senha: process.env.RESTRICTED_USER_PASSWORD ?? '' },
  aluno: { nome: 'Aluno', email: process.env.QA_7614_ALUNO_EMAIL ?? '', senha: SENHA_QA },
  // Massa QA (01/10/2026): professor titular dos diários das turmas QA-7614-*, T.I com acesso só à "QA-Escola 7614"
  // e aluno com cadastro e matrícula nas turmas QA-7614-A e B (usuário criado pelo cadastro do aluno).
  professorTitular: { nome: 'Professor titular', email: process.env.QA_7614_PROFESSOR_EMAIL ?? '', senha: SENHA_QA },
  tiRestrito: { nome: 'T.I restrito à QA-Escola 7614', email: process.env.QA_7614_TI_RESTRITO_EMAIL ?? '', senha: process.env.QA_7614_TI_RESTRITO_PASSWORD ?? '' },
  // T.I com o mesmo cargo, mas sem as permissões do módulo Diário (QA-TI-P-DIARIO, 28/10/2026).
  tiSemDiario: { nome: 'T.I sem permissão de diário', email: process.env.QA_7614_TI_SEM_DIARIO_EMAIL ?? '', senha: process.env.QA_7614_TI_SEM_DIARIO_PASSWORD ?? '' },
  alunoMatriculado: { nome: 'Aluno matriculado', email: process.env.QA_7614_ALUNO_MATRICULADO_EMAIL ?? '', senha: SENHA_QA },
};

// Turmas da homologação (diário de referência de cada uma).
export const TURMA_3SER = { diario: 3, codigo: '3SER-M-2026', descricao: '3º Série', etapa: 'Ensino médio - 3ª Série', busca: '3SER' };
export const TURMA_9ANO = { diario: 5, codigo: '9ANO-M-2026', busca: '9ANO' };
export const TURMA_2SER = { diario: 29, codigo: '2SER-M-2026' };

export type Boletim = { texto: string; linhas: string[]; arquivo: string; paginas: number; titulo: string; palavras: Palavra[] };
export type Escolha = { alunos?: string[]; disciplinas?: string[]; listagem?: Listagem; item?: 'Boletim de notas' | 'Boletim individual' };
// Origem "listagem": menu Imprimir do cartão do diário em Diários (busca pela turma), em vez da tela do diário.
export type Listagem = { busca: string; componente: string; turma: string };
export type Aluno = { matricula_id: number; nome: string; ordem: number | null };

export async function login(page: Page, perfil: Perfil): Promise<void> {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'Entrar no sistema' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Login de acesso' }).fill(perfil.email);
  await page.getByRole('textbox', { name: 'Senha' }).fill(perfil.senha);
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 60_000 });
}

export async function contextoComo(browser: Browser, perfil: Perfil): Promise<{ context: BrowserContext; page: Page }> {
  // Contexto limpo: sem storageState explícito, o contexto herdaria a sessão Super Admin do projeto (playwright.config).
  const context = await browser.newContext({ baseURL: BASE_URL, storageState: { cookies: [], origins: [] }, viewport: { width: 1440, height: 900 }, timezoneId: 'America/Sao_Paulo', acceptDownloads: true });
  const page = await context.newPage();
  await login(page, perfil);
  return { context, page };
}

export async function abrirDiario(page: Page, diario: number): Promise<void> {
  await page.goto(`/diarios/${diario}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('tab', { name: 'Agendas' })).toBeVisible({ timeout: 60_000 });
}

// Abre o menu "Imprimir" do diário. O link do boletim tem subtítulo ("A turma inteira, por disciplina"),
// então o nome acessível não é exatamente "Boletim de notas": casa pelo prefixo para não confundir
// com "Boletim individual Uma página por aluno".
export async function abrirMenuImprimir(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: 'Opções de impressão do diário' }).click();
  await expect(page.getByRole('link', { name: 'Relação de alunos' })).toBeVisible();
  return page.getByRole('link', { name: /^Boletim de notas/ });
}

// Abre o diálogo de seleção do boletim da turma ("Boletim de notas (N alunos)"), pela tela do diário ou pela listagem.
export type ItemImprimir = 'Boletim de notas' | 'Boletim individual';

export async function abrirDialogoBoletim(page: Page, diario: number, listagem?: Listagem, item: ItemImprimir = 'Boletim de notas'): Promise<Locator> {
  if (listagem) {
    await page.goto(`/diarios?search=${listagem.busca}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('searchbox', { name: 'Pesquisar diários' })).toBeVisible({ timeout: 60_000 });
    await page.getByRole('button', { name: `Opções de impressão do diário de ${listagem.componente} da turma ${listagem.turma}` }).click();
    const linkBoletim = page.getByRole('link', { name: /^Boletim de notas/ });
    await expect(linkBoletim).toHaveAttribute('href', new RegExp(`/diarios/${diario}/imprimir/boletim$`));
    await linkBoletim.click();
  } else {
    await abrirDiario(page, diario);
    await abrirMenuImprimir(page);
    // "Boletim individual" é o link "Boletim individual Uma página por aluno".
    await page.getByRole('link', { name: item === 'Boletim de notas' ? /^Boletim de notas/ : /^Boletim individual/ }).click();
  }
  // O v-dialog do Vuetify tem dois elementos com papel dialog (overlay e card): usa o mais interno.
  const selecao = page.getByRole('dialog').last();
  await expect(selecao.getByText(new RegExp(`^${item} \\(\\d+ alunos\\)$`))).toBeVisible();
  await expect(selecao.getByText(item === 'Boletim de notas' ? 'Escolha as disciplinas e os alunos do boletim.' : 'Para quem você quer gerar?')).toBeVisible();
  return selecao;
}

// As disciplinas são chips sem papel acessível (ver cenário 30): localizadas pelo texto visível, dentro do diálogo.
export const chipDisciplina = (selecao: Locator, nome: string): Locator => selecao.getByText(nome, { exact: true });

// Gera o boletim pela tela e devolve o texto do PDF (pdftotext -layout preserva as colunas).
export async function gerarBoletimPelaTela(page: Page, diario: number, escolha: Escolha = {}): Promise<Boletim> {
  const selecao = await abrirDialogoBoletim(page, diario, escolha.listagem, escolha.item);
  if (escolha.disciplinas?.length) {
    await selecao.getByRole('button', { name: 'Individual' }).click();
    for (const d of escolha.disciplinas) await chipDisciplina(selecao, d).click();
    await expect(selecao.getByRole('heading', { name: new RegExp(`^Disciplinas · ${escolha.disciplinas.length} de \\d+$`) })).toBeVisible();
  }
  if (escolha.alunos?.length) {
    // No boletim individual nenhum aluno vem marcado ("Desmarcar todos" desabilitado).
    if (await selecao.getByRole('button', { name: 'Desmarcar todos' }).isEnabled()) await selecao.getByRole('button', { name: 'Desmarcar todos' }).click();
    for (const nome of escolha.alunos) await selecao.getByRole('checkbox', { name: new RegExp(`^${nome}`) }).click();
    await expect(selecao.getByText(`${escolha.alunos.length} de`, { exact: false }).first()).toBeVisible();
    await selecao.getByRole('button', { name: escolha.alunos.length === 1 ? `Gerar para ${escolha.alunos[0]}` : `Gerar para ${escolha.alunos.length} alunos` }).click();
  } else {
    await selecao.getByRole('button', { name: /^Gerar para todos \(\d+\)$/ }).click();
  }

  const geracao = page.getByRole('alertdialog');
  await expect(geracao.getByRole('heading', { name: 'Gerando documento' }).or(geracao.getByRole('heading', { name: 'Documento pronto' }))).toBeVisible();
  // Fila assíncrona do servidor (ver comentário no topo).
  await expect(geracao.getByRole('heading', { name: 'Documento pronto' })).toBeVisible({ timeout: 180_000 });
  await expect(geracao.getByRole('button', { name: 'Abrir documento' })).toBeVisible();
  // Status: "<título do documento> pronto. Use o botão Abrir documento."
  const status = geracao.getByText(/ pronto\. Use o botão Abrir documento\.$/);
  await expect(status).toBeVisible();
  const titulo = ((await status.textContent()) ?? '').replace(/ pronto\. Use o botão Abrir documento\.$/, '').trim();

  const [download] = await Promise.all([page.waitForEvent('download'), geracao.getByRole('button', { name: 'Baixar' }).click()]);
  const destino = path.join(os.tmpdir(), `pw7614-${Date.now()}-${download.suggestedFilename()}`);
  await download.saveAs(destino);
  const texto = execFileSync('pdftotext', ['-layout', destino, '-'], { encoding: 'utf8' });
  const palavras = palavrasDoPdf(destino);
  const paginas = Number(/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [destino], { encoding: 'utf8' }))?.[1] ?? 0);
  fs.rmSync(destino, { force: true });
  // Há dois "Fechar" (o X do cabeçalho e o do rodapé): qualquer um fecha.
  await geracao.getByRole('button', { name: 'Fechar' }).last().click();
  await expect(geracao).toHaveCount(0);
  return { texto, linhas: texto.split('\n'), arquivo: download.suggestedFilename(), paginas, titulo, palavras };
}

// Cada teste é independente: o boletim de uma turma é gerado na primeira vez que um teste precisa dele
// (no próprio teste) e reaproveitado pelos seguintes no mesmo worker, porque a geração leva ~25 s.
export const cache = new Map<string, Promise<Boletim>>();
export function boletimDaTurma(browser: Browser, diario: number): Promise<Boletim> {
  const chave = `turma-${diario}`;
  if (!cache.has(chave)) {
    cache.set(chave, (async () => {
      const { context, page } = await contextoComo(browser, PERFIS.ti);
      try { return await gerarBoletimPelaTela(page, diario); } finally { await context.close(); }
    })());
  }
  return cache.get(chave)!;
}

export async function alunosDoDiario(page: Page, diario: number): Promise<Aluno[]> {
  return page.evaluate(async (d) => (await (await fetch(`/diarios/${d}/alunos`, { headers: { Accept: 'application/json' } })).json()).alunos, diario);
}

// POST direto na rota de geração: 202 = aceita; 401/403 = negada.
export async function postBoletim(page: Page, diario: number): Promise<number> {
  return page.evaluate(async (d) => {
    const token = decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '');
    const r = await fetch(`/diarios/${d}/imprimir/boletim?matriculas[0]=162`, { method: 'POST', headers: { 'X-XSRF-TOKEN': token, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } });
    return r.status;
  }, diario);
}

// Troca a escola ativa do usuário logado (mesma rota do ícone de perfil). Usada para limpar a massa do T.I.
export async function trocarFranquia(page: Page, franquiaId: number): Promise<number> {
  return page.evaluate(async (id) => {
    const token = decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '');
    const r = await fetch('/update-franquia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': token, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
      body: JSON.stringify({ franquia_id: id }),
    });
    return r.status;
  }, franquiaId);
}

// Linhas de aluno ("  12 Nome do Aluno   9,00 ...") de cada bloco de disciplina.
export function blocos(b: Boletim): Map<string, string[]> {
  const mapa = new Map<string, string[]>();
  let atual = '';
  for (const linha of b.linhas) {
    const titulo = /^(\S.*?) — Professor\(a\): /.exec(linha);
    if (titulo) { atual = titulo[1]; mapa.set(atual, []); continue; }
    // A tabela de frequência anual pode continuar na página seguinte, com o cabeçalho de colunas repetido.
    if (/^\s*Nº\s+Aluno\s+Aulas/.test(linha)) { atual = 'Frequência anual'; if (!mapa.has(atual)) mapa.set(atual, []); continue; }
    if (atual && /^\s+\d+\s+\S/.test(linha)) mapa.get(atual)!.push(linha);
  }
  return mapa;
}

export const linhaDoAluno = (linhas: string[], nome: string): string => linhas.find((l) => l.includes(nome)) ?? '';
export const valores = (linha: string): string[] => linha.match(/\d+,\d{2}/g) ?? [];


// Palavras do PDF com a posição (pdftotext -bbox): usadas para saber em que coluna da grade está cada valor.
export type Palavra = { pagina: number; x: number; y: number; texto: string };
export function palavrasDoPdf(arquivo: string): Palavra[] {
  const html = execFileSync('pdftotext', ['-bbox', arquivo, '-'], { encoding: 'utf8' });
  const palavras: Palavra[] = [];
  let pagina = 0;
  for (const m of html.matchAll(/<page |<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)<\/word>/g)) {
    if (m[0] === '<page ') { pagina++; continue; }
    const texto = m[5].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    palavras.push({ pagina, x: (Number(m[1]) + Number(m[3])) / 2, y: (Number(m[2]) + Number(m[4])) / 2, texto });
  }
  return palavras;
}

// Linhas do PDF: palavras da mesma página com o centro vertical a até 3 pt (os títulos de duas linhas da grade,
// como "Nº", "Aluno" e "Média", ficam um pouco deslocados), da esquerda para a direita.
function linhasDoPdf(palavras: Palavra[]): Palavra[][] {
  const ordenadas = [...palavras].sort((a, b) => a.pagina - b.pagina || a.y - b.y);
  const linhas: Palavra[][] = [];
  for (const p of ordenadas) {
    const atual = linhas.at(-1);
    if (atual && atual[0].pagina === p.pagina && p.y - atual[0].y <= 3) atual.push(p);
    else linhas.push([p]);
  }
  return linhas.map((l) => l.sort((a, b) => a.x - b.x));
}
const textoDa = (linha: Palavra[]): string => linha.map((p) => p.texto).join(' ');
const ehValor = (t: string): boolean => /^\d+(,\d+)?$/.test(t);

// Células de um aluno numa disciplina, por "período|campo" (ex.: "1º Bimestre|AV1" → "9,00"; célula vazia = chave ausente).
// Cada valor vai para a coluna cujo título está mais próximo na horizontal. Os títulos são agrupados por período na ordem
// do cabeçalho: um grupo começa em AV1, em N1 ou em REC logo depois de Faltas; "Freq." fecha a tabela.
export function celulasDoAluno(b: Boletim, disciplina: string, aluno: string): Record<string, string> {
  const linhas = linhasDoPdf(b.palavras);
  const inicio = linhas.findIndex((l) => textoDa(l).startsWith(`${disciplina} — Professor(a):`));
  if (inicio < 0) throw new Error(`Disciplina "${disciplina}" não está no boletim`);
  let colunas: { chave: string; x: number }[] = [];
  for (let i = inicio + 1; i < linhas.length; i++) {
    const texto = textoDa(linhas[i]);
    if (/ — Professor\(a\):/.test(texto) || texto.startsWith('Frequência anual')) break;
    if (texto.startsWith('Nº Aluno AV1')) {
      const periodos = textoDa(linhas[i - 1]).match(/\d+º (Bimestre|Semestre|Trimestre)|Etapa Final/g) ?? [];
      colunas = [];
      let grupo = -1;
      let anterior = '';
      for (const p of linhas[i].slice(2)) {
        if (p.texto === 'AV1' || p.texto === 'N1' || (p.texto === 'REC' && anterior === 'Faltas')) grupo++;
        anterior = p.texto;
        colunas.push({ chave: p.texto === 'Freq.' ? 'Frequência|Freq.' : `${periodos[grupo]}|${p.texto}`, x: p.x });
      }
      continue;
    }
    // Nome = palavras à esquerda da primeira coluna de nota (o nome pode terminar em número, ex.: "QA Aluno 7614").
    const limite = colunas.length ? colunas[0].x - 12 : Infinity;
    const nome = linhas[i].slice(1).filter((p) => p.x < limite).map((p) => p.texto).join(' ');
    if (nome !== aluno) continue;
    const celulas: Record<string, string> = {};
    for (const p of linhas[i].slice(1).filter((w) => w.x >= limite && ehValor(w.texto))) {
      const coluna = colunas.reduce((a, c) => (Math.abs(c.x - p.x) < Math.abs(a.x - p.x) ? c : a));
      celulas[coluna.chave] = p.texto;
    }
    return celulas;
  }
  throw new Error(`Aluno "${aluno}" não está no bloco de ${disciplina}`);
}

// Campos do cabeçalho de uma disciplina, na ordem (sem "Nº" e "Aluno").
export function camposDaDisciplina(b: Boletim, disciplina: string): string[] {
  const inicio = b.linhas.findIndex((l) => l.startsWith(`${disciplina} — Professor(a): `));
  const cabecalho = b.linhas.slice(inicio).find((l) => /^\s*Nº\s+Aluno\s+AV1/.test(l)) ?? '';
  return cabecalho.trim().split(/\s+/).slice(2);
}

// Aulas, faltas e frequência (%) de um aluno na tabela "Frequência anual na turma".
export function frequenciaAnual(b: Boletim, aluno: string): { aulas: number; faltas: number; freq: number } {
  const linha = linhaDoAluno(blocos(b).get('Frequência anual') ?? [], aluno);
  const [, aulas, faltas, freq] = /(\d+)\s+(\d+)\s+(\d+)\s*$/.exec(linha) ?? [];
  return { aulas: Number(aulas), faltas: Number(faltas), freq: Number(freq) };
}
