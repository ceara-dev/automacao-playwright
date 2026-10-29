import { test, expect, type Page, type Locator, type Browser } from '@playwright/test';

// Regras de negócio do módulo Turmas (menu lateral → Acadêmico → Turmas).
// Catálogo completo com origem de cada regra: ./REGRAS.md
// Cada teste referencia o identificador RN-TUR-NN do catálogo.
//
// Turmas reais só são lidas. Criação, edição, fechamento, exclusão e restauração usam turmas
// `QA-TUR-<ts>` na etapa "1º Ano" (sem circuito nem turmas), removidas de vez no afterAll.

// Homologação oscila bastante no carregamento (> 30s em alguns picos).
test.describe.configure({ timeout: 90_000 });
test.use({ timezoneId: 'America/Sao_Paulo' });

const BASE_URL = 'http://veramendes.local';
const RESTRICTED_EMAIL = process.env.RESTRICTED_USER_EMAIL ?? '';
const RESTRICTED_PASSWORD = process.env.RESTRICTED_USER_PASSWORD ?? '';

// Turma real usada só para leitura.
const TURMA = { id: 1, codigo: '6ANO-M-2026', descricao: '6º Ano', etapa: 'Ensino fundamental de 9 anos - 6º Ano' };
// Turma sem circuito de notas (etapa de ensino "magistério").
const SEM_CIRCUITO = { id: 6, descricao: '2º Série' };
// Etapa de ensino sem circuito nem turmas: usada pelas turmas QA-.
const ETAPA_QA = { id: 6, nome: 'Ensino fundamental de 9 anos - 1º Ano' };

type Inertia = { status: number; component?: string; props?: Record<string, any>; errors?: Record<string, string>; flash?: Record<string, string> };

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
// O Vue cola rótulo e valor no texto ("Turno:Manhã"): partes separadas por espaços opcionais.
const rx = (...partes: (string | number)[]) => new RegExp(partes.map((p) => esc(String(p))).join('\\s*'));

async function abrirLista(page: Page, url = '/turmas'): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('searchbox', { name: 'Pesquisar turmas' })).toBeVisible({ timeout: 30_000 });
}

async function abrirTurma(page: Page, id = TURMA.id): Promise<void> {
  await page.goto(`/turmas/${id}/show`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Informações da Turma')).toBeVisible({ timeout: 30_000 });
}

async function abrirFormulario(page: Page, url = '/turmas/criar'): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'Salvar' })).toBeVisible({ timeout: 30_000 });
}

// Lê as props Inertia de uma página (JSON embutido em <script data-page="app">).
async function inertiaProps(page: Page, url: string): Promise<Record<string, any>> {
  return page.evaluate(async (u) => {
    const html = await (await fetch(u)).text();
    const match = html.match(/<script[^>]*data-page="app"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) throw new Error(`Props Inertia não encontradas em ${u}`);
    return JSON.parse(match[1]).props;
  }, url);
}

// Chamada Inertia (como o front faz): segue o redirect e devolve props, errors e flash.
async function inertia(page: Page, method: string, url: string, body?: unknown): Promise<Inertia> {
  return page.evaluate(async ({ method, url, body }) => {
    const version = JSON.parse(document.querySelector('script[data-page="app"]')!.textContent!).version;
    const token = decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '');
    const res = await fetch(url, {
      method,
      // Sem o Accept, o Laravel responde 422 JSON em vez do redirect com errors.
      headers: { 'Content-Type': 'application/json', Accept: 'text/html, application/xhtml+xml', 'X-XSRF-TOKEN': token, 'X-Inertia': 'true', 'X-Inertia-Version': version, 'X-Requested-With': 'XMLHttpRequest' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => null);
    if (!json?.props) return { status: res.status };
    const flash = Object.fromEntries(Object.entries(json.props.flash ?? {}).filter(([, v]) => v)) as Record<string, string>;
    return { status: res.status, component: json.component, props: json.props, errors: json.props.errors, flash };
  }, { method, url, body });
}

async function status(page: Page, method: string, url: string): Promise<number> {
  return page.evaluate(async ({ method, url }) => {
    const token = decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '');
    const res = await fetch(url, { method, redirect: 'manual', headers: { 'X-XSRF-TOKEN': token, 'X-Requested-With': 'XMLHttpRequest' } });
    return res.status;
  }, { method, url });
}

// Reescreve as props no HTML de uma página para simular dados sem alterá-los no servidor.
async function simular(page: Page, caminho: RegExp, alterar: (props: Record<string, any>) => void): Promise<void> {
  await page.route(caminho, async (route) => {
    if (route.request().resourceType() !== 'document') return route.continue();
    const response = await route.fetch();
    const body = (await response.text()).replace(
      /(<script[^>]*data-page="app"[^>]*>)([\s\S]*?)(<\/script>)/,
      (_, abre: string, json: string, fecha: string) => {
        const data = JSON.parse(json);
        alterar(data.props);
        return abre + JSON.stringify(data).replace(/</g, '\\u003c') + fecha;
      },
    );
    await route.fulfill({ response, body });
  });
}

async function loginRestrito(page: Page): Promise<void> {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.getByRole('textbox', { name: 'Login de acesso' }).fill(RESTRICTED_EMAIL);
  await page.getByRole('textbox', { name: 'Senha' }).fill(RESTRICTED_PASSWORD);
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 30_000 });
}

