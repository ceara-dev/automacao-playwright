import { test, expect, type Page } from '@playwright/test';

// Regras de negócio do módulo Dashboard (menu lateral → Início → Dashboard).
// Catálogo completo com origem de cada regra: ./REGRAS.md
// Cada teste referencia o identificador RN-DASH-NN do catálogo.

// Homologação oscila bastante no carregamento (> 30s em alguns picos).
test.describe.configure({ timeout: 90_000 });

const RESTRICTED_EMAIL = process.env.RESTRICTED_USER_EMAIL ?? '';
const RESTRICTED_PASSWORD = process.env.RESTRICTED_USER_PASSWORD ?? '';

type Senha = { primeiro_acesso: boolean; expirada: boolean; dias_restantes: number; deve_trocar: boolean };

const MODULOS = [
  { titulo: 'Alunos', rota: '/alunos', testId: 'dashboard.card-alunos', rotulo: 'aluno(s) cadastrado(s)', prop: 'alunos',
    descricao: 'Gerencie matrículas, dados pessoais e acompanhamento dos estudantes.' },
  { titulo: 'Escolas', rota: '/franquias', testId: 'dashboard.card-franquias', rotulo: 'escola(s) cadastrada(s)', prop: 'franquias',
    descricao: 'Administre as unidades escolares, dados do Censo e logomarcas.' },
  { titulo: 'Usuários', rota: '/usuarios', testId: 'dashboard.card-usuarios', rotulo: 'usuário(s) ativo(s)', prop: 'usuarios',
    descricao: 'Controle quem acessa o sistema, cargos e permissões.' },
  { titulo: 'Turmas', rota: '/turmas', testId: 'dashboard.card-turmas', rotulo: 'turma(s) cadastrada(s)', prop: 'turmas',
    descricao: 'Organize as turmas por etapa de ensino, horários e dias da semana.' },
  { titulo: 'Matrículas', rota: '/matriculas', testId: 'dashboard.card-matriculas', rotulo: 'matrícula(s) ativa(s)', prop: 'matriculas',
    descricao: 'Vincule alunos às turmas e gerencie transporte escolar e AEE.' },
  { titulo: 'Profissionais', rota: '/profissionais', testId: 'dashboard.card-profissionais', rotulo: 'profissional(is) cadastrado(s)', prop: 'profissionais',
    descricao: 'Cadastre gestores e professores com dados do Censo Escolar.' },
];

const ACESSO_RAPIDO = [
  { titulo: 'Cargos', descricao: 'Perfis de acesso', rota: '/cargos' },
  { titulo: 'Permissões', descricao: 'Autorizações do sistema', rota: '/permissoes' },
];

async function abrirDashboard(page: Page): Promise<void> {
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });
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

