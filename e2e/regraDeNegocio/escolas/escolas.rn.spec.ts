import { test, expect, type Page } from '@playwright/test';

// Regras de negócio do módulo Escolas (menu lateral → Administração → Escolas).
// Catálogo completo com origem de cada regra: ./REGRAS.md
// Cada teste referencia o identificador RN-ESC-NN do catálogo.

// Homologação oscila bastante no carregamento (> 30s em alguns picos).
test.describe.configure({ timeout: 90_000 });

const RESTRICTED_EMAIL = process.env.RESTRICTED_USER_EMAIL ?? '';
const RESTRICTED_PASSWORD = process.env.RESTRICTED_USER_PASSWORD ?? '';

// Única escola da homologação — nunca é alterada pelos testes.
const ESCOLA = {
  id: 1,
  uuid: '14ea1545-1335-4569-b94d-d8ecd16d3284',
  descricao: 'Colégio Apoio',
  inep: '22135790',
  cep: '64218660',
};

const OBRIGATORIOS = [
  'O nome da franquia é obrigatório.',
  'O CEP é obrigatório.',
  'O logradouro é obrigatório.',
  'O bairro é obrigatório.',
  'A região é obrigatória.',
  'O estado é obrigatório.',
  'O município é obrigatório.',
];

const campo = (page: Page, id: string) => page.locator(`[id="franquias.${id}"]`);
const painelAtivo = (page: Page) => page.locator('.v-window-item--active');
const mensagensDaAba = (page: Page) => painelAtivo(page).locator('.v-messages__message');
const valorSelect = (page: Page, id: string) =>
  page.locator(`.v-field:has([id="franquias.${id}"]) .v-select__selection-text`);

async function abrirLista(page: Page, url = '/franquias'): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText(/Exibindo de \d/)).toBeVisible({ timeout: 30_000 });
}

async function abrirFormulario(page: Page, url = '/franquias/criar'): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('tab', { name: 'Básicas' })).toBeVisible({ timeout: 30_000 });
}

async function aba(page: Page, nome: string): Promise<void> {
  await page.getByRole('tab', { name: nome }).click();
  await expect(page.getByRole('tab', { name: nome })).toHaveAttribute('aria-selected', 'true');
}

async function selecionar(page: Page, id: string, opcao: string): Promise<void> {
  await campo(page, id).click({ force: true });
  await page.getByRole('listbox').getByRole('option', { name: opcao, exact: true }).click();
}

// Preenche o endereço pelo CEP (ViaCEP + /franquias/endereco/resolver).
async function preencherEnderecoPorCep(page: Page, cep = ESCOLA.cep): Promise<void> {
  await aba(page, 'Endereço');
  await campo(page, 'cep').fill(cep);
  await campo(page, 'numero').click();
  await expect(valorSelect(page, 'municipio_codigo')).toHaveText('Parnaíba', { timeout: 30_000 });
}