async function comoProfessor(browser: Browser, fn: (page: Page) => Promise<void>): Promise<void> {
  const context = await browser.newContext({ baseURL: BASE_URL, storageState: { cookies: [], origins: [] }, timezoneId: 'America/Sao_Paulo' });
  const page = await context.newPage();
  try {
    await loginRestrito(page);
    await fn(page);
  } finally {
    await context.close();
  }
}

const cartao = (page: Page, descricao: string): Locator =>
  page.locator('.card-wrapper').filter({ has: page.getByRole('button', { name: `Ver detalhes de ${descricao}`, exact: true }) });

async function selecionar(page: Page, campo: string, opcao: string): Promise<void> {
  await page.getByRole('combobox', { name: campo }).click({ force: true });
  await page.getByRole('option', { name: opcao, exact: true }).click();
}

const payloadQA = (codigo: string, descricao: string) => ({
  codigo, descricao, tipo_turma: 6, tipo_mediacao: 1, etapa_ensino_id: ETAPA_QA.id,
  horario_inicio: '13:00', horario_fim: '17:00', dias_semana: [2, 3], capacidade_maxima: 2, ativo: true, ano_letivo: 2026,
});

const novoCodigo = () => `QA-TUR-${String(Date.now()).slice(-7)}`;

test.describe('Turmas — acesso e listagem', () => {
  test('RN-TUR-01: item do menu leva à listagem com breadcrumb e botões Nova Turma e Lixeira', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.locator('[id="navbar.btn_turmas"]').click();
    await expect(page).toHaveURL(/\/turmas$/, { timeout: 30_000 });
    await expect(page).toHaveTitle(/^Turmas - /);
    await expect(page.getByRole('heading', { level: 5, name: 'Turmas' })).toBeVisible();
    await expect(page.getByRole('main').getByRole('list').first().getByRole('listitem')).toHaveText(['Dashboard', 'Turmas', 'Listar']);
    await expect(page.getByRole('button', { name: 'Criar nova turma' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ver lixeira de turmas' })).toBeVisible();

    await page.getByRole('button', { name: 'Criar nova turma' }).click();
    await expect(page).toHaveURL(/\/turmas\/criar$/, { timeout: 30_000 });
  });

  test('RN-TUR-01: Professor só vê turmas do seu vínculo (lista vazia na homologação)', async ({ browser }) => {
    await comoProfessor(browser, async (page) => {
      await abrirLista(page);
      const { turmas } = await inertiaProps(page, '/turmas');
      expect(turmas.total).toBe(0);
      await expect(page.getByRole('button', { name: 'Criar nova turma' })).toHaveCount(0);
      await expect(page.getByText(/Não existem .* cadastrad/)).toBeVisible();
    });
  });

  test('RN-TUR-01: (esperado) estado vazio "Não existem turmas cadastradas"', async ({ browser }) => {
    test.fail(true, 'DEFEITO TUR-09: o texto é montado com o título: "Não existem turmas cadastrados"');
    await comoProfessor(browser, async (page) => {
      await abrirLista(page);
      await expect(page.getByText('Não existem turmas cadastradas')).toBeVisible({ timeout: 10_000 });
    });
  });

  test('RN-TUR-02: cada cartão mostra etapa, código, professores, turno, alunos, etapas, aulas e situações', async ({ page }) => {
    await abrirLista(page);
    const { turmas } = await inertiaProps(page, '/turmas');
    await expect(page.getByText(/Exibindo de \d/)).toHaveText(`Exibindo de 1 até ${turmas.to} de ${turmas.total}`);
    for (const t of turmas.data) {
      const card = cartao(page, t.descricao);
      await expect(card).toContainText(t.etapa_ensino?.nome ?? 'N/A');
      await expect(card).toContainText(rx(t.codigo, '—', t.descricao));
      const docentes = t.profissionais.filter((p: any) => p.pivot?.funcao_docente);
      for (const p of docentes) await expect(card).toContainText(rx(p.nome, 'Docente'));
      const hora = t.horario_inicio ? parseInt(t.horario_inicio, 10) : null;
      const turno = hora === null ? '—' : hora < 12 ? 'Manhã' : hora < 18 ? 'Tarde' : 'Noite';
      await expect(card).toContainText(rx('Turno:', turno));
      await expect(card).toContainText(rx('Alunos:', `${t.matriculas_count}${t.capacidade_maxima ? ` / ${t.capacidade_maxima}` : ''}`));
      await expect(card).toContainText(rx('Etapas:', t.circuito_etapas_count ?? '—'));
      await expect(card).toContainText(rx('Aulas:', Number(t.aulas_count)));
      if (t.circuito_etapas_detalhes?.length) {
        for (const e of t.circuito_etapas_detalhes) {
          await expect(card).toContainText(new RegExp(`${esc(e.nome)}\\s*(Ativa|Encerrada|Inicia em \\d+d)\\s*\\(${e.aulas_lancadas} aulas\\)`));
        }
      } else {
        await expect(card).toContainText('Sem vínculo de circuito de notas');
      }
    }
  });

  const turnos = [
    { inicio: '11:59:00', texto: 'Manhã' },
    { inicio: '12:00:00', texto: 'Tarde' },
    { inicio: '17:59:00', texto: 'Tarde' },
    { inicio: '18:00:00', texto: 'Noite' },
    { inicio: null, texto: '—' },
  ];
  for (const { inicio, texto } of turnos) {
    test(`RN-TUR-02: turno pelo horário de início ${inicio ?? 'vazio'} → ${texto}`, async ({ page }) => {
      await simular(page, /\/turmas(\?.*)?$/, (props) => { props.turmas.data[0].horario_inicio = inicio; });
      await abrirLista(page);
      await expect(page.locator('.card-wrapper').first()).toContainText(rx('Turno:', texto));
    });
  }

  test('RN-TUR-02: (esperado) mesma regra de turno do Diário (12:00 Manhã, 17:00 Noite)', async ({ page }) => {
    test.fail(true, 'DEFEITO TUR-10: Turmas usa hora < 12 Manhã / < 18 Tarde; o Diário usa ≤ 12:00 Manhã / ≥ 17:00 Noite — 12:00 e 17:00–17:59 divergem');
    await simular(page, /\/turmas(\?.*)?$/, (props) => {
      props.turmas.data[0].horario_inicio = '12:00:00';
      props.turmas.data[1].horario_inicio = '17:30:00';
    });
    await abrirLista(page);
    await expect(page.locator('.card-wrapper').nth(0)).toContainText(rx('Turno:', 'Manhã'));
    await expect(page.locator('.card-wrapper').nth(1)).toContainText(rx('Turno:', 'Noite'));
  });

  test('RN-TUR-02: situação de cada etapa do circuito pela data de hoje', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-01T10:00:00-03:00'));
    await simular(page, /\/turmas(\?.*)?$/, (props) => {
      props.turmas.data[0].circuito_etapas_detalhes = [
        { nome: 'Sim A', periodo_calendario_inicio: '2026-10-03T03:00:00.000000Z', periodo_calendario_fim: '2026-12-31T03:00:00.000000Z', aulas_lancadas: 0 },
        { nome: 'Sim B', periodo_calendario_inicio: '2026-01-01T03:00:00.000000Z', periodo_calendario_fim: '2026-09-30T03:00:00.000000Z', aulas_lancadas: 4 },
        { nome: 'Sim C', periodo_calendario_inicio: '2026-09-01T03:00:00.000000Z', periodo_calendario_fim: '2026-10-01T03:00:00.000000Z', aulas_lancadas: 2 },
      ];
    });
    await abrirLista(page);
    const card = page.locator('.card-wrapper').first();
    await expect(card).toContainText(rx('Sim A', 'Inicia em 2d', '(0 aulas)'));
    await expect(card).toContainText(rx('Sim B', 'Encerrada', '(4 aulas)'));
    await expect(card).toContainText(rx('Sim C', 'Ativa', '(2 aulas)'));
  });

  test('RN-TUR-02: turma sem circuito → "Sem vínculo de circuito de notas"', async ({ page }) => {
    await abrirLista(page);
    const card = cartao(page, SEM_CIRCUITO.descricao);
    await expect(card).toContainText(rx('Etapas:', 0));
    await expect(card).toContainText('Sem vínculo de circuito de notas');
  });

  test('RN-TUR-02: ocupação acima da capacidade marca o excedente', async ({ page }) => {
    await simular(page, /\/turmas(\?.*)?$/, (props) => {
      Object.assign(props.turmas.data[0], { matriculas_count: 50, capacidade_maxima: 45 });
      Object.assign(props.turmas.data[1], { matriculas_count: 10, capacidade_maxima: 45 });
    });
    await abrirLista(page);
    await expect(page.locator('.card-wrapper').nth(0)).toContainText(rx('Alunos:', '50 / 45'));
    await expect(page.locator('.card-wrapper').nth(0).locator('.progress-bar-show-dashed--overflow')).toHaveCount(1);
    await expect(page.locator('.card-wrapper').nth(1).locator('.progress-bar-show-dashed--overflow')).toHaveCount(0);
  });

  test('RN-TUR-03: (esperado) "Carga Horária" mostra a carga da turma', async ({ page }) => {
    test.fail(true, 'DEFEITO TUR-08: "Carga Horária: —" é texto fixo no componente, em todos os cartões');
    await abrirLista(page);
    await expect(cartao(page, TURMA.descricao)).not.toContainText(rx('Carga Horária:', '—'));
  });

  test('RN-TUR-04: busca por código, descrição e ano letivo', async ({ page }) => {
    await abrirLista(page);
    const busca = page.getByRole('searchbox', { name: 'Pesquisar turmas' });
    const casos: [string, number][] = [['6ANO', 1], [TURMA.descricao, 1], ['2026', 7]];
    for (const [termo, total] of casos) {
      await busca.fill(termo);
      await expect(page).toHaveURL(/[?&]search=/, { timeout: 30_000 });
      await expect(page.getByText(/Exibindo de \d/)).toHaveText(`Exibindo de 1 até ${total} de ${total}`, { timeout: 30_000 });
    }
  });

  test('RN-TUR-04: (esperado) busca encontra pela etapa de ensino exibida no cartão', async ({ page }) => {
    test.fail(true, 'DEFEITO TUR-11: buscar "Ensino médio" (título de 3 cartões) retorna 0 — a busca ignora a etapa de ensino');
    await abrirLista(page, '/turmas?search=Ensino%20m%C3%A9dio');
    await expect(page.getByText(/Exibindo de \d/)).not.toHaveText('Exibindo de 0 até 0 de 0');
  });

  test('RN-TUR-05: (esperado) "Carregar mais" só aparece quando há próxima página', async ({ page }) => {
    test.fail(true, 'DEFEITO TUR-07: "Carregar mais Turmas" aparece com 7 de 7 (next_page_url = null)');
    await abrirLista(page);
    await expect(page.getByRole('button', { name: 'Carregar mais turmas' })).toHaveCount(0);
  });

  test('RN-TUR-05: (esperado) "Carregar mais" mantém o termo pesquisado', async ({ page }) => {
    test.fail(true, 'DEFEITO TUR-06: a próxima página é pedida só com page/trashed — o filtro de busca se perde');
    await simular(page, /\/turmas(\?.*)?$/, (props) => {
      props.search = '2026';
      props.turmas.next_page_url = `${BASE_URL}/turmas?page=2`;
    });
    await abrirLista(page, '/turmas?search=2026');
    const pedido = page.waitForRequest((r) => r.url().includes('page=2'));
    await page.getByRole('button', { name: 'Carregar mais turmas' }).click();
    expect(new URL((await pedido).url()).searchParams.get('search')).toBe('2026');
  });

  test('RN-TUR-06: ações do cartão — Diário, Imprimir, Ver, Editar e Excluir', async ({ page, context }) => {
    await abrirLista(page);
    const d = TURMA.descricao;
    await page.getByRole('button', { name: `Imprimir diário de ${d}` }).click();
    await expect(page).toHaveURL(new RegExp(`/diarios\\?turma_id=${TURMA.id}$`), { timeout: 30_000 });

    await abrirLista(page);
    const aba = context.waitForEvent('page');
    await page.getByRole('button', { name: `Imprimir ${d}`, exact: true }).click();
    await expect(await aba).toHaveURL(new RegExp(`/turmas/${TURMA.id}/imprimir$`));

    await page.getByRole('button', { name: `Ver detalhes de ${d}` }).click();
    await expect(page).toHaveURL(new RegExp(`/turmas/${TURMA.id}/show$`), { timeout: 30_000 });
    await abrirLista(page);
    await page.getByRole('button', { name: `Editar ${d}` }).click();
    await expect(page).toHaveURL(new RegExp(`/turmas/${TURMA.id}$`), { timeout: 30_000 });
  });

  test('RN-TUR-06: (esperado) botão "Diário" descreve o destino (lista de diários)', async ({ page }) => {
    test.fail(true, 'DEFEITO TUR-12: o botão "Diário" se anuncia como "Imprimir diário de X", mas abre a lista de diários filtrada pela turma');
    await abrirLista(page);
    await expect(page.getByRole('button', { name: `Imprimir diário de ${TURMA.descricao}` })).toHaveCount(0);
  });

  test('RN-TUR-06: Excluir pede o código de confirmação (cancelado, nada é excluído)', async ({ page }) => {
    await abrirLista(page);
    await page.getByRole('button', { name: `Excluir ${TURMA.descricao}`, exact: true }).click();
    const modal = page.getByRole('dialog').last();
    // O texto do bundle vem em NFD ("o" + acento combinante): compara normalizado.
    expect((await modal.innerText()).normalize('NFC')).toMatch(rx('Por favor, digite o código', TURMA.id, 'de confirmação'));
    const excluir = modal.getByRole('button', { name: 'Excluir' });
    await expect(excluir).toBeDisabled();
    await modal.getByPlaceholder('Digite o código de confirmação').fill('999');
    await expect(excluir).toBeDisabled();
    await modal.getByPlaceholder('Digite o código de confirmação').fill(String(TURMA.id));
    await expect(excluir).toBeEnabled();
    await modal.getByRole('button', { name: 'Cancelar' }).click();
    await expect(cartao(page, TURMA.descricao)).toBeVisible();
  });

  test('RN-TUR-06: (esperado) modal de exclusão fala de turma', async ({ page }) => {
    test.fail(true, 'DEFEITO TUR-13: o modal diz "Tem certeza que deseja apagar este cargo?" (componente compartilhado, como ESC-06/CIR-07)');
    await abrirLista(page);
    await page.getByRole('button', { name: `Excluir ${TURMA.descricao}`, exact: true }).click();
    await expect(page.getByRole('dialog').last()).toContainText('turma', { timeout: 10_000 });
  });

  test('RN-TUR-07: lixeira — expiração em 90 dias após a exclusão', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-01T12:00:00-03:00'));
    await simular(page, /\/turmas\?trashed=1/, (props) => {
      const base = { ...props.turmas.data[0] };
      props.turmas.data = [
        { ...base, id: 9001, descricao: 'Lixo A', deleted_at: '2026-10-01T14:00:00.000000Z' },
        { ...base, id: 9002, descricao: 'Lixo B', deleted_at: '2026-07-04T16:00:00.000000Z' },
        { ...base, id: 9003, descricao: 'Lixo C', deleted_at: '2026-07-03T15:30:00.000000Z' },
        { ...base, id: 9004, descricao: 'Lixo D', deleted_at: '2026-07-03T14:00:00.000000Z' },
      ];
    });
    await abrirLista(page, '/turmas?trashed=1');
    await expect(page.getByRole('main').getByRole('list').first().getByRole('listitem')).toHaveText(['Dashboard', 'Turmas', 'Lixeira']);
    await expect(page.getByRole('button', { name: 'Criar nova turma' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Voltar para lista de turmas' })).toBeVisible();
    const casos = [['Lixo A', '89d 23h'], ['Lixo B', '1d 1h'], ['Lixo C', '30min'], ['Lixo D', 'Expirado']];
    for (const [nome, expira] of casos) {
      const card = page.locator('.card-wrapper').filter({ has: page.getByRole('button', { name: `Restaurar ${nome}` }) });
      await expect(card).toContainText(`Expira em ${expira}`);
      await expect(card.getByRole('button', { name: `Restaurar ${nome}` })).toBeVisible();
      await expect(card.getByRole('button', { name: `Excluir permanentemente ${nome}` })).toBeVisible();
    }
  });

  test('RN-TUR-07: lixeira vazia', async ({ page }) => {
    await abrirLista(page);
    await page.getByRole('button', { name: 'Ver lixeira de turmas' }).click();
    await expect(page).toHaveURL(/trashed=/, { timeout: 30_000 });
    const { turmas } = await inertiaProps(page, '/turmas?trashed=1');
    test.skip(turmas.total > 0, 'Há turmas na lixeira da homologação');
    await expect(page.getByText('Nenhuma turma na lixeira')).toBeVisible();
  });
});

test.describe('Turmas — formulário e validação', () => {
  test('RN-TUR-08: formulário com abas Básicas/Horários, limites e valores iniciais', async ({ page }) => {
    await abrirFormulario(page);
    await expect(page.getByRole('main').getByRole('list').first().getByRole('listitem')).toHaveText(['Dashboard', 'Turmas', 'Criar']);
    await expect(page.getByRole('tab', { name: 'Básicas' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('textbox', { name: 'Código da Turma' })).toHaveAttribute('maxlength', '20');
    await expect(page.getByRole('textbox', { name: 'Descrição' })).toHaveAttribute('maxlength', '120');
    const ano = page.getByRole('textbox', { name: 'Ano Letivo' });
    await expect(ano).toHaveValue('2026');
    await expect(ano).toHaveAttribute('readonly', /.*/);
    await expect(page.getByRole('checkbox', { name: 'Turma ativa' })).toBeChecked();

    const opcoes = async (campo: string) => {
      await page.getByRole('combobox', { name: campo }).click({ force: true });
      const texto = await page.locator('.v-overlay--active [role="option"]').allTextContents();
      await page.keyboard.press('Escape');
      return texto.map((t) => t.trim());
    };
    expect(await opcoes('Tipo de Turma')).toEqual(['Curricular (etapa de ensino)', 'Atividade complementar', 'Atendimento Educacional Especializado (AEE)', 'Escolarização']);
    expect(await opcoes('Tipo de Mediação')).toEqual(['Presencial', 'Semipresencial', 'Educação a Distância (EaD)']);
    const { etapas_ensino } = await inertiaProps(page, '/turmas/criar');
    expect(etapas_ensino.length).toBeGreaterThan(0);

    await page.getByRole('tab', { name: 'Horários' }).click();
    await expect(page.getByRole('textbox', { name: 'Horário de Início' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Horário de Término' })).toBeVisible();
    for (const dia of ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']) {
      await expect(page.getByRole('checkbox', { name: dia })).toBeVisible();
    }
  });

  test('RN-TUR-08: salvar vazio mostra os obrigatórios (código e descrição)', async ({ page }) => {
    await abrirFormulario(page);
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByRole('main').getByText('O código da turma é obrigatório.').first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('main').getByText('A descrição é obrigatória.').first()).toBeVisible();
    await expect(page).toHaveURL(/\/turmas\/criar$/);
  });

  test('RN-TUR-09: validação do backend (sempre sem descrição → nada é criado)', async ({ page }) => {
    await abrirLista(page);
    const vazio = await inertia(page, 'POST', '/turmas/criar', {});
    expect(vazio.errors).toEqual({ codigo: 'O código da turma é obrigatório.', descricao: 'A descrição é obrigatória.' });

    const r = await inertia(page, 'POST', '/turmas/criar', { codigo: 'QA-123456789012345678901', capacidade_maxima: -5, etapa_ensino_id: 999999, horario_inicio: '25:00', ano_letivo: 1500 });
    expect(r.errors).toMatchObject({
      codigo: 'O código não pode ter mais de 20 caracteres.',
      etapa_ensino_id: 'A etapa de ensino selecionada é inválida.',
      ano_letivo: 'O ano letivo deve ser a partir de 2020.',
      capacidade_maxima: 'A capacidade máxima deve ser pelo menos 1.',
    });
    expect(r.errors!.horario_inicio).toBeDefined();

    expect((await inertia(page, 'POST', '/turmas/criar', { codigo: TURMA.codigo })).errors!.codigo).toBe('Este código de turma já está cadastrado.');
    expect((await inertia(page, 'POST', '/turmas/criar', { descricao: 'x'.repeat(121) })).errors!.descricao).toBe('A descrição não pode ter mais de 120 caracteres.');
    // Edição também valida o código único (sem descrição → nada é alterado).
    expect((await inertia(page, 'PUT', `/turmas/${TURMA.id}`, { codigo: '7ANO-M-2026' })).errors!.codigo).toBe('Este código de turma já está cadastrado.');
    expect((await inertia(page, 'PUT', '/turmas/999999', {})).status).toBe(404);
  });

  test('RN-TUR-10: (esperado) etapa de ensino, tipo de turma e tipo de mediação são obrigatórios', async ({ page }) => {
    test.fail(true, 'DEFEITO TUR-03: só código e descrição são obrigatórios — turma sem etapa de ensino fica sem circuito de notas');
    await abrirLista(page);
    const r = await inertia(page, 'POST', '/turmas/criar', {});
    expect(Object.keys(r.errors ?? {})).toEqual(expect.arrayContaining(['etapa_ensino_id', 'tipo_turma', 'tipo_mediacao']));
  });

  test('RN-TUR-10: (esperado) término depois do início; tipo, mediação e dias dentro das listas', async ({ page }) => {
    test.fail(true, 'DEFEITO TUR-04: aceitos horário 13:00→07:00, tipo_turma 99, tipo_mediacao 9 e dias_semana [0, 8]');
    await abrirLista(page);
    const r = await inertia(page, 'POST', '/turmas/criar', { codigo: novoCodigo(), horario_inicio: '13:00', horario_fim: '07:00', tipo_turma: 99, tipo_mediacao: 9, dias_semana: [0, 8] });
    expect(Object.keys(r.errors ?? {})).toEqual(expect.arrayContaining(['horario_fim', 'tipo_turma', 'tipo_mediacao']));
  });

  test('RN-TUR-10: (esperado) mensagens com o nome do campo em português', async ({ page }) => {
    test.fail(true, 'DEFEITO TUR-14: "O campo horario inicio não corresponde ao formato H:i.", "O campo dias semana deve ser uma matriz.", "O campo capacidade maxima deve ser um número inteiro."');
    await abrirLista(page);
    const r = await inertia(page, 'POST', '/turmas/criar', { capacidade_maxima: 'abc', dias_semana: 'x', horario_inicio: 'abc' });
    for (const m of Object.values(r.errors ?? {})) expect(m).not.toMatch(/horario inicio|dias semana|capacidade maxima|H:i/);
  });
});

test.describe('Turmas — visualizar', () => {
  test('RN-TUR-11: informações da turma, ocupação e alunos matriculados', async ({ page }) => {
    await abrirTurma(page);
    const { turma, matriculas } = await inertiaProps(page, `/turmas/${TURMA.id}/show`);
    await expect(page).toHaveTitle(/^Turmas - /);
    await expect(page.getByRole('main').getByRole('list').first().getByRole('listitem')).toHaveText(['Dashboard', 'Turmas', turma.descricao]);
    await expect(page.getByRole('heading', { level: 5, name: turma.descricao })).toBeVisible();
    const main = page.getByRole('main');
    const tipos: Record<number, string> = { 3: 'Curricular', 4: 'Atividade complementar', 5: 'AEE', 6: 'Escolarização' };
    const mediacoes: Record<number, string> = { 1: 'Presencial', 2: 'Semipresencial', 3: 'EaD' };
    await expect(main).toContainText(rx('Código', turma.codigo));
    await expect(main).toContainText(rx('Etapa de Ensino', turma.etapa_ensino.nome));
    await expect(main).toContainText(rx('Ano Letivo', turma.ano_letivo));
    await expect(main).toContainText(rx('Tipo de Turma', tipos[turma.tipo_turma]));
    await expect(main).toContainText(rx('Tipo de Mediação', mediacoes[turma.tipo_mediacao]));
    await expect(main).toContainText(rx('Status', turma.ativo ? 'Ativa' : 'Inativa'));
    await expect(main).toContainText(rx('Horário de Início', turma.horario_inicio.slice(0, 5)));
    await expect(main).toContainText(rx('Horário de Término', turma.horario_fim.slice(0, 5)));
    await expect(main).toContainText(rx('Ocupação', `${turma.matriculas_count} / ${turma.capacidade_maxima}`));
    await expect(page.getByRole('button', { name: new RegExp(`^\\S \\d+ .+ (Cursando|Transferido|Abandono|Concluído|Falecido|Remanejado|Não Compareceu)`) })).toHaveCount(matriculas.length);
  });

  test('RN-TUR-11: CPF do aluno aparece mascarado na tela', async ({ page }) => {
    await abrirTurma(page);
    const { matriculas } = await inertiaProps(page, `/turmas/${TURMA.id}/show`);
    const m = matriculas.find((x: any) => /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(x.aluno?.cpf ?? ''));
    await page.getByRole('button', { name: new RegExp(esc(m.aluno.nome)) }).click();
    const cpf: string = m.aluno.cpf;
    await expect(page.getByRole('main')).toContainText(`${cpf.slice(0, 3)}.***.***-${cpf.slice(12, 14)}`);
    await expect(page.getByRole('main')).not.toContainText(cpf);
  });

  test('RN-TUR-11: (esperado) dias da semana em ordem', async ({ page }) => {
    test.fail(true, 'DEFEITO TUR-15: os dias aparecem na ordem gravada ("Seg Qua Ter Qui Sex")');
    await abrirTurma(page);
    await expect(page.getByRole('main')).toContainText(rx('Dias da Semana', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex'));
  });

  test('RN-TUR-11: sem capacidade → "Capacidade não definida."', async ({ page }) => {
    await simular(page, new RegExp(`/turmas/${TURMA.id}/show`), (props) => { props.turma.capacidade_maxima = null; });
    await abrirTurma(page);
    await expect(page.getByText('Capacidade não definida.')).toBeVisible();
  });

  test('RN-TUR-12: situação Aberta permite reordenar; Fechada bloqueia', async ({ page }) => {
    await abrirTurma(page);
    const { turma } = await inertiaProps(page, `/turmas/${TURMA.id}/show`);
    expect(turma.situacao).toBe(1);
    await expect(page.getByRole('main')).toContainText(rx('Situação', 'Aberta'));
    await expect(page.getByText('As posições dos alunos podem ser alteradas arrastando o ícone ao lado de cada nome.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fechar Turma' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'A-Z' })).toBeVisible();

    await simular(page, new RegExp(`/turmas/${TURMA.id}/show`), (props) => { props.turma.situacao = 2; });
    await abrirTurma(page);
    await expect(page.getByRole('main')).toContainText(rx('Situação', 'Fechada'));
    await expect(page.getByText('Altere para Aberta para mudar as posições dos alunos.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abrir Turma' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'A-Z' })).toHaveCount(0);
  });
});

test.describe('Turmas — acesso do Professor e exposição de dados', () => {
  test('RN-TUR-13: Professor recebe 403 em criar, editar, imprimir, fechar, excluir e reordenar', async ({ browser }) => {
    await comoProfessor(browser, async (page) => {
      const chamadas: [string, string][] = [
        ['GET', '/turmas/criar'], ['GET', `/turmas/${TURMA.id}`], ['GET', `/turmas/${TURMA.id}/imprimir`],
        ['POST', `/turmas/${TURMA.id}/toggle-situacao`], ['DELETE', `/turmas/${TURMA.id}`],
        ['POST', '/matriculas/reorder-alfabetica'],
      ];
      for (const [m, u] of chamadas) expect(await status(page, m, u), `${m} ${u}`).toBe(403);
    });
  });

  test('RN-TUR-13: (esperado) Professor sem vínculo não abre a turma', async ({ browser }) => {
    test.fail(true, 'DEFEITO TUR-01: a lista do Professor é vazia, mas /turmas/1/show responde 200 com todos os alunos e o CPF completo nas props');
    await comoProfessor(browser, async (page) => {
      expect(await status(page, 'GET', `/turmas/${TURMA.id}/show`)).toBe(403);
    });
  });

  test('RN-TUR-14: (esperado) a tela da turma não envia o CPF completo dos alunos', async ({ page }) => {
    test.fail(true, 'DEFEITO TUR-02: a tela mascara o CPF, mas as props trazem matriculas[].aluno.cpf completo');
    await abrirTurma(page);
    const { matriculas } = await inertiaProps(page, `/turmas/${TURMA.id}/show`);
    for (const m of matriculas) expect(m.aluno?.cpf ?? '').not.toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
  });

  test('RN-TUR-14: (esperado) a listagem não envia CPF/e-mail dos professores nem o cadastro completo da escola', async ({ page }) => {
    test.fail(true, 'DEFEITO TUR-05: cada turma da lista traz profissionais[] com cpf e email e a franquia inteira (dependências, equipamentos…)');
    await abrirLista(page);
    const { turmas } = await inertiaProps(page, '/turmas');
    for (const t of turmas.data) {
      for (const p of t.profissionais) {
        expect(p.cpf).toBeUndefined();
        expect(p.email).toBeUndefined();
      }
      expect(t.franquia?.dependencias).toBeUndefined();
    }
  });
});

test.describe('Turmas — impressão', () => {
  test('RN-TUR-15: ficha da turma com escola, emissão, dados, professores e alunos', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-01T10:00:00-03:00'));
    await page.goto(`/turmas/${TURMA.id}/imprimir`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Emitido em 01/10/2026')).toBeVisible({ timeout: 30_000 });
    const { turma, matriculas } = await inertiaProps(page, `/turmas/${TURMA.id}/show`);
    const corpo = page.locator('body');
    await expect(corpo).toContainText('Colégio Apoio');
    await expect(corpo).toContainText(`${turma.codigo} — ${turma.descricao}`);
    await expect(corpo).toContainText(`${turma.etapa_ensino.nome} · Ano letivo ${turma.ano_letivo}`);
    await expect(corpo).toContainText(rx('Capacidade', `${turma.capacidade_maxima} vagas`));
    await expect(corpo).toContainText(rx('Alunos matriculados', turma.matriculas_count));
    await expect(corpo).toContainText(`Alunos (${matriculas.length})`);
    await expect(page.getByRole('button', { name: 'Imprimir' })).toBeVisible();
  });

  test('RN-TUR-15: (esperado) a aba da impressão tem título', async ({ page }) => {
    test.fail(true, 'DEFEITO TUR-16: o título da página de impressão é " - SAAS - Homologação" (sem o nome da turma)');
    await page.goto(`/turmas/${TURMA.id}/imprimir`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Emitido em/)).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveTitle(new RegExp(esc(TURMA.descricao)));
  });
});

test.describe.serial('Turmas — ciclo completo com turma QA-', () => {
  const codigo = novoCodigo();
  const descricao = `QA Turma ${codigo.slice(-7)}`;

  test.afterAll(async ({ browser }) => {
    // Remove de vez todas as turmas QA-TUR (excluir na lixeira = exclusão definitiva).
    const context = await browser.newContext({ baseURL: BASE_URL, storageState: 'e2e/.auth/user.json' });
    const page = await context.newPage();
    try {
      await page.goto('/turmas', { waitUntil: 'domcontentloaded' });
      for (const trashed of [false, true]) {
        const { turmas } = await inertiaProps(page, trashed ? '/turmas?trashed=1' : '/turmas?search=QA-TUR');
        for (const t of turmas.data.filter((x: any) => x.codigo.startsWith('QA-TUR-'))) {
          await inertia(page, 'DELETE', `/turmas/${t.id}`);
          if (!trashed) await inertia(page, 'DELETE', `/turmas/${t.id}`);
        }
      }
    } finally {
      await context.close();
    }
  });

  test('RN-TUR-16: criar turma pelo formulário → "Turma criada com sucesso!"', async ({ page }) => {
    await abrirFormulario(page);
    await page.getByRole('textbox', { name: 'Código da Turma' }).fill(codigo);
    await page.getByRole('textbox', { name: 'Descrição' }).fill(descricao);
    await page.getByRole('spinbutton', { name: 'Capacidade Máx.' }).fill('2');
    await selecionar(page, 'Tipo de Turma', 'Escolarização');
    await selecionar(page, 'Tipo de Mediação', 'Presencial');
    await selecionar(page, 'Etapa de Ensino', ETAPA_QA.nome);
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Turma criada com sucesso!')).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(/\/turmas$/);

    await page.getByRole('searchbox', { name: 'Pesquisar turmas' }).fill(codigo);
    const card = cartao(page, descricao);
    await expect(card).toContainText(ETAPA_QA.nome, { timeout: 30_000 });
    await expect(card).toContainText(rx('Alunos:', '0 / 2'));
    await expect(card).toContainText('Sem vínculo de circuito de notas');
  });

  test('RN-TUR-16: editar a turma → "Turma atualizada com sucesso!"', async ({ page }) => {
    await abrirLista(page, `/turmas?search=${codigo}`);
    await page.getByRole('button', { name: `Editar ${descricao}` }).click();
    await expect(page.getByRole('main').getByRole('list').first().getByRole('listitem')).toHaveText(['Dashboard', 'Turmas', 'Editar'], { timeout: 30_000 });
    await expect(page.getByRole('textbox', { name: 'Código da Turma' })).toHaveValue(codigo);
    await page.getByRole('spinbutton', { name: 'Capacidade Máx.' }).fill('3');
    // Na edição o botão é "Atualizar".
    await page.getByRole('button', { name: 'Atualizar' }).click();
    await expect(page.getByText('Turma atualizada com sucesso!')).toBeVisible({ timeout: 30_000 });
  });

  test('RN-TUR-16: fechar e reabrir a turma na tela Ver', async ({ page }) => {
    await abrirLista(page, `/turmas?search=${codigo}`);
    await page.getByRole('button', { name: `Ver detalhes de ${descricao}` }).click();
    await expect(page.getByText('Informações da Turma')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Nenhum aluno matriculado nesta turma.')).toBeVisible();
    await page.getByRole('button', { name: 'Fechar Turma' }).click();
    await expect(page.getByRole('button', { name: 'Abrir Turma' })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('main')).toContainText(rx('Situação', 'Fechada'));
    await page.getByRole('button', { name: 'Abrir Turma' }).click();
    await expect(page.getByRole('button', { name: 'Fechar Turma' })).toBeVisible({ timeout: 30_000 });
  });

  test('RN-TUR-16: excluir manda para a lixeira; restaurar devolve à lista', async ({ page }) => {
    await page.clock.setFixedTime(new Date());
    await abrirLista(page, `/turmas?search=${codigo}`);
    await page.getByRole('button', { name: `Excluir ${descricao}`, exact: true }).click();
    const { turmas } = await inertiaProps(page, `/turmas?search=${codigo}`);
    const id = turmas.data[0].id;
    const modal = page.getByRole('dialog').last();
    await modal.getByPlaceholder('Digite o código de confirmação').fill(String(id));
    await modal.getByRole('button', { name: 'Excluir' }).click();
    await expect(cartao(page, descricao)).toHaveCount(0, { timeout: 30_000 });

    await abrirLista(page, '/turmas?trashed=1');
    const card = page.locator('.card-wrapper').filter({ has: page.getByRole('button', { name: `Restaurar ${descricao}` }) });
    await expect(card).toContainText(/Expira em 89d 23h|Expira em 90d 0h/);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/restore')),
      card.getByRole('button', { name: `Restaurar ${descricao}` }).click(),
    ]);
    await abrirLista(page, `/turmas?search=${codigo}`);
    await expect(cartao(page, descricao)).toBeVisible({ timeout: 30_000 });
  });

  test('RN-TUR-16: excluir na lixeira remove de vez', async ({ page }) => {
    await abrirLista(page);
    const { turmas } = await inertiaProps(page, `/turmas?search=${codigo}`);
    const id = turmas.data[0].id;
    await inertia(page, 'DELETE', `/turmas/${id}`);
    await abrirLista(page, '/turmas?trashed=1');
    await page.getByRole('button', { name: `Excluir permanentemente ${descricao}` }).click();
    const modal = page.getByRole('dialog').last();
    await modal.getByPlaceholder('Digite o código de confirmação').fill(String(id));
    await modal.getByRole('button', { name: 'Excluir' }).click();
    await expect(page.getByRole('button', { name: `Restaurar ${descricao}` })).toHaveCount(0, { timeout: 30_000 });
    expect((await inertiaProps(page, '/turmas?trashed=1')).turmas.data.some((t: any) => t.id === id)).toBe(false);
    expect(await status(page, 'GET', `/turmas/${id}/show`)).toBe(404);
  });

  test('RN-TUR-16: (esperado) excluir, restaurar e fechar confirmam com mensagem de sucesso', async ({ page }) => {
    test.fail(true, 'DEFEITO TUR-17: as três ações redirecionam sem flash nem toast de sucesso');
    await abrirLista(page);
    const cod = novoCodigo();
    await inertia(page, 'POST', '/turmas/criar', payloadQA(cod, `QA Turma ${cod.slice(-7)}`));
    const id = (await inertiaProps(page, `/turmas?search=${cod}`)).turmas.data[0].id;
    for (const [m, u] of [['POST', `/turmas/${id}/toggle-situacao`], ['DELETE', `/turmas/${id}`], ['POST', `/turmas/${id}/restore`]]) {
      const r = await inertia(page, m, u);
      expect(Object.keys(r.flash ?? {}), `${m} ${u}`).not.toHaveLength(0);
    }
  });
});
