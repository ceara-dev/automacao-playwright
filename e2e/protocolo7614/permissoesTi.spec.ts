import { test, expect, type Browser, type Page } from '@playwright/test';
import { PERFIS, TURMA_3SER, contextoComo, postBoletim, trocarFranquia } from './boletim';

// Protocolo #7614 — permissões do T.I e acesso ao boletim.
//
// Cenário 1: ao remover a escola permitida do T.I no cadastro de usuário, o diário e o boletim da turma
//            daquela escola devem dar 403 (lista permitida vazia = sem escola).
// Cenário 2: o T.I restrito (Escolas Permitidas = QA-Escola 7614) não pode trocar de escola pelo ícone de
//            perfil e o boletim da escola fora do acesso continua negado.
// Cenário 3: o T.I com o cargo de T.I mas sem as permissões de Diário (QA-TI-P-DIARIO) não vê o menu,
//            não abre /diarios, não gera o boletim e não tem a troca de escola no perfil.
//
// Os testes 1 e 2 alteram o cadastro dos usuários QA (ids 67 e 75) e restauram a massa no finally:
//   - a escola permitida volta a ser "Colégio Apoio" (T.I) ou "QA-Escola 7614" (T.I restrito);
//   - a escola ativa (update-franquia) volta a ser 1 (Colégio Apoio) ou 5 (QA-Escola 7614).

test.describe.configure({ mode: 'serial', timeout: 600_000 });
test.use({ timezoneId: 'America/Sao_Paulo', viewport: { width: 1440, height: 900 } });

const CAMPO_ESCOLAS = '[id="usuario.franquias_permitidas"]';
const TITULO_ESCOLA = '[id="navbar.main"] .layout__title';
const ESCOLA_APOIO = 1;
const ESCOLA_QA = 5;

async function idDoUsuario(admin: Page, email: string): Promise<number> {
  await admin.goto(`/usuarios?search=${encodeURIComponent(email)}`, { waitUntil: 'domcontentloaded' });
  const botao = admin.locator('button[id^="usuarios.btn_acoes-"]').first();
  await expect(botao).toBeVisible({ timeout: 60_000 });
  const id = (await botao.getAttribute('id'))?.match(/-(\d+)$/)?.[1];
  if (!id) throw new Error(`Usuário ${email} não encontrado na listagem`);
  return Number(id);
}

async function abrirUsuario(admin: Page, id: number): Promise<void> {
  await admin.goto(`/usuarios/${id}`, { waitUntil: 'domcontentloaded' });
  await expect(admin.locator(CAMPO_ESCOLAS)).toBeVisible({ timeout: 60_000 });
}

async function alternarEscola(admin: Page, nome: string): Promise<void> {
  const campo = admin.locator(CAMPO_ESCOLAS);
  await campo.click({ force: true });
  const menu = admin.locator('.v-overlay-container .v-list:visible').last();
  await menu.getByText(nome, { exact: true }).click();
  await admin.waitForTimeout(400);
  await admin.keyboard.press('Escape');
}

async function salvarUsuario(admin: Page, id: number): Promise<number> {
  const resposta = admin.waitForResponse((r) => r.url().includes(`/usuarios/${id}`) && ['PUT', 'POST'].includes(r.request().method()));
  await admin.getByRole('button', { name: 'Enviar', exact: true }).click();
  const status = (await resposta).status();
  await admin.waitForURL(/\/usuarios(?:\?|$)/, { timeout: 60_000 });
  return status;
}

// Garante que a escola voltou para a lista de Escolas Permitidas (a massa do protocolo depende disso).
async function garantirEscolaPermitida(admin: Page, id: number, nome: string): Promise<void> {
  await abrirUsuario(admin, id);
  if (!(await admin.locator(CAMPO_ESCOLAS).inputValue()).includes(nome)) {
    await alternarEscola(admin, nome);
    await salvarUsuario(admin, id);
  }
}

async function estadoDoTi(perfil: typeof PERFIS.ti, browser: Browser) {
  const { context, page } = await contextoComo(browser, perfil);
  return { context, page };
}

