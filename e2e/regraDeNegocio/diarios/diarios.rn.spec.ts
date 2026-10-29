import { test, expect, type Page, type Locator } from '@playwright/test';

// Regras de negócio do módulo Diários (menu lateral → Acadêmico → Diários).
// Catálogo completo com origem de cada regra: ./REGRAS.md
// Cada teste referencia o identificador RN-DIA-NN do catálogo.
//
// Nenhum lançamento real é gravado: a validação do backend é testada sempre com um
// obrigatório ausente, e as gravações automáticas de faltas/notas são interceptadas.

// Homologação oscila bastante no carregamento (> 30s em alguns picos).
test.describe.configure({ timeout: 90_000 });
// Status de etapa, janela de datas e prazos dependem de "hoje" no fuso do navegador.
test.use({ timezoneId: 'America/Sao_Paulo' });

const RESTRICTED_EMAIL = process.env.RESTRICTED_USER_EMAIL ?? '';
const RESTRICTED_PASSWORD = process.env.RESTRICTED_USER_PASSWORD ?? '';

// Diário real usado só para leitura: Educação Física / 6º Ano (tem 1 aula no 3º Bimestre).
const DIARIO = {
  id: 60, componente: 'Educação Física', turma: '6º Ano', codigo: '6ANO-M-2026',
  titular: 'Jueslen Carlos Ferreira da Silva', etapaEnsino: 'Ensino fundamental de 9 anos - 6º Ano',
  etapa: { id: 258, nome: '3º Bimestre' }, lancamentoId: 5,
};
// Diário da 2ª Série: a turma aponta para uma etapa de ensino sem circuito de notas.
const SEM_CIRCUITO = { id: 29, componente: 'Filosofia', turma: '2º Série', busca: '2SER' };

type Api = { status: number; body: any };

async function abrirLista(page: Page, url = '/diarios'): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('searchbox', { name: 'Pesquisar diários' })).toBeVisible({ timeout: 30_000 });
}