async function salvar(page: Page): Promise<void> {
  await campo(page, 'btn_salvar').click();
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

// Reescreve as props no HTML da listagem para simular dados sem alterá-los no servidor.
async function simularLista(page: Page, alterar: (props: Record<string, any>) => void): Promise<void> {
  await page.route(/\/franquias(\?.*)?$/, async (route) => {
    if (route.request().resourceType() !== 'document') return route.continue();
    const response = await route.fetch();
    const html = await response.text();
    const body = html.replace(
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

test.describe('Escolas — acesso e navegação', () => {
  test('RN-ESC-01: item "Escolas" do menu leva à listagem /franquias', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.locator('[id="navbar.btn_franquias"]').click();
    await expect(page).toHaveURL(/\/franquias$/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { level: 5 })).toBeVisible();
  });

  test('RN-ESC-02: listagem com título "Franquias", aba "Franquias - <app>" e breadcrumb Dashboard › Franquias › Listar', async ({ page }) => {
    await abrirLista(page);
    await expect(page).toHaveTitle(/^Franquias - /);
    await expect(page.getByRole('heading', { level: 5, name: 'Franquias' })).toBeVisible();
    const breadcrumb = page.getByRole('main').getByRole('list').first();
    await expect(breadcrumb.getByRole('listitem')).toHaveText(['Dashboard', 'Franquias', 'Listar']);
    await expect(breadcrumb.getByRole('link', { name: 'Listar' })).toHaveCount(0);
  });

  test('RN-ESC-03: (esperado) módulo usa a mesma nomenclatura no menu e na tela', async ({ page }) => {
    test.fail(true, 'DEFEITO ESC-09: menu e card do dashboard dizem "Escolas"; tela, breadcrumb, botões e campos dizem "Franquia(s)"');
    await abrirLista(page);
    await expect(page.locator('[id="navbar.btn_franquias"]')).toHaveAccessibleName('Escolas');
    await expect(page.getByRole('heading', { level: 5 })).toHaveText('Escolas');
  });
});

test.describe('Escolas — listagem', () => {
  test('RN-ESC-04: contador "Exibindo de 1 até <to> de <total>" reflete a paginação (15 por página)', async ({ page }) => {
    await abrirLista(page);
    const { franquias } = await inertiaProps(page, '/franquias');
    expect(franquias.per_page).toBe(15);
    await expect(page.getByText(/Exibindo de \d/)).toHaveText(`Exibindo de 1 até ${franquias.to} de ${franquias.total}`);
  });

  test('RN-ESC-04: cada linha exibe #, descrição, INEP, Município/UF e contato', async ({ page }) => {
    await abrirLista(page);
    const linha = page.getByRole('button', { name: `Ver detalhes de ${ESCOLA.descricao}` });
    await expect(linha).toContainText(`# ${ESCOLA.id}`);
    await expect(linha).toContainText(`Descrição da Franquia ${ESCOLA.descricao}`);
    await expect(linha).toContainText(`Código INEP ${ESCOLA.inep}`);
    await expect(linha).toContainText('Município/UF Parnaíba/PI');
    await expect(linha).toContainText('Contato 33238604');
    await expect(linha).toContainText('contato@colegioapoiophb.com.br');
  });

  test('RN-ESC-04: campos ausentes aparecem como "N/A"; contato usa telefone, senão celular', async ({ page }) => {
    await simularLista(page, (props) => {
      const base = props.franquias.data[0];
      props.franquias.data = [
        { ...base, id: 901, uuid: 'x1', descricao: 'Sem dados', codigo_inep: null, uf: null, telefone: null, celular: null, email: null },
        { ...base, id: 902, uuid: 'x2', descricao: 'Só celular', telefone: null, celular: '86999990000', municipio: null },
      ];
    });
    await abrirLista(page);
    const semDados = page.getByRole('button', { name: 'Ver detalhes de Sem dados' });
    await expect(semDados).toContainText('Código INEP N/A');
    await expect(semDados).toContainText('Município/UF N/A');
    await expect(semDados).toContainText(/Contato N\/A/);
    const soCelular = page.getByRole('button', { name: 'Ver detalhes de Só celular' });
    await expect(soCelular).toContainText('Contato 86999990000');
    await expect(soCelular).toContainText('Município/UF N/A');
  });

  test('RN-ESC-05: (esperado) "Carregar mais" só aparece quando há próxima página', async ({ page }) => {
    test.fail(true, 'DEFEITO ESC-07: botão "Carregar mais Franquias" aparece com 1 de 1 registro (next_page_url = null) e só some após o clique');
    await abrirLista(page);
    const { franquias } = await inertiaProps(page, '/franquias');
    expect(franquias.next_page_url).toBeNull();
    await expect(page.getByRole('button', { name: 'Carregar mais franquias' })).toHaveCount(0);
  });

  const buscas = [
    { termo: 'apoio', total: 1, criterio: 'parte do nome, sem diferenciar maiúsculas' },
    { termo: ESCOLA.inep, total: 1, criterio: 'código INEP' },
    { termo: 'Parnaíba', total: 0, criterio: 'município (não é critério de busca)' },
    { termo: 'contato@colegio', total: 0, criterio: 'e-mail (não é critério de busca)' },
  ];
  for (const { termo, total, criterio } of buscas) {
    test(`RN-ESC-06: busca por ${criterio} → ${total} resultado(s)`, async ({ page }) => {
      await abrirLista(page);
      await page.getByRole('searchbox', { name: 'Pesquisar franquias' }).fill(termo);
      await expect(page).toHaveURL(new RegExp(`[?&]search=`), { timeout: 30_000 });
      await expect(page.getByText(/Exibindo de \d/)).toHaveText(`Exibindo de ${total ? 1 : 0} até ${total} de ${total}`, { timeout: 30_000 });
    });
  }

  test('RN-ESC-06: busca sem resultado mostra o estado vazio', async ({ page }) => {
    await abrirLista(page, '/franquias?search=zzzz-inexistente');
    await expect(page.getByText(/Exibindo de \d/)).toHaveText('Exibindo de 0 até 0 de 0');
    await expect(page.getByRole('listitem').filter({ hasText: 'Não existem' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Carregar mais franquias' })).toHaveCount(0);
  });

  test('RN-ESC-06: (esperado) mensagem do estado vazio com concordância correta', async ({ page }) => {
    test.fail(true, 'DEFEITO ESC-08: exibe "Não existem franquias cadastrados" (concordância de gênero)');
    await abrirLista(page, '/franquias?search=zzzz-inexistente');
    await expect(page.getByText('Não existem franquias cadastradas')).toBeVisible();
  });

  test('RN-ESC-07: clicar na linha (ou Enter) abre a edição /franquias/{uuid}', async ({ page }) => {
    await abrirLista(page);
    await page.getByRole('button', { name: `Ver detalhes de ${ESCOLA.descricao}` }).press('Enter');
    await expect(page).toHaveURL(new RegExp(`/franquias/${ESCOLA.uuid}$`), { timeout: 30_000 });
  });

  test('RN-ESC-08: menu de ações tem Editar e Excluir; Excluir exige digitar o UUID exato', async ({ page }) => {
    await abrirLista(page);
    await page.locator(`[id="franquias.btn_acoes-${ESCOLA.id}"]`).click();
    await expect(page.locator(`[id="franquias.btn_edit-${ESCOLA.id}"]`)).toHaveText('Editar');
    await page.locator(`[id="franquias.btn_delete-${ESCOLA.id}"]`).click();

    const modal = page.getByRole('dialog');
    await expect(modal.getByText(ESCOLA.uuid, { exact: true })).toBeVisible();
    const excluir = modal.getByRole('button', { name: 'Excluir' });
    await expect(excluir).toBeDisabled();
    await modal.getByRole('textbox', { name: 'Digite o código de confirmação' }).fill(ESCOLA.uuid.slice(0, -1));
    await expect(excluir).toBeDisabled();
    await modal.getByRole('textbox', { name: 'Digite o código de confirmação' }).fill(ESCOLA.uuid);
    await expect(excluir).toBeEnabled();

    // Nunca exclui a escola real: cancela.
    await modal.getByRole('button', { name: 'Cancelar' }).click();
    await expect(modal).toBeHidden();
  });

  test('RN-ESC-08: (esperado) modal de exclusão fala de franquia/escola', async ({ page }) => {
    test.fail(true, 'DEFEITO ESC-06: ModalConfirmation compartilhado exibe "Tem certeza que deseja apagar este cargo?"');
    await abrirLista(page);
    await page.locator(`[id="franquias.btn_acoes-${ESCOLA.id}"]`).click();
    await page.locator(`[id="franquias.btn_delete-${ESCOLA.id}"]`).click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal).not.toContainText('cargo');
  });
});

test.describe('Escolas — formulário', () => {
  test('RN-ESC-09: formulário com 6 abas, breadcrumb e botões Cancelar/Salvar (criação) ou Atualizar (edição)', async ({ page }) => {
    await abrirFormulario(page);
    await expect(page.getByRole('tab')).toHaveText(['Básicas', 'Endereço', 'Contato', 'Infraestrutura', 'Jurídico', 'Vínculo']);
    await expect(page.getByRole('main').getByRole('list').first().getByRole('listitem')).toHaveText(['Dashboard', 'Adm. Escolar', 'Franquias']);
    await expect(campo(page, 'btn_salvar')).toHaveText('Salvar');
    await campo(page, 'btn_cancelar').click();
    await expect(page).toHaveURL(/\/franquias$/, { timeout: 30_000 });

    await abrirFormulario(page, `/franquias/${ESCOLA.uuid}`);
    await expect(campo(page, 'descricao')).toHaveValue(ESCOLA.descricao);
    await expect(campo(page, 'btn_salvar')).toHaveText('Atualizar');
    await page.getByRole('button', { name: 'Voltar para lista de franquias' }).click();
    await expect(page).toHaveURL(/\/franquias$/, { timeout: 30_000 });
  });

  test('RN-ESC-10: envio vazio → 7 obrigatórios, toast com a contagem e volta para a 1ª aba com erro', async ({ page }) => {
    await abrirFormulario(page);
    await aba(page, 'Vínculo');
    await salvar(page);
    await expect(page.getByText('Por favor, corrija 7 campos com erro antes de salvar.')).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(/\/franquias\/criar$/);
    await expect(page.getByRole('tab', { name: 'Básicas' })).toHaveAttribute('aria-selected', 'true');
    await expect(mensagensDaAba(page)).toContainText([OBRIGATORIOS[0]]);
    await aba(page, 'Endereço');
    await expect(mensagensDaAba(page)).toHaveText(OBRIGATORIOS.slice(1));
  });

  test('RN-ESC-10: com um único erro, o toast mostra a própria mensagem', async ({ page }) => {
    await abrirFormulario(page);
    await preencherEnderecoPorCep(page);
    await salvar(page);
    await expect(page.getByRole('alert').filter({ hasText: OBRIGATORIOS[0] }).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Por favor, corrija/)).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'Básicas' })).toHaveAttribute('aria-selected', 'true');
  });

  test('RN-ESC-11: backend valida DDD (2), e-mail, quantidade ≥ 0 e CNPJ (14)', async ({ page }) => {
    await abrirFormulario(page);
    await aba(page, 'Contato');
    await campo(page, 'ddd').fill('1');
    await campo(page, 'email').fill('email-invalido');
    await aba(page, 'Infraestrutura');
    await page.getByRole('checkbox', { name: 'A escola possui equipamentos?' }).check();
    await campo(page, 'equip_quantidade_computadores').fill('-5');
    await aba(page, 'Jurídico');
    await campo(page, 'cnpj_mantenedora').fill('123');
    await salvar(page);

    await expect(page.getByText('Por favor, corrija 11 campos com erro antes de salvar.')).toBeVisible({ timeout: 30_000 });
    await aba(page, 'Contato');
    await expect(mensagensDaAba(page)).toContainText(['O campo ddd deve ser 2 caracteres.', 'O e-mail informado não é válido.']);
    await aba(page, 'Infraestrutura');
    await expect(mensagensDaAba(page)).toContainText(['O campo equip quantidade computadores deve ser pelo menos 0.']);
    await aba(page, 'Jurídico');
    await expect(mensagensDaAba(page)).toContainText(['O campo cnpj mantenedora deve ser 14 caracteres.']);
  });

  test('RN-ESC-11: (esperado) mensagens de validação usam o rótulo do campo, não o nome técnico', async ({ page }) => {
    test.fail(true, 'DEFEITO ESC-04: mensagens como "O campo ddd…", "O campo equip quantidade computadores…", "O campo cnpj mantenedora…"');
    await abrirFormulario(page);
    await aba(page, 'Contato');
    await campo(page, 'ddd').fill('1');
    await salvar(page);
    await expect(page.getByText(/Por favor, corrija/)).toBeVisible({ timeout: 30_000 });
    await aba(page, 'Contato');
    await expect(mensagensDaAba(page)).toContainText(['O DDD deve ter 2 dígitos.']);
  });

  test('RN-ESC-12: máscara do INEP aceita só dígitos (máx. 8)', async ({ page }) => {
    await abrirFormulario(page);
    await campo(page, 'codigo_inep').pressSequentially('12ab345678901');
    await expect(campo(page, 'codigo_inep')).toHaveValue('12345678');
  });

  test('RN-ESC-12: (esperado) INEP com menos de 8 dígitos é rejeitado', async ({ page }) => {
    test.fail(true, 'DEFEITO ESC-02: backend aceita INEP "12" sem erro (só 7 obrigatórios são apontados)');
    await abrirFormulario(page);
    await campo(page, 'codigo_inep').fill('12');
    await salvar(page);
    await expect(page.getByText(/Por favor, corrija/)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Por favor, corrija 8 campos com erro antes de salvar.')).toBeVisible();
  });

  test('RN-ESC-13: (esperado) telefone aceita só 8 ou 9 dígitos e código da escola sede só 8 dígitos', async ({ page }) => {
    test.fail(true, 'DEFEITO ESC-03: backend aceita telefone "abcdefgh" e código da escola sede "12" sem erro');
    await abrirFormulario(page);
    await aba(page, 'Contato');
    await campo(page, 'telefone').fill('abcdefgh');
    await aba(page, 'Vínculo');
    await selecionar(page, 'unidade_vinculada', 'Unidade vinculada a escola de educação básica');
    await campo(page, 'codigo_escola_sede').fill('12');
    await salvar(page);
    await expect(page.getByText(/Por favor, corrija/)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Por favor, corrija 9 campos com erro antes de salvar.')).toBeVisible();
  });

  test('RN-ESC-14: (esperado) um CNPJ válido pode ser digitado e salvo', async ({ page }) => {
    test.fail(true, 'DEFEITO ESC-01: máscara "##.###.###/####-##" (18 caracteres) + maxlength="14" trunca a digitação; colado, o backend rejeita por exigir 14 caracteres');
    await abrirFormulario(page);
    await aba(page, 'Jurídico');
    await campo(page, 'cnpj_mantenedora').pressSequentially('11222333000181');
    await expect(campo(page, 'cnpj_mantenedora')).toHaveValue('11.222.333/0001-81');
  });

  test('RN-ESC-14: CNPJ colado com máscara completa é rejeitado pelo backend (comportamento atual)', async ({ page }) => {
    await abrirFormulario(page);
    await aba(page, 'Jurídico');
    await campo(page, 'cnpj_mantenedora').fill('11222333000181');
    await expect(campo(page, 'cnpj_mantenedora')).toHaveValue('11.222.333/0001-81');
    await salvar(page);
    await expect(page.getByText('Por favor, corrija 8 campos com erro antes de salvar.')).toBeVisible({ timeout: 30_000 });
    await aba(page, 'Jurídico');
    await expect(mensagensDaAba(page)).toContainText(['O campo cnpj mantenedora deve ser 14 caracteres.']);
  });

  test('RN-ESC-15: código INEP é único', async ({ page }) => {
    await abrirFormulario(page);
    await campo(page, 'codigo_inep').fill(ESCOLA.inep);
    await salvar(page);
    await expect(page.getByText(/Por favor, corrija/)).toBeVisible({ timeout: 30_000 });
    await expect(mensagensDaAba(page)).toContainText(['Já existe uma franquia cadastrada com este código INEP.']);
  });

  test('RN-ESC-16: CEP com máscara; ao sair do campo preenche logradouro, bairro, região, estado e município', async ({ page }) => {
    await abrirFormulario(page);
    await preencherEnderecoPorCep(page);
    await expect(campo(page, 'cep')).toHaveValue('64.218-660');
    await expect(campo(page, 'logradouro')).toHaveValue('Avenida Senador Furtado');
    await expect(campo(page, 'bairro')).toHaveValue('Nova Parnaíba');
    await expect(valorSelect(page, 'regiao_id')).toHaveText('Nordeste');
    await expect(valorSelect(page, 'estado_codigo_ibge')).toHaveText('Piauí (PI)');
  });

  test('RN-ESC-16: (esperado) CEP inexistente informa "CEP não encontrado"', async ({ page }) => {
    test.fail(true, 'DEFEITO ESC-05: useCep define o erro "CEP não encontrado", mas o formulário nunca o exibe');
    await abrirFormulario(page);
    await aba(page, 'Endereço');
    await campo(page, 'cep').fill('00000000');
    await campo(page, 'numero').click();
    await expect(page.getByText('CEP não encontrado')).toBeVisible({ timeout: 15_000 });
  });

  test('RN-ESC-17: cascata Região › Estado › Município › Distrito', async ({ page }) => {
    await abrirFormulario(page);
    await aba(page, 'Endereço');
    await expect(campo(page, 'municipio_codigo')).toBeDisabled();
    await expect(campo(page, 'distrito_codigo')).toBeDisabled();

    await preencherEnderecoPorCep(page);
    await expect(campo(page, 'distrito_codigo')).toBeEnabled();

    // Trocar a região limpa estado, município e distrito.
    await selecionar(page, 'regiao_id', 'Sul');
    await expect(valorSelect(page, 'estado_codigo_ibge')).toHaveCount(0);
    await expect(valorSelect(page, 'municipio_codigo')).toHaveCount(0);
    await expect(campo(page, 'municipio_codigo')).toBeDisabled();
  });

  test('RN-ESC-18: interruptores da Infraestrutura revelam os detalhes', async ({ page }) => {
    await abrirFormulario(page);
    await aba(page, 'Infraestrutura');
    await expect(campo(page, 'equip_quantidade_computadores')).toHaveCount(0);

    await page.getByRole('checkbox', { name: 'A escola possui equipamentos?' }).check();
    for (const item of ['Impressora', 'Copiadora', 'Retroprojetor', 'Televisão', 'DVD / Blu-ray', 'Antena parabólica', 'Lousa digital', 'Projetor multimídia (Datashow)']) {
      await expect(page.getByRole('checkbox', { name: item, exact: true })).toBeVisible();
    }
    await expect(page.getByRole('spinbutton', { name: 'Qtd. Computadores' })).toHaveAttribute('min', '0');
    await expect(page.getByRole('spinbutton', { name: 'Qtd. Tablets' })).toHaveAttribute('min', '0');

    await page.getByRole('checkbox', { name: 'A escola possui recursos de acessibilidade?' }).check();
    await expect(page.getByRole('checkbox', { name: 'Nenhuma das opções' })).toBeVisible();

    await page.getByRole('checkbox', { name: 'A escola possui acesso à internet?' }).check();
    await expect(campo(page, 'tipo_internet')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Uso administrativo' })).toBeVisible();
  });

  const vinculos = [
    { opcao: 'Sem vínculo com outra instituição', campos: [] as { id: string; max: string }[] },
    { opcao: 'Unidade vinculada a escola de educação básica', campos: [{ id: 'codigo_escola_sede', max: '8' }, { id: 'codigo_orgao_regional', max: '5' }] },
    { opcao: 'Unidade ofertante de educação superior', campos: [{ id: 'codigo_ies', max: '9' }, { id: 'codigo_orgao_regional', max: '5' }] },
  ];
  for (const { opcao, campos } of vinculos) {
    test(`RN-ESC-19: Vínculo "${opcao}" exibe ${campos.map((c) => c.id).join(' + ') || 'nenhum código'}`, async ({ page }) => {
      await abrirFormulario(page);
      await aba(page, 'Vínculo');
      await selecionar(page, 'unidade_vinculada', opcao);
      for (const id of ['codigo_escola_sede', 'codigo_ies', 'codigo_orgao_regional']) {
        const esperado = campos.find((c) => c.id === id);
        if (esperado) await expect(campo(page, id)).toHaveAttribute('maxlength', esperado.max);
        else await expect(campo(page, id)).toHaveCount(0);
      }
    });
  }

  test('RN-ESC-20: logomarca rejeita formato não suportado e arquivo acima de 2MB', async ({ page }) => {
    await abrirFormulario(page);
    const input = campo(page, 'logomarca');
    await expect(input).toHaveAttribute('accept', 'image/png, image/jpeg, image/jpg, image/webp');

    await input.setInputFiles({ name: 'logo.gif', mimeType: 'image/gif', buffer: Buffer.from('GIF89a') });
    await expect(page.getByRole('alert').filter({ hasText: 'Formato não suportado. Use PNG, JPG, JPEG, WEBP' }).first()).toBeVisible();

    await input.setInputFiles({ name: 'grande.png', mimeType: 'image/png', buffer: Buffer.alloc(2 * 1024 * 1024 + 1) });
    await expect(page.getByRole('alert').filter({ hasText: 'A imagem deve ter no máximo 2MB' }).first()).toBeVisible();
  });

  test('RN-ESC-21: aba Jurídico mostra órgão vinculado e mantenedora independentemente da dependência administrativa', async ({ page }) => {
    await abrirFormulario(page);
    await selecionar(page, 'dependencia_administrativa', 'Privada');
    await aba(page, 'Jurídico');
    await expect(page.getByRole('checkbox', { name: 'Secretaria de Educação / Ministério da Educação' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Empresa, grupos empresariais do setor privado ou pessoa física' })).toBeVisible();
  });
});

test.describe('RN-ESC-22: ciclo criar › editar › excluir (escola QA- descartável)', () => {
  const PREFIXO = 'QA-Escola RN';
  const NOME = `${PREFIXO} ${Date.now()}`;

  // Limpeza em contexto próprio: roda mesmo se o teste estourar o timeout.
  test.afterAll(async ({ browser }, testInfo) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/user.json', baseURL: testInfo.project.use.baseURL });
    const page = await context.newPage();
    await page.goto('/franquias', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    const sobras = (await inertiaProps(page, `/franquias?search=${encodeURIComponent(PREFIXO)}`)).franquias.data
      .filter((f: { descricao: string }) => f.descricao.startsWith(PREFIXO));
    for (const { uuid } of sobras) {
      await page.evaluate(async (u) => {
        const token = decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '');
        await fetch(`/franquias/${u}`, { method: 'DELETE', headers: { 'X-XSRF-TOKEN': token, 'X-Requested-With': 'XMLHttpRequest' } });
      }, uuid);
    }
    await context.close();
  });

  test('cria, edita e exclui uma escola de teste', async ({ page }) => {
    test.setTimeout(300_000);

    await abrirFormulario(page);
    await campo(page, 'descricao').fill(NOME);
    await preencherEnderecoPorCep(page);
    await salvar(page);
    await expect(page).toHaveURL(/\/franquias$/, { timeout: 60_000 });
    await expect(page.getByText('Franquia criada com sucesso!')).toBeVisible();

    const criada = (await inertiaProps(page, `/franquias?search=${encodeURIComponent(NOME)}`)).franquias.data[0];
    expect(criada.descricao).toBe(NOME);
    expect(criada.municipio).toBe('Parnaíba');
    expect(criada.senha_expiracao_meses, 'padrão de expiração de senha da escola').toBe(6);

    await abrirFormulario(page, `/franquias/${criada.uuid}`);
    await campo(page, 'descricao').fill(`${NOME} editada`);
    await salvar(page);
    await expect(page).toHaveURL(/\/franquias$/, { timeout: 60_000 });
    const editada = (await inertiaProps(page, `/franquias?search=${encodeURIComponent(NOME)}`)).franquias.data[0];
    expect(editada.descricao).toBe(`${NOME} editada`);

    await abrirLista(page, `/franquias?search=${encodeURIComponent(NOME)}`);
    await page.locator(`[id="franquias.btn_acoes-${criada.id}"]`).click();
    await page.locator(`[id="franquias.btn_delete-${criada.id}"]`).click();
    await page.getByRole('dialog').getByRole('textbox').fill(criada.uuid);
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir' }).click();
    await expect.poll(async () => (await inertiaProps(page, `/franquias?search=${encodeURIComponent(NOME)}`)).franquias.total, { timeout: 60_000 }).toBe(0);
    expect(await page.evaluate(async (u) => (await fetch(`/franquias/${u}`, { redirect: 'manual' })).status, criada.uuid)).toBe(404);
  });
});

test.describe('Escolas — usuário restrito (Professor)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('RN-ESC-01: sem franquias.list, o menu não mostra "Escolas" e as rotas do módulo respondem 403', async ({ page }) => {
    await loginRestrito(page);
    await expect(page.locator('[id="navbar.btn_franquias"]')).toHaveCount(0);
    for (const url of ['/franquias', '/franquias/criar', `/franquias/${ESCOLA.uuid}`]) {
      const status = await page.evaluate(async (u) => (await fetch(u, { redirect: 'manual' })).status, url);
      expect(status, url).toBe(403);
    }
    await page.goto('/franquias', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Você não tem permissão para acessar esta página.')).toBeVisible({ timeout: 30_000 });
  });
});