// Sobrescreve a prop `senha` no HTML do /dashboard para simular estados de expiração
// sem alterar dados do usuário no servidor.
async function simularSenha(page: Page, senha: Partial<Senha>): Promise<void> {
  await page.route('**/dashboard', async (route) => {
    if (route.request().resourceType() !== 'document') return route.continue();
    const response = await route.fetch();
    const html = await response.text();
    const body = html.replace(
      /(<script[^>]*data-page="app"[^>]*>)([\s\S]*?)(<\/script>)/,
      (_, abre: string, json: string, fecha: string) => {
        const data = JSON.parse(json);
        data.props.senha = { ...data.props.senha, ...senha };
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

test.describe('RN-DASH-01: acesso exige autenticação', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('visitante sem sessão é redirecionado para /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: 'Entrar no sistema' })).toBeVisible();
  });
});

test.describe('Dashboard — Super Administrador', () => {
  test('RN-DASH-02: item "Dashboard" é o primeiro do menu, na seção Início, e fica selecionado', async ({ page }) => {
    await abrirDashboard(page);
    const item = page.locator('[id="navbar.btn_dashboard"]');
    await expect(item).toHaveAccessibleName('Dashboard');
    await expect(item).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('navigation').getByRole('option').first()).toHaveAccessibleName('Dashboard');
  });

  test('RN-DASH-02: clicar em "Dashboard" no menu retorna à rota /dashboard', async ({ page }) => {
    await page.goto('/relatorios');
    await page.getByRole('option', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('RN-DASH-03: título da aba é "Início - <nome da aplicação>"', async ({ page }) => {
    await abrirDashboard(page);
    await expect(page).toHaveTitle(/^Início - /);
  });

  test('RN-DASH-04: breadcrumb "Dashboard" (link) › "Início" (desabilitado)', async ({ page }) => {
    await abrirDashboard(page);
    const breadcrumb = page.getByRole('main').getByRole('list').first();
    await expect(breadcrumb.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', /\/dashboard$/);
    await expect(breadcrumb.getByRole('listitem').last()).toHaveText('Início');
    await expect(breadcrumb.getByRole('link', { name: 'Início' })).toHaveCount(0);
  });

  const saudacoes = [
    { hora: '00:00', esperado: 'Bom dia' },
    { hora: '11:59', esperado: 'Bom dia' },
    { hora: '12:00', esperado: 'Boa tarde' },
    { hora: '17:59', esperado: 'Boa tarde' },
    { hora: '18:00', esperado: 'Boa noite' },
    { hora: '23:59', esperado: 'Boa noite' },
  ];
  for (const { hora, esperado } of saudacoes) {
    test(`RN-DASH-05: às ${hora} (hora local) a saudação é "${esperado}"`, async ({ page }) => {
      await page.clock.setFixedTime(new Date(`2026-09-30T${hora}:00`));
      await abrirDashboard(page);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(new RegExp(`^${esperado}, `));
    });
  }

  test('RN-DASH-06/07: saudação usa o primeiro nome; subtítulo é "<tenant> · <cargo>"', async ({ page }) => {
    await abrirDashboard(page);
    const props = await inertiaProps(page, '/dashboard');
    const primeiroNome = String(props.user.name).split(' ')[0];
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(new RegExp(`, ${primeiroNome}$`));
    await expect(page.getByText(`${props.tenant.name} · ${props.role.label}`)).toBeVisible();
    expect(props.role.label).toBe('Super Administrador');
  });

  test('RN-DASH-09: exibe os 6 módulos principais na ordem, com descrição, contador e destino', async ({ page }) => {
    await abrirDashboard(page);
    const cards = page.getByRole('region', { name: 'Módulos principais' }).getByRole('link');
    await expect(cards).toHaveCount(MODULOS.length);

    for (const [i, modulo] of MODULOS.entries()) {
      const card = cards.nth(i);
      await expect(card).toHaveAttribute('data-testid', modulo.testId);
      await expect(card).toHaveAttribute('href', new RegExp(`${modulo.rota}$`));
      await expect(card.getByRole('heading', { level: 3 })).toHaveText(modulo.titulo);
      await expect(card).toContainText(modulo.descricao);
      await expect(card).toContainText(new RegExp(`\\d+ ${modulo.rotulo.replace(/[()]/g, '\\$&')}`));
    }
  });

  test('RN-DASH-10: contador de cada card é igual ao total da respectiva listagem', async ({ page }) => {
    await abrirDashboard(page);
    for (const modulo of MODULOS) {
      const props = await inertiaProps(page, modulo.rota);
      const total = props[modulo.prop].total as number;
      await expect(page.getByTestId(modulo.testId), `card ${modulo.titulo}`).toContainText(`${total} ${modulo.rotulo}`);
    }
  });

  test('RN-DASH-11: seção "Acesso rápido" contém Cargos e Permissões', async ({ page }) => {
    await abrirDashboard(page);
    const links = page.getByRole('region', { name: 'Acesso rápido' }).getByRole('link');
    await expect(links).toHaveCount(ACESSO_RAPIDO.length);
    for (const [i, atalho] of ACESSO_RAPIDO.entries()) {
      await expect(links.nth(i)).toHaveAccessibleName(`${atalho.titulo} ${atalho.descricao}`);
      await expect(links.nth(i)).toHaveAttribute('href', new RegExp(`${atalho.rota}$`));
    }
  });

  test('RN-DASH-12: clicar em um card navega para o módulo', async ({ page }) => {
    await abrirDashboard(page);
    await page.getByTestId('dashboard.card-turmas').click();
    await expect(page).toHaveURL(/\/turmas$/, { timeout: 30_000 });
  });

  test('RN-DASH-13: botão de ano letivo exibe o ano vinculado ao usuário', async ({ page }) => {
    await abrirDashboard(page);
    const props = await inertiaProps(page, '/dashboard');
    const ano = props.anos.find((a: { id: number }) => a.id === props.auth.user.ano_id);
    const botao = page.locator('[id="navbar.btn_ano_letivo"]');
    await expect(botao).toHaveAccessibleName(`Ano letivo: ${ano.descricao}. Clique para alterar.`);
    await expect(botao).toHaveText(ano.descricao);
  });

  test('RN-DASH-13: troca de ano letivo exibe confirmação e retorna ao dashboard', async () => {
    test.skip(true, 'Sem dados de teste: homologação possui apenas o ano letivo 2026');
  });
});

test.describe('RN-DASH-08: alerta de expiração de senha', () => {
  const alerta = (page: Page) => page.getByRole('alert').filter({ hasText: /Sua senha/ });

  const exibe = [
    { caso: 'faltando 15 dias', senha: { dias_restantes: 15 }, texto: 'Sua senha expira em 15 dias. Altere-a para não perder o acesso.' },
    { caso: 'faltando 1 dia (singular)', senha: { dias_restantes: 1 }, texto: 'Sua senha expira em 1 dia. Altere-a para não perder o acesso.' },
    { caso: 'senha expirada', senha: { expirada: true, dias_restantes: 0 }, texto: 'Sua senha expirou. Altere-a para continuar utilizando o sistema.' },
  ];
  for (const { caso, senha, texto } of exibe) {
    test(`exibe o alerta ${caso}`, async ({ page }) => {
      await simularSenha(page, senha);
      await abrirDashboard(page);
      await expect(alerta(page)).toContainText(texto);
      await expect(alerta(page).getByRole('link', { name: 'Alterar agora' })).toHaveAttribute('href', /\/password\/change$/);
    });
  }

  const oculta = [
    { caso: 'faltando 16 dias', senha: { dias_restantes: 16 } },
    { caso: 'com 0 dias sem estar expirada', senha: { dias_restantes: 0, expirada: false } },
    { caso: 'no primeiro acesso, mesmo expirada', senha: { primeiro_acesso: true, expirada: true } },
  ];
  for (const { caso, senha } of oculta) {
    test(`não exibe o alerta ${caso}`, async ({ page }) => {
      await simularSenha(page, senha);
      await abrirDashboard(page);
      await expect(page.getByRole('region', { name: 'Módulos principais' })).toBeVisible();
      await expect(alerta(page)).toHaveCount(0);
    });
  }

  test('o alerta pode ser fechado', async ({ page }) => {
    await simularSenha(page, { dias_restantes: 5 });
    await abrirDashboard(page);
    await expect(alerta(page)).toBeVisible();
    await alerta(page).getByRole('button', { name: /close|fechar/i }).click();
    await expect(alerta(page)).toHaveCount(0);
  });
});

test.describe('Dashboard — usuário restrito (Professor)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('RN-DASH-06/07: saudação com primeiro nome e subtítulo com o cargo Professor', async ({ page }) => {
    await loginRestrito(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/, QA$/);
    await expect(page.getByText('Apoio · Professor')).toBeVisible();
  });

  test('RN-DASH-02: menu lateral mostra só os itens permitidos, mas sempre o Dashboard', async ({ page }) => {
    await loginRestrito(page);
    const menu = page.getByRole('navigation').getByRole('option');
    await expect(menu).toHaveText(['Dashboard', 'Diários', 'Presença Notifiq', 'Relatórios']);
  });

  test('RN-DASH-14: cards e atalhos só são exibidos quando o usuário pode acessar o destino', async ({ page }) => {
    test.fail(true, 'DEFEITO DASH-01: Professor vê os 6 cards e os 2 atalhos; 7 dos 8 destinos respondem HTTP 403');

    await loginRestrito(page);
    const links = page.getByRole('region', { name: /Módulos principais|Acesso rápido/ }).getByRole('link');
    await expect(links).not.toHaveCount(0);
    const hrefs = await links.evaluateAll((els) => els.map((el) => (el as HTMLAnchorElement).href));

    const negados: string[] = [];
    for (const href of hrefs) {
      const status = await page.evaluate(async (u) => (await fetch(u, { redirect: 'manual' })).status, href);
      if (status === 403) negados.push(href);
    }
    expect(negados, 'links do dashboard que levam a 403').toEqual([]);
  });

  test('RN-DASH-15: contadores não expõem totais de módulos sem permissão', async ({ page }) => {
    test.fail(true, 'DEFEITO DASH-02: Professor recebe os totais globais (usuários, profissionais, matrículas...) na prop counts');

    await loginRestrito(page);
    const props = await inertiaProps(page, '/dashboard');
    const permissoes: string[] = props.auth.permissions;
    const expostos = MODULOS
      .filter((m) => !permissoes.includes(`${m.prop}.list`))
      .filter((m) => props.counts[m.prop] !== undefined)
      .map((m) => m.prop);
    expect(expostos, 'contadores de módulos sem permissão .list').toEqual([]);
  });
});
