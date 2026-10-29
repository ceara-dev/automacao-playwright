import { test, expect, type Page, type Locator } from '@playwright/test';
import fs from 'fs';

// Lançamento de notas pela tela: Diários › diário da turma › filtro da etapa › Registro de notas/conceitos.
// A cada nota digitada, a "Nota da Etapa" devolvida pelo backend e exibida na grade é comparada com a regra.
//
// ATENÇÃO: GRAVA notas reais na homologação. Reexecutar regrava os mesmos valores.

export type Campo = 'AV1' | 'AV2' | 'REC';
export type Passo = { campo: Campo; digitado: string; valor: number | null };
export type Cenario = { aluno: string; condicao: string; passos: Passo[] };
export type Diario = { id: number; componente: string };

type Linha = {
  etapa: string; disciplina: string; aluno: string; condicao: string; campo: string; digitado: string; status: number;
  esperado: number | null; backend: number | null; tela: string; situacao: string; ok: boolean; obs: string;
};

const MEDIA = 7;

// Arredondamento comercial (meio para cima) em 2 casas.
export const arred = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

// Regra observada (base "Média Aritmética" + recuperação "Substitui a nota da etapa"): a nota da etapa só é
// calculada quando as duas provas obrigatórias (AV1 e AV2) têm nota; é a média delas, e a REC só substitui se for maior.
export function notaEsperada(notas: Partial<Record<Campo, number>>): number | null {
  if (notas.AV1 === undefined || notas.AV2 === undefined) return null;
  const media = (notas.AV1 + notas.AV2) / 2;
  return arred(notas.REC !== undefined && notas.REC > media ? notas.REC : media);
}

export const p = (campo: Campo, digitado: string, valor: number | null = Number(digitado.replace(',', '.'))): Passo => ({ campo, digitado, valor });

// As 16 condições testadas (média 7,00, escala 0–10, 2 casas), uma por aluno, na ordem dos nomes recebidos.
export function cenariosPadrao(alunos: string[]): Cenario[] {
  const condicoes: Omit<Cenario, 'aluno'>[] = [
    { condicao: 'Aprovado', passos: [p('AV1', '9,00'), p('AV2', '8,00')] },
    { condicao: 'Na média (exatamente 7,00)', passos: [p('AV1', '7,00'), p('AV2', '7,00')] },
    { condicao: 'Reprovado', passos: [p('AV1', '3,00'), p('AV2', '4,00')] },
    { condicao: 'Quase aprovado — 6,90', passos: [p('AV1', '6,90'), p('AV2', '6,90')] },
    { condicao: 'Quase aprovado — 6,80', passos: [p('AV1', '6,80'), p('AV2', '6,80')] },
    { condicao: 'Quase aprovado — 6,70', passos: [p('AV1', '6,70'), p('AV2', '6,70')] },
    { condicao: 'Limite inferior — 6,99 (1 centésimo abaixo)', passos: [p('AV1', '7,00'), p('AV2', '6,98')] },
    { condicao: 'Limite superior — 7,01 (1 centésimo acima)', passos: [p('AV1', '7,02'), p('AV2', '7,00')] },
    { condicao: 'Arredondamento — (7,00 + 6,99) ÷ 2 = 6,995', passos: [p('AV1', '7,00'), p('AV2', '6,99')] },
    { condicao: 'Escala máxima — 10,00', passos: [p('AV1', '10'), p('AV2', '10')] },
    { condicao: 'Escala mínima — 0,00', passos: [p('AV1', '0'), p('AV2', '0')] },
    { condicao: 'Recuperação aprova (REC 8,00 > média 5,50)', passos: [p('AV1', '5,00'), p('AV2', '6,00'), p('REC', '8,00')] },
    { condicao: 'Recuperação menor não substitui (REC 5,00 < média 6,00)', passos: [p('AV1', '6,00'), p('AV2', '6,00'), p('REC', '5,00')] },
    { condicao: 'Recuperação exatamente na média (REC 7,00)', passos: [p('AV1', '4,00'), p('AV2', '5,00'), p('REC', '7,00')] },
    { condicao: 'Preenchimento parcial — só AV1', passos: [p('AV1', '8,00')] },
    { condicao: 'Valor acima da escala (10,01) é recusado; depois 9,50 e 9,00', passos: [p('AV1', '1001', null), p('AV1', '9,50'), p('AV2', '9,00')] },
  ];
  if (alunos.length < condicoes.length) throw new Error(`São necessários ${condicoes.length} alunos`);
  return condicoes.map((c, i) => ({ aluno: alunos[i], ...c }));
}

async function inertiaProps(page: Page, url: string): Promise<Record<string, any>> {
  return page.evaluate(async (u) => {
    const html = await (await fetch(u)).text();
    return JSON.parse(html.match(/<script[^>]*data-page="app"[^>]*>([\s\S]*?)<\/script>/)![1]).props;
  }, url);
}

const linhaAluno = (page: Page, nome: string): Locator =>
  page.getByRole('row').filter({ has: page.getByRole('cell', { name: nome, exact: true }) });