async function abrirDiario(page: Page, id = DIARIO.id, aba = ''): Promise<void> {
  await page.goto(`/diarios/${id}${aba}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('tab', { name: 'Agendas' })).toBeVisible({ timeout: 30_000 });
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

// Chamada JSON às APIs do diário (como o axios do front).
async function api(page: Page, method: string, url: string, body?: unknown): Promise<Api> {
  return page.evaluate(async ({ method, url, body }) => {
    const token = decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '');
    const res = await fetch(url, {
      method, redirect: 'manual',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-XSRF-TOKEN': token, 'X-Requested-With': 'XMLHttpRequest' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, body: await res.json().catch(() => null) };
  }, { method, url, body });
}

async function todosDiarios(page: Page): Promise<any[]> {
  const todos: any[] = [];
  for (let p = 1; p < 20; p++) {
    const { diarios } = await inertiaProps(page, `/diarios?page=${p}`);
    todos.push(...diarios.data);
    if (!diarios.next_page_url) break;
  }
  return todos;
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

async function selecionarEtapa(page: Page, nome: string): Promise<void> {
  await page.getByRole('combobox', { name: 'Filtro por etapa' }).click({ force: true });
  await page.getByRole('option', { name: nome, exact: true }).click();
}

const cartao = (page: Page, componente: string, turma: string): Locator =>
  page.locator('.card-wrapper').filter({ has: page.getByRole('button', { name: `Abrir diário de ${componente} da turma ${turma}` }) });

const linhaEtapa = (page: Page, nome: string): Locator =>
  page.getByRole('row').filter({ has: page.getByRole('cell', { name: nome, exact: true }) });

const dataBR = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/');
const hojeSP = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
const semAcento = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
// O Vue cola rótulo e valor no texto ("Titular:Fulano"): partes separadas por espaços opcionais.
const rx = (...partes: (string | number)[]) => new RegExp(partes.map((p) => esc(String(p))).join('\\s*'));
// Modais do Vuetify podem ter dois elementos com papel dialog (overlay e card).
const dialogo = (page: Page): Locator => page.getByRole('dialog').last();
// A classe de cor pode estar na célula ou num elemento dentro dela.
const comClasse = (celula: Locator, classe: string): Locator =>
  celula.locator(`xpath=self::*[contains(@class,"${classe}")] | .//*[contains(@class,"${classe}")]`);

test.describe('Diários — acesso e listagem', () => {
  test('RN-DIA-01: item do menu leva à listagem "Diários" com breadcrumb e descrição', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.locator('[id="navbar.btn_diarios"]').click();
    await expect(page).toHaveURL(/\/diarios$/, { timeout: 30_000 });
    await expect(page).toHaveTitle(/^Diários - /);
    await expect(page.getByRole('heading', { level: 5, name: 'Diários' })).toBeVisible();
    await expect(page.getByRole('main').getByRole('list').first().getByRole('listitem')).toHaveText(['Dashboard', 'Diários']);
    await expect(page.getByText('Um diário por turma, professor e componente curricular.')).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Pesquisar diários' })).toHaveAttribute('placeholder', 'Turma, professor ou componente...');
  });

  test('RN-DIA-01: Professor vê "Meus Diários", só com os diários em que é titular', async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    try {
      await loginRestrito(page);
      await abrirLista(page);
      await expect(page).toHaveTitle(/^Meus Diários - /);
      await expect(page.getByRole('heading', { level: 5, name: 'Meus Diários' })).toBeVisible();
      await expect(page.getByText('Os diários em que você é o professor titular.')).toBeVisible();
      const props = await inertiaProps(page, '/diarios');
      expect(props.restritoAVinculo).toBe(true);
      // Na homologação o Professor restrito não é titular de nenhum diário.
      expect(props.diarios.total).toBe(0);
      await expect(page.getByText('Você ainda não tem diários. A coordenação atribui os componentes curriculares no cadastro do profissional')).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test('RN-DIA-02: cada cartão mostra componente, turma, titular, carga horária, ano, etapas e aulas', async ({ page }) => {
    await abrirLista(page);
    const { diarios } = await inertiaProps(page, '/diarios');
    expect(diarios.per_page).toBe(15);
    for (const d of diarios.data) {
      const card = cartao(page, d.componente.nome, d.turma.descricao);
      await expect(card).toContainText(d.componente.nome);
      await expect(card).toContainText(d.componente.sigla);
      await expect(card).toContainText(rx(d.turma.codigo, '—', d.turma.descricao));
      await expect(card).toContainText(rx('Titular:', d.profissional_turma.profissional.nome));
      const ch = d.carga_horaria ? `${d.carga_horaria}h aula / ${d.carga_horaria_relogio}h relógio` : '—';
      await expect(card).toContainText(rx('Carga horária:', ch));
      await expect(card).toContainText(rx('Ano letivo:', d.turma.ano_letivo));
      await expect(card).toContainText(rx('Etapas:', d.etapas_count));
      await expect(card).toContainText(rx('Aulas:', Number(d.aulas_count)));
      if (d.etapas_count) await expect(card).not.toContainText('Ainda sem etapa materializada');
      else await expect(card).toContainText('Ainda sem etapa materializada');
    }
  });

  test('RN-DIA-02: sem componente e sem carga horária, exibe "Sem componente" e "—"', async ({ page }) => {
    await simular(page, /\/diarios(\?.*)?$/, (props) => {
      props.diarios.data[0] = { ...props.diarios.data[0], componente: null, carga_horaria: null, carga_horaria_relogio: null };
    });
    await abrirLista(page);
    const card = page.locator('.card-wrapper').first();
    await expect(card).toContainText('Sem componente');
    await expect(card).toContainText(rx('Carga horária:', '—'));
  });

  test('RN-DIA-03: "Carregar mais" acrescenta a próxima página e some na última', async ({ page }) => {
    await abrirLista(page);
    const { diarios } = await inertiaProps(page, '/diarios');
    const contador = page.getByText(/Exibindo de \d/);
    await expect(contador).toHaveText(`Exibindo de 1 até ${diarios.data.length} de ${diarios.total}`);
    const botao = page.getByRole('button', { name: 'Carregar mais diários' });
    for (let p = 2; p <= diarios.last_page; p++) {
      await botao.click();
      await expect(contador).toHaveText(`Exibindo de 1 até ${Math.min(p * diarios.per_page, diarios.total)} de ${diarios.total}`, { timeout: 30_000 });
    }
    await expect(botao).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Abrir diário de / })).toHaveCount(diarios.total);
  });

  const buscas = [
    { termo: 'Geografia', criterio: 'componente' },
    { termo: 'LLEI', criterio: 'sigla do componente' },
    { termo: 'Giovani', criterio: 'professor titular' },
    { termo: '9ANO', criterio: 'código da turma' },
    { termo: '9º Ano', criterio: 'descrição da turma' },
    { termo: 'fisica', criterio: 'sem acento e em minúsculas' },
  ];
  for (const { termo, criterio } of buscas) {
    test(`RN-DIA-04: busca por ${criterio} ("${termo}")`, async ({ page }) => {
      await abrirLista(page);
      const alvo = semAcento(termo);
      const esperado = (await todosDiarios(page)).filter((d) =>
        [d.turma?.codigo, d.turma?.descricao, d.componente?.nome, d.componente?.sigla, d.profissional_turma?.profissional?.nome]
          .some((v) => v && semAcento(v).includes(alvo))).length;
      expect(esperado).toBeGreaterThan(0);
      await page.getByRole('searchbox', { name: 'Pesquisar diários' }).fill(termo);
      await expect(page).toHaveURL(/[?&]search=/, { timeout: 30_000 });
      await expect(page.getByText(/Exibindo de \d/)).toHaveText(new RegExp(`de ${esperado}$`), { timeout: 30_000 });
    });
  }

  test('RN-DIA-04: busca sem resultado mostra o estado vazio com o termo', async ({ page }) => {
    await abrirLista(page, '/diarios?search=zzzz-inexistente');
    await expect(page.getByText(/Exibindo de \d/)).toHaveText('Exibindo de 0 até 0 de 0');
    await expect(page.getByText('Nenhum diário encontrado para “zzzz-inexistente”')).toBeVisible();
  });

  test('RN-DIA-04: filtro por turma pela URL (?turma_id=)', async ({ page }) => {
    await abrirLista(page);
    const esperado = (await todosDiarios(page)).filter((d) => d.turma_id === 1).length;
    await abrirLista(page, '/diarios?turma_id=1');
    await expect(page.getByText(/Exibindo de \d/)).toHaveText(`Exibindo de 1 até ${esperado} de ${esperado}`);
    await expect(page.getByRole('button', { name: /^Abrir diário de .* da turma 6º Ano$/ })).toHaveCount(esperado);
  });

  test('RN-DIA-05: "Abrir" leva à tela do diário', async ({ page }) => {
    await abrirLista(page);
    await page.getByRole('button', { name: `Abrir diário de ${DIARIO.componente} da turma ${DIARIO.turma}` }).click();
    await expect(page).toHaveURL(new RegExp(`/diarios/${DIARIO.id}$`), { timeout: 30_000 });
  });
});