async function permissoes(page: Page): Promise<string[]> {
  return page.evaluate(() => JSON.parse(document.querySelector('script[data-page="app"]')?.textContent ?? '{}').props?.auth?.permissions ?? []);
}

type DiarioListado = { id: number; turma: { codigo: string; franquia_id: number } };

// Diários da primeira página da listagem (/diarios), pelas props Inertia do load completo.
async function diariosDaListagem(page: Page): Promise<DiarioListado[]> {
  await page.goto('/diarios', { waitUntil: 'domcontentloaded' });
  return page.evaluate(() => JSON.parse(document.querySelector('script[data-page="app"]')?.textContent ?? '{}').props?.diarios?.data ?? []);
}

// Ids dos diários com o botão "Abrir" na tela.
async function diariosComAbrir(page: Page): Promise<number[]> {
  return page.locator('[id^="diario.btn_abrir_"]').evaluateAll((botoes) => botoes.map((b) => Number(b.id.replace('diario.btn_abrir_', ''))));
}

test('CT-BOLETIM-019: remover a escola permitida do T.I bloqueia o boletim', async ({ browser }) => {
  const admin = await contextoComo(browser, PERFIS.superAdmin);
  const ti = await estadoDoTi(PERFIS.ti, browser);
  let id = 0;
  try {
    id = await idDoUsuario(admin.page, PERFIS.ti.email);
    await abrirUsuario(admin.page, id);
    expect(await admin.page.locator(CAMPO_ESCOLAS).inputValue()).toContain('Colégio Apoio');

    await alternarEscola(admin.page, 'Colégio Apoio');
    expect(await admin.page.locator(CAMPO_ESCOLAS).inputValue()).not.toContain('Colégio Apoio');
    expect(await salvarUsuario(admin.page, id)).toBe(303);

    // Confirma que a permissão foi gravada, não só alterada no formulário.
    await abrirUsuario(admin.page, id);
    expect(await admin.page.locator(CAMPO_ESCOLAS).inputValue()).not.toContain('Colégio Apoio');

    // Sem a escola permitida, o T.I não deveria alcançar a turma nem gerar o boletim dela.
    const get = (await ti.page.goto(`/diarios/${TURMA_3SER.diario}`, { waitUntil: 'domcontentloaded' }))?.status() ?? 0;
    const post = await postBoletim(ti.page, TURMA_3SER.diario);
    expect(get).toBe(403);
    expect(post).toBe(403);
  } finally {
    if (id) await garantirEscolaPermitida(admin.page, id, 'Colégio Apoio').catch(() => {});
    await trocarFranquia(ti.page, ESCOLA_APOIO).catch(() => {});
    await ti.context.close();
    await admin.context.close();
  }
});

test('CT-BOLETIM-019: T.I restrito não troca a escola pelo ícone de perfil e o boletim continua negado', async ({ browser }) => {
  const { context, page } = await contextoComo(browser, PERFIS.tiRestrito);
  let escolaDepois = '';
  let get = 0;
  let post = 0;
  try {
    // `contextoComo` chega ao dashboard por navegação SPA: o `data-page` ainda é o do login.
    // Um load completo atualiza as props compartilhadas (`franquias`) usadas nas asserções.
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    // Com uma única escola permitida, a opção "Alterar unidade escolar" nem aparece.
    await page.locator('[id="navbar.btn_menu_user"]').click();
    await expect(page.getByRole('menuitem', { name: 'Alterar unidade escolar' })).toHaveCount(0);
    await page.keyboard.press('Escape');

    // A prop `franquias` também só traz a escola permitida — o diálogo nunca ofereceria "Colégio Apoio".
    const franquias = await page.evaluate(() => JSON.parse(document.querySelector('script[data-page="app"]')?.textContent ?? '{}').props?.franquias ?? []);
    expect((franquias as { descricao: string }[]).map((f) => f.descricao)).toEqual(['QA-Escola 7614']);

    escolaDepois = (await page.locator(TITULO_ESCOLA).innerText()).trim();
    get = (await page.goto(`/diarios/${TURMA_3SER.diario}`, { waitUntil: 'domcontentloaded' }))?.status() ?? 0;
    post = await postBoletim(page, TURMA_3SER.diario);
  } finally {
    if (!page.isClosed()) {
      await trocarFranquia(page, ESCOLA_QA).catch(() => {});
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' }).catch(() => {});
    }
    await context.close();
  }

  expect(escolaDepois).toBe('QA-Escola 7614');
  expect(get).toBe(403);
  expect(post).toBe(403);
});