// Gera um teste por disciplina e grava o resultado de cada lançamento em `relatorio`.
export function lancarNotas(opcoes: { busca: string; turma: string; etapas: string[]; diarios: Diario[]; cenarios: Cenario[]; relatorio: string }): void {
  const { busca, turma, etapas, diarios, cenarios, relatorio } = opcoes;
  const resultado: Linha[] = [];

  test.describe.configure({ timeout: 900_000 });
  test.use({ timezoneId: 'America/Sao_Paulo' });

  test.afterAll(() => {
    // Acumula com execuções parciais anteriores, substituindo as combinações etapa + disciplina refeitas.
    let anterior: Linha[] = [];
    try { anterior = JSON.parse(fs.readFileSync(relatorio, 'utf8')); } catch { /* primeira execução */ }
    const chave = (l: Linha) => `${l.etapa ?? '3º Bimestre'}|${l.disciplina}`;
    const refeitas = new Set(resultado.map(chave));
    fs.writeFileSync(relatorio, JSON.stringify([...anterior.filter((l) => !refeitas.has(chave(l))), ...resultado], null, 1));
  });

  for (const etapa of etapas) for (const diario of diarios) {
    test(`lança notas — ${etapa} — ${diario.componente}`, async ({ page }) => {
      // Diários › diário da turma
      await page.goto(`/diarios?search=${busca}`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: `Abrir diário de ${diario.componente} da turma ${turma}` }).click();
      await expect(page).toHaveURL(new RegExp(`/diarios/${diario.id}$`), { timeout: 30_000 });
      // Filtro do bimestre
      await page.getByRole('combobox', { name: 'Filtro por etapa' }).click({ force: true });
      await page.getByRole('option', { name: etapa, exact: true }).click();
      // Registro de notas/conceitos
      await page.getByRole('tab', { name: 'Registro de notas/conceitos' }).click();
      await expect(page.getByRole('columnheader', { name: 'Nota da Etapa' })).toBeVisible({ timeout: 30_000 });
      const colunas = (await page.getByRole('columnheader').allTextContents()).map((t) => t.trim());
      // A página também tem a tabela de etapas: as colunas de nota contam a partir de "Aluno".
      const inicio = colunas.indexOf('Aluno');
      const indice = (campo: string) => colunas.findIndex((c, i) => i > inicio && c.startsWith(campo)) - inicio - 1;

      for (const c of cenarios) {
        const linha = linhaAluno(page, c.aluno);
        await expect(linha).toBeVisible();
        const notas: Partial<Record<Campo, number>> = {};
        for (const passo of c.passos) {
          const campo = linha.getByRole('textbox').nth(indice(passo.campo));
          const resposta = page.waitForResponse((r) => r.url().endsWith(`/diarios/${diario.id}/notas`) && r.request().method() === 'POST');
          await campo.fill(passo.digitado, { timeout: 15_000 });
          await campo.blur();
          const r = await resposta;
          const corpo = await r.json().catch(() => ({}));
          if (passo.valor !== null) notas[passo.campo] = passo.valor;
          const esperado = notaEsperada(notas);
          const notaCelula = linha.getByRole('cell').last();
          let obs = '';
          if (passo.valor === null) {
            // Valor fora da escala: o backend recusa e o toast mostra a mensagem.
            obs = (corpo?.errors?.nota ?? []).join(' ');
            await expect(page.getByText('A nota deve estar entre 0.00 e 10.00.').first()).toBeVisible();
          } else if (esperado !== null) {
            await expect(notaCelula).toHaveText(esperado.toFixed(2), { timeout: 10_000 }).catch(() => {});
          }
          const tela = (await notaCelula.textContent())?.trim() ?? '';
          const backend = corpo?.etapa_nota ?? null;
          const classe = await notaCelula.evaluate((el) => el.outerHTML);
          const situacao = /text-success/.test(classe) ? 'Aprovado (verde)' : /text-error/.test(classe) ? 'Reprovado (vermelho)' : '—';
          const ok = passo.valor === null
            ? r.status() === 422
            : esperado === null
              ? r.status() === 200 && backend === null && tela === '—'
              : r.status() === 200 && backend !== null && arred(Number(backend)) === esperado && tela === esperado.toFixed(2)
                && situacao === (esperado >= MEDIA ? 'Aprovado (verde)' : 'Reprovado (vermelho)');
          resultado.push({ etapa, disciplina: diario.componente, aluno: c.aluno, condicao: c.condicao, campo: passo.campo, digitado: passo.digitado, status: r.status(), esperado, backend: backend === null ? null : Number(backend), tela, situacao, ok, obs });
          expect.soft(ok, `${etapa} · ${diario.componente} · ${c.aluno} · ${passo.campo}=${passo.digitado} → esperado ${esperado}, backend ${backend}, tela "${tela}", ${situacao}`).toBe(true);
        }
      }

      // Conferência final pelo backend (o que ficou gravado).
      const etapaId = (await inertiaProps(page, `/diarios/${diario.id}`)).circuito.versao_ativa.etapas.find((e: any) => e.nome === etapa).id;
      const gravado = await page.evaluate(async (u) => (await fetch(u, { headers: { Accept: 'application/json' } })).json(), `/diarios/${diario.id}/notas?circuito_etapa_id=${etapaId}`);
      fs.writeFileSync(`.regras-tmp/notas-gravadas-${diario.id}-${etapaId}.json`, JSON.stringify(gravado));
    });
  }
}