test.describe('Diários — impressão', () => {
  test('RN-DIA-06: menu Imprimir lista os documentos e o diário de cada etapa do circuito', async ({ page }) => {
    await abrirLista(page);
    const { diarios } = await inertiaProps(page, '/diarios');
    const diario = diarios.data.find((d: any) => d.id === DIARIO.id);
    await page.getByRole('button', { name: `Opções de impressão do diário de ${DIARIO.componente} da turma ${DIARIO.turma}` }).click();
    const menu = page.locator('.v-overlay--active .v-list').last();
    await expect(menu.getByRole('link', { name: 'Relação de alunos' })).toHaveAttribute('href', new RegExp(`/diarios/${DIARIO.id}/imprimir/alunos$`));
    await expect(menu.getByRole('link', { name: 'Boletim de notas' })).toHaveAttribute('href', new RegExp(`/diarios/${DIARIO.id}/imprimir/boletim$`));
    await expect(menu.getByRole('link', { name: 'Boletim individual Uma página por aluno' })).toHaveAttribute('href', new RegExp(`/diarios/${DIARIO.id}/imprimir/boletim-alunos$`));
    const etapas = menu.getByRole('link', { name: /^Diário — / });
    await expect(etapas).toHaveCount(diario.etapas_impressao.length);
    for (const [i, e] of diario.etapas_impressao.entries()) {
      await expect(etapas.nth(i)).toHaveAttribute('href', new RegExp(`/imprimir/etapa\\?circuito_etapa_id=${e.circuito_etapa_id}$`));
      await expect(etapas.nth(i)).toContainText(`Diário — ${e.nome}`);
    }
  });

  test('RN-DIA-06: etapa sem lançamentos imprime "folha em branco"; etapa sem nome usa a ordem', async ({ page }) => {
    await simular(page, /\/diarios(\?.*)?$/, (props) => {
      const d = props.diarios.data.find((x: any) => x.id === DIARIO.id);
      d.etapas_impressao = [
        { ...d.etapas_impressao[0], materializada: false },
        { ...d.etapas_impressao[1], nome: null, ordem: 2 },
      ];
    });
    await abrirLista(page);
    await page.getByRole('button', { name: `Opções de impressão do diário de ${DIARIO.componente} da turma ${DIARIO.turma}` }).click();
    const menu = page.locator('.v-overlay--active .v-list').last();
    await expect(menu.getByRole('link', { name: /^Diário — / }).first()).toContainText('Sem lançamentos — folha em branco');
    await expect(menu.getByRole('link', { name: 'Diário (etapa 2)' })).toBeVisible();
  });

  test('RN-DIA-06: turma sem circuito ativo → "Sem etapas configuradas"', async ({ page }) => {
    await abrirLista(page, `/diarios?search=${SEM_CIRCUITO.busca}`);
    await page.getByRole('button', { name: `Opções de impressão do diário de ${SEM_CIRCUITO.componente} da turma ${SEM_CIRCUITO.turma}` }).click();
    const menu = page.locator('.v-overlay--active .v-list').last();
    await expect(menu.getByRole('link', { name: /^Diário — / })).toHaveCount(0);
    await expect(menu).toContainText('Sem etapas configuradas');
    await expect(menu).toContainText('A turma não tem circuito de notas ativo neste ano letivo');
  });

  test('RN-DIA-07: boletim pergunta para quem gerar (todos, ou alunos escolhidos com busca)', async ({ page }) => {
    await abrirLista(page);
    const { alunos } = (await api(page, 'GET', `/diarios/${DIARIO.id}/alunos`)).body;
    await page.getByRole('button', { name: `Opções de impressão do diário de ${DIARIO.componente} da turma ${DIARIO.turma}` }).click();
    await page.locator('.v-overlay--active .v-list').last().getByRole('link', { name: 'Boletim de notas' }).click();

    const dialog = dialogo(page);
    await expect(dialog.getByRole('heading', { name: 'Boletim de notas' })).toBeVisible();
    await expect(dialog.getByText('Para quem você quer gerar?')).toBeVisible();
    await expect(dialog.getByRole('radio', { name: `Todos os alunos (${alunos.length})` })).toBeChecked();
    await expect(dialog.getByRole('button', { name: `Gerar para todos (${alunos.length})` })).toBeEnabled();

    await dialog.getByText('Escolher alunos').click();
    await expect(dialog.getByRole('button', { name: 'Selecione ao menos um aluno' })).toBeDisabled();
    await expect(dialog.getByRole('list', { name: 'Matrículas do diário' }).getByRole('checkbox')).toHaveCount(alunos.length);

    // Nome sem acento e em minúsculas.
    const busca = dialog.getByRole('textbox', { name: 'Buscar por nome do aluno ou nº da matrícula' });
    await busca.fill('joao');
    const joao = alunos.filter((a: any) => semAcento(a.nome).includes('joao'));
    await expect(dialog.getByRole('list', { name: 'Matrículas do diário' }).getByRole('checkbox')).toHaveCount(joao.length);
    await expect(dialog.getByRole('button', { name: 'Marcar os encontrados' })).toBeVisible();
    await dialog.getByRole('checkbox', { name: new RegExp(`^${joao[0].nome}`) }).click();
    await expect(dialog.getByRole('button', { name: `Gerar para ${joao[0].nome}` })).toBeEnabled();

    // Nº da matrícula: busca pelo prefixo.
    await busca.fill('1');
    const prefixo1 = alunos.filter((a: any) => String(a.matricula_id).startsWith('1'));
    await expect(dialog.getByRole('list', { name: 'Matrículas do diário' }).getByRole('checkbox')).toHaveCount(prefixo1.length);
    const outro = prefixo1.find((a: any) => a.nome !== joao[0].nome);
    await dialog.getByRole('checkbox', { name: new RegExp(`^${outro.nome}`) }).click();
    await expect(dialog.getByRole('button', { name: 'Gerar para 2 alunos' })).toBeEnabled();

    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toHaveCount(0);
  });
});

test.describe('Diários — acesso ao diário', () => {
  test('RN-DIA-08: Professor recebe 403 na tela e em todas as APIs de um diário em que não é titular', async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    try {
      await loginRestrito(page);
      const id = DIARIO.id;
      const e = DIARIO.etapa.id;
      const chamadas: [string, string, unknown?][] = [
        ['GET', `/diarios/${id}`],
        ['GET', `/diarios/${id}/aulas?circuito_etapa_id=${e}`],
        ['GET', `/diarios/${id}/faltas?circuito_etapa_id=${e}`],
        ['GET', `/diarios/${id}/notas?circuito_etapa_id=${e}`],
        ['GET', `/diarios/${id}/alunos`],
        ['GET', `/diarios/${id}/posse?circuito_etapa_id=${e}`],
        ['GET', `/diarios/${id}/agendas`],
        ['POST', `/diarios/${id}/aulas`, { circuito_etapa_id: e }],
        ['POST', `/diarios/${id}/faltas`, { circuito_etapa_id: e }],
        ['POST', `/diarios/${id}/notas`, { circuito_etapa_id: e }],
        ['POST', `/diarios/${id}/posse`, {}],
        ['GET', `/diarios/${id}/imprimir/alunos`],
      ];
      for (const [method, url, body] of chamadas) {
        expect((await api(page, method, url, body)).status, `${method} ${url}`).toBe(403);
      }
    } finally {
      await context.close();
    }
  });

  test('RN-DIA-08: diário inexistente → 404', async ({ page }) => {
    await abrirLista(page);
    expect((await api(page, 'GET', '/diarios/999999')).status).toBe(404);
  });
});