test('CT-BOLETIM-019: T.I restrito não vê nem abre os diários da escola sem acesso', async ({ browser }) => {
  const outraEscola = await contextoComo(browser, PERFIS.ti);
  const restrito = await contextoComo(browser, PERFIS.tiRestrito);
  try {
    // Dado que existem diários de outra escola: o T.I do Colégio Apoio os vê na listagem.
    const daOutraEscola = await diariosDaListagem(outraEscola.page);
    expect(daOutraEscola.length).toBeGreaterThan(0);
    expect(daOutraEscola.every((d) => d.turma.franquia_id === ESCOLA_APOIO)).toBe(true);

    // Quando o T.I restrito à QA-Escola 7614 acessa a listagem…
    const visiveis = await diariosDaListagem(restrito.page);
    await expect(restrito.page.locator(TITULO_ESCOLA)).toHaveText('QA-Escola 7614');

    // …só aparecem diários da escola permitida (na massa de 29/10/2026 ela não tem nenhum: as turmas
    // QA-7614-A/B/V são do Colégio Apoio), e nenhum "Abrir" é de diário do Colégio Apoio.
    expect(visiveis.filter((d) => d.turma.franquia_id !== ESCOLA_QA).map((d) => d.turma.codigo)).toEqual([]);
    const abrir = await diariosComAbrir(restrito.page);
    expect(abrir.sort((a, b) => a - b)).toEqual(visiveis.map((d) => d.id).sort((a, b) => a - b));
    expect(abrir.filter((id) => daOutraEscola.some((d) => d.id === id))).toEqual([]);
    for (const codigo of new Set(daOutraEscola.map((d) => d.turma.codigo))) {
      await expect(restrito.page.getByText(codigo, { exact: true })).toHaveCount(0);
    }

    // E não consegue mudar a escola pelo ícone de perfil.
    await restrito.page.locator('[id="navbar.btn_menu_user"]').click();
    await expect(restrito.page.getByRole('menuitem', { name: 'Alterar unidade escolar' })).toHaveCount(0);
  } finally {
    await restrito.context.close();
    await outraEscola.context.close();
  }
});

test('CT-BOLETIM-019: T.I sem permissões de diário não acessa listagem, diário nem boletim', async ({ browser }) => {
  const { context, page } = await contextoComo(browser, PERFIS.tiSemDiario);
  try {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    const perms = await permissoes(page);
    for (const permissao of ['diarios.list', 'turmas.diario', 'turmas.diario.print.boletim']) {
      expect(perms, permissao).not.toContain(permissao);
    }
    expect(perms).toContain('turmas.list');

    // Sem "Diários" no menu e sem a troca de escola no ícone de perfil.
    await expect(page.locator('[id="navbar.btn_diarios"]')).toHaveCount(0);
    await page.locator('[id="navbar.btn_menu_user"]').click();
    await expect(page.locator('[id="navbar.btn_unidade_escolar"]')).toHaveCount(0);
    await page.keyboard.press('Escape');

    // Turmas continua liberado; Diários, abertura direta e boletim são negados.
    expect((await page.goto('/turmas', { waitUntil: 'domcontentloaded' }))?.status()).toBe(200);
    expect((await page.goto('/diarios', { waitUntil: 'domcontentloaded' }))?.status()).toBe(403);
    expect((await page.goto(`/diarios/${TURMA_3SER.diario}`, { waitUntil: 'domcontentloaded' }))?.status()).toBe(403);
    expect(await postBoletim(page, TURMA_3SER.diario)).toBe(403);
  } finally {
    await context.close();
  }
});