test.describe('Diários — tela do diário', () => {
  test('RN-DIA-09: cabeçalho com breadcrumb, abas Diários/Agendas e ações ainda desabilitadas', async ({ page }) => {
    await abrirDiario(page);
    await expect(page).toHaveTitle(new RegExp(`^Diário — ${DIARIO.componente} - `));
    await expect(page.getByRole('main').getByRole('list').first().getByRole('listitem')).toHaveText(['Diários', `${DIARIO.componente} · ${DIARIO.codigo}`]);
    await expect(page.getByRole('tab', { name: 'Diários' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('heading', { level: 5, name: DIARIO.componente })).toBeVisible();
    await expect(page.getByText(`${DIARIO.codigo} — ${DIARIO.turma} · ${DIARIO.titular}`)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enviar mensagem' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Exportar Excel' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Opções de impressão do diário' })).toBeEnabled();

    await abrirDiario(page, DIARIO.id, '?aba=agendas');
    await expect(page.getByRole('tab', { name: 'Agendas' })).toHaveAttribute('aria-selected', 'true');
  });

  test('RN-DIA-10: dados do diário — turma, turno, carga horária e percentual cumprido', async ({ page }) => {
    await abrirDiario(page);
    const { diario, turma } = await inertiaProps(page, `/diarios/${DIARIO.id}`);
    const main = page.getByRole('main');
    await expect(main).toContainText(rx('Turma', `${turma.codigo} — ${turma.descricao}`, `(${turma.etapa_ensino.nome})`));
    await expect(main).toContainText(rx('Turno', `Manhã (${turma.horario_inicio.slice(0, 5)} — ${turma.horario_fim.slice(0, 5)})`));
    const ch = parseFloat(diario.carga_horaria);
    await expect(main).toContainText(rx('Carga Horária do Diário', `${ch}h aula / ${parseFloat(diario.carga_horaria_relogio)}h relógio`));
    await expect(main).toContainText(rx(`${Math.round((diario.aulas_ministradas / ch) * 100)}%`, 'Aulas Ministradas', `${diario.aulas_ministradas} de ${ch} aulas`));
  });

  const turnos = [
    { inicio: '12:00:00', fim: '13:00:00', texto: 'Manhã (12:00 — 13:00)' },
    { inicio: '12:01:00', fim: '16:00:00', texto: 'Tarde (12:01 — 16:00)' },
    { inicio: '16:59:00', fim: '18:00:00', texto: 'Tarde (16:59 — 18:00)' },
    { inicio: '17:00:00', fim: '22:00:00', texto: 'Noite (17:00 — 22:00)' },
    { inicio: null, fim: null, texto: '—' },
  ];
  for (const { inicio, fim, texto } of turnos) {
    test(`RN-DIA-10: turno pelo horário de início ${inicio ?? 'vazio'} → "${texto}"`, async ({ page }) => {
      await simular(page, new RegExp(`/diarios/${DIARIO.id}(\\?.*)?$`), (props) => {
        props.turma.horario_inicio = inicio;
        props.turma.horario_fim = fim;
      });
      await abrirDiario(page);
      await expect(page.getByRole('main')).toContainText(rx('Turno', texto));
    });
  }

  test('RN-DIA-11: status de cada etapa pela data de hoje (posse do diário ou calendário do circuito)', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-01T10:00:00-03:00'));
    const etapa = (id: number, nome: string, inicio: string | null, fim: string | null) => ({
      id, nome, ordem: id - 9000,
      periodo_calendario_inicio: inicio && `${inicio}T03:00:00.000000Z`,
      periodo_calendario_fim: fim && `${fim}T03:00:00.000000Z`,
    });
    await simular(page, new RegExp(`/diarios/${DIARIO.id}(\\?.*)?$`), (props) => {
      props.circuito.versao_ativa.etapas = [
        etapa(9001, 'Simulada A', '2026-10-02', '2026-12-31'),
        etapa(9002, 'Simulada B', '2026-11-01', '2026-12-31'),
        etapa(9003, 'Simulada C', '2026-01-01', '2026-09-30'),
        etapa(9004, 'Simulada D', '2026-09-01', '2026-10-01'),
        etapa(9005, 'Simulada E', '2026-09-01', '2026-10-02'),
        etapa(9006, 'Simulada F', null, null),
        etapa(9007, 'Simulada G', '2026-01-01', '2026-09-30'),
        etapa(9008, 'Simulada H', '2026-01-01', '2026-09-30'),
      ];
      props.instanciasDoDiario = {
        9007: { posse_inicio: '2026-01-01', posse_fim: '2026-10-10', prorrogada: true },
        9008: { posse_inicio: '2026-01-01', posse_fim: '2026-10-31', prorrogada: false },
      };
    });
    await abrirDiario(page);
    const casos = [
      ['Simulada A', 'Inicia em 1 dia', ''],
      ['Simulada B', 'Inicia em 31 dias', ''],
      ['Simulada C', 'Encerrado', ''],
      ['Simulada D', 'Ativo — Último dia', ''],
      ['Simulada E', 'Ativo — Faltam 1 dia', ''],
      ['Simulada F', '—', ''],
      ['Simulada G', 'Prorrogado — Faltam 9 dias', '01/01/2026 — 10/10/2026'],
      ['Simulada H', 'Ativo — Faltam 30 dias', '01/01/2026 — 31/10/2026'],
    ];
    for (const [nome, status, posse] of casos) {
      const celulas = linhaEtapa(page, nome).getByRole('cell');
      await expect(celulas.nth(2), nome).toHaveText(status);
      if (posse.includes('—')) await expect(celulas.nth(3), nome).toHaveText(posse);
    }
    // Sem instância (posse), o período da posse repete o calendário do circuito.
    await expect(linhaEtapa(page, 'Simulada C').getByRole('cell').nth(3)).toHaveText('01/01/2026 — 30/09/2026');
    await expect(linhaEtapa(page, 'Simulada F').getByRole('cell').nth(1)).toHaveText('—');
  });

  test('RN-DIA-12: (esperado) colunas "Entregue" e "Aulas ministradas" mostram os dados da etapa', async ({ page }) => {
    test.fail(true, 'DEFEITO DIA-03: as duas colunas são fixas em "—", embora as props tragam entregue e aulas_ministradas (3º Bimestre tem 1 aula)');
    await abrirDiario(page);
    const { instanciasDoDiario } = await inertiaProps(page, `/diarios/${DIARIO.id}`);
    const instancia = instanciasDoDiario[DIARIO.etapa.id];
    expect(instancia.aulas_ministradas).toBeGreaterThan(0);
    await expect(linhaEtapa(page, DIARIO.etapa.nome).getByRole('cell').nth(5)).toHaveText(String(instancia.aulas_ministradas));
  });

  test('RN-DIA-13: rodapé mostra a versão ativa do circuito', async ({ page }) => {
    await abrirDiario(page);
    const { circuito } = await inertiaProps(page, `/diarios/${DIARIO.id}`);
    await expect(page.getByText(/Circuito: /)).toContainText(`v${circuito.versao_ativa.versao_major}.${circuito.versao_ativa.versao_minor}`);
  });

  test('RN-DIA-13: (esperado) rodapé identifica a etapa de ensino do circuito', async ({ page }) => {
    test.fail(true, 'DEFEITO DIA-05: o rodapé mostra "Circuito: — — vX.Y" porque o backend não envia circuito.etapa_ensino');
    await abrirDiario(page);
    await expect(page.getByText(/Circuito: /)).toContainText(`Circuito: ${DIARIO.etapaEnsino} — v`);
  });

  test('RN-DIA-14: diário de turma sem circuito não tem etapas para filtrar', async ({ page }) => {
    await abrirDiario(page, SEM_CIRCUITO.id);
    const { circuito, instanciasDoDiario } = await inertiaProps(page, `/diarios/${SEM_CIRCUITO.id}`);
    expect(circuito).toBeNull();
    expect(instanciasDoDiario).toEqual([]);
    await expect(page.getByRole('cell', { name: 'Nenhuma etapa cadastrada no circuito' })).toBeVisible();
    await expect(page.getByText('Selecione uma etapa no filtro acima')).toBeVisible();
  });

  test('RN-DIA-14: (esperado) sem circuito, a tela avisa que a turma não tem circuito ativo', async ({ page }) => {
    test.fail(true, 'DEFEITO DIA-06: a tela diz "Nenhuma etapa cadastrada no circuito", mas não há circuito (a listagem diz corretamente "A turma não tem circuito de notas ativo")');
    await abrirDiario(page, SEM_CIRCUITO.id);
    await expect(page.getByText(/não tem circuito de notas ativo/)).toBeVisible();
  });

  test('RN-DIA-15: sub-abas de registro; seleção de etapa obrigatória; abas futuras "Em desenvolvimento"', async ({ page }) => {
    await abrirDiario(page);
    const abas = ['Registro de aulas', 'Registro de faltas', 'Registro de notas/conceitos', 'Material de aula', 'Observações', 'Estatísticas'];
    for (const nome of abas) await expect(page.getByRole('tab', { name: nome })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Registro de aulas' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Selecione uma etapa no filtro acima')).toBeVisible();
    for (const nome of ['Material de aula', 'Observações', 'Estatísticas']) {
      await page.getByRole('tab', { name: nome }).click();
      await expect(page.getByText('Em desenvolvimento')).toBeVisible();
    }
  });

  test('RN-DIA-15: sem permissão de aulas, faltas e notas, nenhuma sub-aba é exibida', async ({ page }) => {
    await simular(page, new RegExp(`/diarios/${DIARIO.id}(\\?.*)?$`), (props) => {
      props.auth.permissions = props.auth.permissions.filter((p: string) => !['turmas.diario.aulas', 'turmas.diario.faltas', 'turmas.diario.notas'].includes(p));
    });
    await abrirDiario(page);
    await expect(page.getByText('Você não tem permissão para visualizar os registros deste diário')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Registro de aulas' })).toHaveCount(0);
  });
});

test.describe('Diários — prazo e entrega da etapa', () => {
  test('RN-DIA-16: prazo da etapa e pedido de prorrogação (justificativa obrigatória)', async ({ page }) => {
    await abrirDiario(page);
    const posse = (await api(page, 'GET', `/diarios/${DIARIO.id}/posse?circuito_etapa_id=${DIARIO.etapa.id}`)).body;
    expect(posse.origem).toBe('calendario');
    await selecionarEtapa(page, DIARIO.etapa.nome);
    const chip = page.getByText(`Prazo até ${dataBR(posse.prazo_vigente)}`);
    await expect(chip).toBeVisible({ timeout: 30_000 });
    await chip.click();

    const dialog = dialogo(page);
    await expect(dialog).toContainText('Prazo da etapa');
    await expect(dialog).toContainText(`${DIARIO.etapa.nome} · ${DIARIO.componente} · ${DIARIO.turma}`);
    await expect(dialog).toContainText(rx('Prazo vigente', dataBR(posse.prazo_vigente)));
    await expect(dialog).toContainText('Calendário do circuito');
    // O novo prazo começa no limite mínimo (dia seguinte ao prazo vigente).
    await expect(dialog.getByRole('textbox', { name: 'Novo prazo até' })).toHaveValue(dataBR(posse.limites.minima));
    await expect(dialog.getByRole('textbox', { name: 'Justificativa' })).toHaveAttribute('placeholder', 'Explique por que precisa de mais prazo');

    // Justificativa vazia: o backend recusa (422) e nada é criado.
    await dialog.getByRole('button', { name: 'Enviar pedido' }).click();
    await expect(dialog.getByText('Explique por que precisa de mais prazo.')).toBeVisible({ timeout: 30_000 });
    await dialog.getByRole('button', { name: 'Fechar' }).click();
    await expect(dialog).toHaveCount(0);
  });

  const prazos = [
    { caso: 'pedido pendente', posse: { prazo_vigente: '2026-10-31', historico: [{ status: 'pendente', solicitado_em: '2026-10-05' }] }, texto: 'Prorrogação pendente desde 05/10/2026' },
    { caso: 'último pedido indeferido', posse: { prazo_vigente: '2026-10-31', historico: [{ status: 'indeferida', decidido_em: '2026-10-06' }] }, texto: 'Pedido indeferido em 06/10/2026' },
    { caso: 'prazo vencido', posse: { prazo_vigente: '2026-09-30', vencido: true }, texto: 'Prazo encerrado em 30/09/2026' },
    { caso: 'prazo prorrogado', posse: { prazo_vigente: '2026-11-15', origem: 'prorrogacao' }, texto: 'Prazo prorrogado até 15/11/2026' },
    { caso: 'prazo do calendário', posse: { prazo_vigente: '2026-10-31' }, texto: 'Prazo até 31/10/2026' },
    { caso: 'sem prazo', posse: { prazo_vigente: null }, texto: 'Sem prazo definido' },
  ];
  for (const { caso, posse, texto } of prazos) {
    test(`RN-DIA-16: chip do prazo — ${caso} → "${texto}"`, async ({ page }) => {
      await page.route(/\/diarios\/\d+\/posse\?/, (route) => route.fulfill({
        json: { etapa: { id: 13, descricao: DIARIO.etapa.nome }, origem: 'calendario', vencido: false, bloqueio: null, historico: [], limites: { minima: '2026-11-01', maxima: '2026-12-31' }, ...posse },
      }));
      await abrirDiario(page);
      await selecionarEtapa(page, DIARIO.etapa.nome);
      await expect(page.getByText(texto, { exact: true })).toBeVisible({ timeout: 30_000 });
    });
  }

  test('RN-DIA-17: (esperado) "Entregar <etapa>" registra a entrega da etapa', async ({ page }) => {
    test.fail(true, 'DEFEITO DIA-02: o botão "Entregar" não tem ação — nenhuma requisição nem diálogo ao clicar');
    await abrirDiario(page);
    await selecionarEtapa(page, DIARIO.etapa.nome);
    const entregar = page.getByRole('button', { name: `Entregar ${DIARIO.etapa.nome}` });
    await expect(entregar).toBeEnabled({ timeout: 30_000 });
    const acao = Promise.race([
      page.waitForRequest((r) => r.method() !== 'GET' && r.url().includes(`/diarios/${DIARIO.id}`), { timeout: 5_000 }),
      dialogo(page).waitFor({ timeout: 5_000 }),
    ]);
    await entregar.click();
    await acao;
  });
});

test.describe('Diários — registro de aulas', () => {
  test('RN-DIA-18: lista os lançamentos da etapa e abre o formulário de novo lançamento', async ({ page }) => {
    await abrirDiario(page);
    const { lancamentos, pode_editar } = (await api(page, 'GET', `/diarios/${DIARIO.id}/aulas?circuito_etapa_id=${DIARIO.etapa.id}`)).body;
    expect(pode_editar).toBe(true);
    await selecionarEtapa(page, DIARIO.etapa.nome);
    for (const l of lancamentos) {
      const linha = page.getByRole('button', { name: `Ver detalhes do lançamento de ${dataBR(l.data_aula)}` });
      const celulas = linha.getByRole('cell');
      await expect(celulas.nth(0)).toHaveText(dataBR(l.data_aula));
      await expect(celulas.nth(1)).toHaveText(String(l.quantidade));
      await expect(celulas.nth(2)).toHaveText(l.conteudo);
    }

    await page.getByRole('button', { name: 'Novo Lançamento' }).click();
    const dialog = dialogo(page);
    await expect(dialog).toContainText('Novo Lançamento de Aula');
    await expect(dialog.getByLabel('Quantidade de aulas')).toHaveValue('1');
    // Sem data e sem conteúdo: o backend recusa (422) e mostra os erros nos campos.
    await dialog.getByRole('button', { name: 'Salvar' }).click();
    await expect(dialog.getByText('O campo data aula é obrigatório.')).toBeVisible({ timeout: 30_000 });
    await expect(dialog.getByText('O campo conteudo é obrigatório.')).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toHaveCount(0);
  });

  test('RN-DIA-18: janela de datas da aula = início da etapa até hoje (limitada ao fim da etapa)', async ({ page }) => {
    await abrirDiario(page);
    const { circuito } = await inertiaProps(page, `/diarios/${DIARIO.id}`);
    const etapa = circuito.versao_ativa.etapas.find((e: any) => e.id === DIARIO.etapa.id);
    const inicio = etapa.periodo_calendario_inicio.slice(0, 10);
    const fim = etapa.periodo_calendario_fim.slice(0, 10);
    const { janela } = (await api(page, 'GET', `/diarios/${DIARIO.id}/aulas?circuito_etapa_id=${DIARIO.etapa.id}`)).body;
    expect(janela.data_aula_min).toBe(inicio);
    expect(janela.data_aula_max).toBe([hojeSP(), fim].sort()[0]);
    expect(janela.bloqueada).toBe(false);
  });

  test('RN-DIA-18: validação do backend do lançamento de aula', async ({ page }) => {
    await abrirDiario(page);
    const url = `/diarios/${DIARIO.id}/aulas`;
    const base = { circuito_etapa_id: DIARIO.etapa.id, turma_id: 1 }; // sem conteúdo → nada é gravado

    const vazio = await api(page, 'POST', url, {});
    expect(vazio.status).toBe(422);
    expect(vazio.body.errors).toMatchObject({
      quantidade: ['O campo quantidade é obrigatório.'], conteudo: ['O campo conteudo é obrigatório.'],
      data_aula: ['O campo data aula é obrigatório.'], etapa_id: ['Informe a etapa.'],
    });

    const futura = await api(page, 'POST', url, { ...base, data_aula: '2026-12-20', quantidade: 0 });
    expect(futura.body.errors.quantidade).toEqual(['O campo quantidade deve ser pelo menos 1.']);
    expect(futura.body.errors.data_aula).toEqual(expect.arrayContaining(['A data da aula não pode ser futura.', expect.stringMatching(/^A data da aula deve ser até \d{2}\/\d{2}\/\d{4}\.$/)]));

    const anterior = await api(page, 'POST', url, { ...base, data_aula: '2026-07-01', quantidade: 1 });
    expect(anterior.body.errors.data_aula).toEqual([expect.stringMatching(/^A data da aula deve ser a partir de \d{2}\/\d{2}\/\d{4}\.$/)]);
  });

  test('RN-DIA-19: (esperado) quantidade de aulas por lançamento tem limite máximo', async ({ page }) => {
    test.fail(true, 'DEFEITO DIA-04: quantidade 99 num único lançamento passa na validação (front só tem min=1, backend só "pelo menos 1")');
    await abrirDiario(page);
    const r = await api(page, 'POST', `/diarios/${DIARIO.id}/aulas`, { circuito_etapa_id: DIARIO.etapa.id, turma_id: 1, data_aula: '2026-09-10', quantidade: 99 });
    expect(r.status).toBe(422);
    expect(r.body.errors.quantidade).toBeDefined();
  });

  test('RN-DIA-19: (esperado) mensagens de validação com o nome do campo em português', async ({ page }) => {
    test.fail(true, 'DEFEITO DIA-07: "O campo conteudo é obrigatório.", "O campo data aula é obrigatório.", "O campo matricula id é obrigatório."');
    await abrirDiario(page);
    const r = await api(page, 'POST', `/diarios/${DIARIO.id}/aulas`, {});
    expect(r.body.errors.conteudo).toEqual(['O campo conteúdo é obrigatório.']);
    expect(r.body.errors.data_aula).toEqual(['O campo data da aula é obrigatório.']);
  });
});

test.describe('Diários — registro de faltas', () => {
  test('RN-DIA-20: grade de faltas por aula, com total e % de frequência (< 75% em vermelho)', async ({ page }) => {
    await abrirDiario(page);
    const dados = (await api(page, 'GET', `/diarios/${DIARIO.id}/faltas?circuito_etapa_id=${DIARIO.etapa.id}`)).body;
    await selecionarEtapa(page, DIARIO.etapa.nome);
    await page.getByRole('tab', { name: 'Registro de faltas' }).click();
    for (const l of dados.lancamentos) {
      await expect(page.getByRole('columnheader', { name: `${dataBR(l.data_aula).slice(0, 5)} ${l.quantidade} aula(s)` })).toBeVisible({ timeout: 30_000 });
    }
    await expect(page.getByRole('columnheader', { name: 'Total Faltas' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '% Frequência' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /^Faltas de / })).toHaveCount(dados.alunos.length * dados.lancamentos.length);

    const l = dados.lancamentos[0];
    for (const a of dados.alunos) {
      const falta = dados.faltas[`${a.id}_${l.id}`]?.quantidade ?? 0;
      await expect(page.getByRole('textbox', { name: `Faltas de ${a.nome} em ${dataBR(l.data_aula).slice(0, 5)}` })).toHaveValue(String(falta));
      const total = dados.totais[a.id];
      const linha = page.getByRole('row').filter({ has: page.getByRole('cell', { name: a.nome, exact: true }) });
      await expect(linha.getByRole('cell').nth(1 + dados.lancamentos.length)).toHaveText(String(total?.total_faltas ?? 0));
      const freq = linha.getByRole('cell').last();
      await expect(freq).toHaveText(total ? `${Math.round(total.percentual_frequencia)}%` : '—');
      await expect(comClasse(freq, 'text-error')).toHaveCount(total && total.percentual_frequencia < 75 ? 1 : 0);
    }
  });

  test('RN-DIA-20: falta digitada é limitada à quantidade de aulas do lançamento e salva sozinha', async ({ page }) => {
    const enviados: any[] = [];
    // Intercepta a gravação: nada chega ao servidor.
    await page.route(`**/diarios/${DIARIO.id}/faltas`, async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      enviados.push(route.request().postDataJSON());
      await route.fulfill({ json: { totais: { total_faltas: 1, percentual_frequencia: 0 } } });
    });
    await abrirDiario(page);
    const dados = (await api(page, 'GET', `/diarios/${DIARIO.id}/faltas?circuito_etapa_id=${DIARIO.etapa.id}`)).body;
    const l = dados.lancamentos.find((x: any) => x.id === DIARIO.lancamentoId);
    const aluno = dados.alunos.find((a: any) => (dados.faltas[`${a.id}_${l.id}`]?.quantidade ?? 0) === 0);
    await selecionarEtapa(page, DIARIO.etapa.nome);
    await page.getByRole('tab', { name: 'Registro de faltas' }).click();
    const campo = page.getByRole('textbox', { name: `Faltas de ${aluno.nome} em ${dataBR(l.data_aula).slice(0, 5)}` });
    await campo.fill('5');
    await expect(campo).toHaveValue(String(l.quantidade));
    await expect.poll(() => enviados.length, { timeout: 10_000 }).toBeGreaterThan(0);
    expect(enviados.at(-1)).toEqual({ matricula_id: aluno.id, lancamento_aula_id: l.id, quantidade: l.quantidade, circuito_etapa_id: DIARIO.etapa.id });
  });

  test('RN-DIA-20: validação do backend da falta', async ({ page }) => {
    await abrirDiario(page);
    const url = `/diarios/${DIARIO.id}/faltas`;
    const vazio = await api(page, 'POST', url, {});
    expect(vazio.status).toBe(422);
    expect(Object.keys(vazio.body.errors).sort()).toEqual(['circuito_etapa_id', 'lancamento_aula_id', 'matricula_id', 'quantidade']);
    // Sem matricula_id → nada é gravado.
    const negativa = await api(page, 'POST', url, { circuito_etapa_id: DIARIO.etapa.id, lancamento_aula_id: DIARIO.lancamentoId, quantidade: -1 });
    expect(negativa.body.errors.quantidade).toEqual(['O campo quantidade deve ser pelo menos 0.']);
  });

  test('RN-DIA-21: (esperado) backend limita as faltas à quantidade de aulas do lançamento', async ({ page }) => {
    test.fail(true, 'DEFEITO DIA-01: 5 faltas numa aula de quantidade 1 passam na validação (só matricula_id ausente é apontado)');
    await abrirDiario(page);
    const r = await api(page, 'POST', `/diarios/${DIARIO.id}/faltas`, { circuito_etapa_id: DIARIO.etapa.id, lancamento_aula_id: DIARIO.lancamentoId, quantidade: 5 });
    expect(r.body.errors.quantidade).toBeDefined();
  });

  test('RN-DIA-21: (esperado) alunos sem nº de chamada aparecem depois dos numerados', async ({ page }) => {
    test.fail(true, 'DEFEITO DIA-09: matrícula sem ordem (nº de chamada) aparece no topo das listas de faltas, notas e boletim');
    await abrirDiario(page);
    const { alunos } = (await api(page, 'GET', `/diarios/${DIARIO.id}/alunos`)).body;
    const ordens = alunos.map((a: any) => a.ordem);
    const primeiroSemOrdem = ordens.indexOf(null);
    expect(primeiroSemOrdem === -1 || ordens.slice(primeiroSemOrdem).every((o: any) => o === null)).toBe(true);
  });
});

test.describe('Diários — registro de notas', () => {
  test('RN-DIA-22: colunas por instrumento (nome e tipo) e "Nota da Etapa"', async ({ page }) => {
    await abrirDiario(page);
    const dados = (await api(page, 'GET', `/diarios/${DIARIO.id}/notas?circuito_etapa_id=${DIARIO.etapa.id}`)).body;
    await selecionarEtapa(page, DIARIO.etapa.nome);
    await page.getByRole('tab', { name: 'Registro de notas/conceitos' }).click();
    for (const i of dados.instrumentos) {
      await expect(page.getByRole('columnheader', { name: `${i.nome} ${i.tipo}` })).toBeVisible({ timeout: 30_000 });
    }
    await expect(page.getByRole('columnheader', { name: 'Nota da Etapa' })).toBeVisible();
    for (const a of dados.alunos) await expect(page.getByRole('cell', { name: a.nome, exact: true })).toBeVisible();
  });

  const entradas = [
    { digitado: '750', valor: 7.5, exibido: '7,50' },
    { digitado: '7,5', valor: 7.5, exibido: '7,50' },
    { digitado: '8', valor: 8, exibido: '8,00' },
    { digitado: '10', valor: 10, exibido: '10,00' },
    { digitado: '650', valor: 6.5, exibido: '6,50' },
  ];
  for (const { digitado, valor, exibido } of entradas) {
    test(`RN-DIA-22: nota digitada "${digitado}" → ${exibido} (máscara pelas casas decimais do circuito)`, async ({ page }) => {
      const enviados: any[] = [];
      // Intercepta a gravação e a exclusão: nada chega ao servidor.
      await page.route(`**/diarios/${DIARIO.id}/notas`, async (route) => {
        const m = route.request().method();
        if (m === 'GET') return route.continue();
        if (m === 'POST') enviados.push(route.request().postDataJSON());
        await route.fulfill({ json: { etapa_nota: valor } });
      });
      await abrirDiario(page);
      const dados = (await api(page, 'GET', `/diarios/${DIARIO.id}/notas?circuito_etapa_id=${DIARIO.etapa.id}`)).body;
      expect(dados.circuito.casas_decimais).toBe(2);
      await selecionarEtapa(page, DIARIO.etapa.nome);
      await page.getByRole('tab', { name: 'Registro de notas/conceitos' }).click();
      const aluno = dados.alunos[1];
      const linha = page.getByRole('row').filter({ has: page.getByRole('cell', { name: aluno.nome, exact: true }) });
      const campo = linha.getByRole('textbox').first();
      await campo.fill(digitado);
      await campo.blur();
      await expect(campo).toHaveValue(exibido);
      await expect.poll(() => enviados.length, { timeout: 10_000 }).toBe(1);
      expect(enviados[0]).toEqual({ matricula_id: aluno.id, circuito_instrumento_id: dados.instrumentos[0].id, circuito_etapa_id: DIARIO.etapa.id, nota: valor });
      // Nota da etapa: verde se ≥ média de aprovação, vermelha abaixo.
      const notaEtapa = linha.getByRole('cell').last();
      await expect(comClasse(notaEtapa, valor >= dados.circuito.media_aprovacao ? 'text-success' : 'text-error')).toHaveCount(1);
    });
  }

  test('RN-DIA-22: (esperado) "Nota da Etapa" usa vírgula decimal, como os campos de nota', async ({ page }) => {
    test.fail(true, 'DEFEITO DIA-10: os campos mostram "7,50", mas a Nota da Etapa mostra "7.50"');
    await page.route(`**/diarios/${DIARIO.id}/notas`, async (route) => {
      if (route.request().method() === 'GET') return route.continue();
      await route.fulfill({ json: { etapa_nota: 7.5 } });
    });
    await abrirDiario(page);
    const dados = (await api(page, 'GET', `/diarios/${DIARIO.id}/notas?circuito_etapa_id=${DIARIO.etapa.id}`)).body;
    await selecionarEtapa(page, DIARIO.etapa.nome);
    await page.getByRole('tab', { name: 'Registro de notas/conceitos' }).click();
    const linha = page.getByRole('row').filter({ has: page.getByRole('cell', { name: dados.alunos[1].nome, exact: true }) });
    await linha.getByRole('textbox').first().fill('750');
    await linha.getByRole('textbox').first().blur();
    await expect(linha.getByRole('cell').last()).toHaveText('7,50');
  });

  test('RN-DIA-22: validação do backend da nota (escala do circuito e instrumento válido)', async ({ page }) => {
    await abrirDiario(page);
    const url = `/diarios/${DIARIO.id}/notas`;
    const { circuito } = (await api(page, 'GET', `${url}?circuito_etapa_id=${DIARIO.etapa.id}`)).body;
    const faixa = `A nota deve estar entre ${circuito.escala_min.toFixed(2)} e ${circuito.escala_max.toFixed(2)}.`;
    const vazio = await api(page, 'POST', url, {});
    expect(Object.keys(vazio.body.errors).sort()).toEqual(['circuito_etapa_id', 'circuito_instrumento_id', 'matricula_id', 'nota']);
    // Sem matricula_id → nada é gravado.
    const base = { circuito_etapa_id: DIARIO.etapa.id, circuito_instrumento_id: 548 };
    expect((await api(page, 'POST', url, { ...base, nota: 50 })).body.errors.nota).toEqual([faixa]);
    expect((await api(page, 'POST', url, { ...base, nota: -1 })).body.errors.nota).toEqual([faixa]);
    expect((await api(page, 'POST', url, { ...base, circuito_instrumento_id: 999999, nota: 5 })).body.errors.circuito_instrumento_id)
      .toEqual(['O campo circuito instrumento id selecionado é inválido.']);
  });
});

test.describe('Diários — agendas', () => {
  test('RN-DIA-23: aba Agendas lista as agendas do diário com resumo por status, busca e filtro', async ({ page }) => {
    await abrirDiario(page, DIARIO.id, '?aba=agendas');
    const dados = (await api(page, 'GET', `/diarios/${DIARIO.id}/agendas`)).body;
    await expect(page.getByRole('button', { name: 'Criar agenda' })).toBeVisible();
    for (const s of dados.status_resumo) await expect(page.getByRole('main')).toContainText(s.label);
    await expect(page.getByRole('textbox', { name: 'Buscar por título, code, data ou criado por' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Status' })).toBeVisible();
    const colunas = ['Code', 'Título', 'Criado por', 'Data', 'Aulas', 'Arquivos', 'Status'];
    for (const c of colunas) await expect(page.getByRole('columnheader', { name: c, exact: true })).toBeVisible();
    if (dados.agendas.total === 0) await expect(page.getByRole('cell', { name: 'Nenhuma agenda cadastrada para este diário' })).toBeVisible();
  });

  test('RN-DIA-23: (esperado) aba Agendas identifica o diário pelo nome, não pelo id', async ({ page }) => {
    test.fail(true, 'DEFEITO DIA-08: a aba mostra "Diário: 60" (id interno)');
    await abrirDiario(page, DIARIO.id, '?aba=agendas');
    await expect(page.getByRole('main')).not.toContainText(rx('Diário:', DIARIO.id));
  });
});
