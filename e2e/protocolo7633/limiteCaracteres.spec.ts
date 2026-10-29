import { test, expect } from '@playwright/test';
import {
  LIMITE, MSG, CAMPO, PREFIXO_QA, emailComTamanho, textoComTamanho, gerarCpf, contextoAnonimo, contador,
  removerLimiteDaTela, login, preencherProfissional, salvarProfissional, mensagemDoCampo, idDoProfissional, excluirProfissionaisQA,
} from './limites';

// Protocolo #7633 — [SAAS] Aumentar limite de caracteres dos campos de e-mail (50 caracteres).
// Cenário 1: e-mail ("Login de acesso") da tela de login. Cenário 2: e-mail do profissional, com o mesmo limite do login.
// Complemento (combinado com o desenvolvedor): contador + limite de 50 em Nome, E-mail, Filiação 1 e Filiação 2 do Professor/Gestor.
// Os testes que cadastram criam profissionais "QA-7633 …" (excluídos no afterAll); o usuário de login gerado permanece.

test.use({ viewport: { width: 1440, height: 900 } });

test.describe('Protocolo 7633 — Cenário 1: login de acesso com até 50 caracteres', () => {
  test('CT-01: o campo "Login de acesso" tem limite de 50 caracteres', async ({ browser }) => {
    const { context, page } = await contextoAnonimo(browser);
    try {
      await page.goto('/login');
      await expect(page.locator(CAMPO.login)).toHaveAttribute('maxlength', String(LIMITE));
    } finally {
      await context.close();
    }
  });

  test('CT-02: aceita qualquer quantidade de caracteres dentro do limite', async ({ browser }) => {
    const { context, page } = await contextoAnonimo(browser);
    try {
      await page.goto('/login');
      const campo = page.locator(CAMPO.login);
      for (const tamanho of [1, 30, 31, LIMITE]) {
        const valor = emailComTamanho(Math.max(tamanho, 8)).slice(-tamanho);
        await campo.fill('');
        await campo.pressSequentially(valor);
        await expect(campo, `${tamanho} caracteres`).toHaveValue(valor);
      }
    } finally {
      await context.close();
    }
  });

  test('CT-03: não permite digitar além de 50 caracteres', async ({ browser }) => {
    const { context, page } = await contextoAnonimo(browser);
    try {
      await page.goto('/login');
      const campo = page.locator(CAMPO.login);
      const digitado = emailComTamanho(LIMITE + 5);
      await campo.pressSequentially(digitado);
      await expect(campo).toHaveValue(digitado.slice(0, LIMITE));
    } finally {
      await context.close();
    }
  });

  test('CT-04: o servidor recusa login com mais de 50 caracteres mesmo sem o limite da tela', async ({ browser }) => {
    const { context, page } = await contextoAnonimo(browser);
    try {
      await page.goto('/login');
      const campo = page.locator(CAMPO.login);
      await removerLimiteDaTela(campo);
      await campo.fill(emailComTamanho(LIMITE + 1));
      await page.getByRole('textbox', { name: 'Senha' }).fill('Qualquer@123');
      await page.getByRole('button', { name: 'Entrar no sistema' }).click();
      await expect(page.getByText(MSG.loginMax).first()).toBeVisible();
      await expect(page).toHaveURL(/\/login/);
    } finally {
      await context.close();
    }
  });

  test('CT-05: emoji colado no login é descartado', async ({ browser }) => {
    const { context, page } = await contextoAnonimo(browser);
    try {
      await page.goto('/login');
      const campo = page.locator(CAMPO.login);
      await campo.fill('jo😀o@qa.com');
      await expect(campo).toHaveValue('joo@qa.com');
    } finally {
      await context.close();
    }
  });
});

test.describe('Protocolo 7633 — Cenário 2: e-mail do profissional com até 50 caracteres', () => {
  test.describe.configure({ mode: 'serial' });

  const cpf = gerarCpf();
  const nome = `${PREFIXO_QA} Professor Limite ${Date.now() % 100000}`;
  const email = emailComTamanho(LIMITE);

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/user.json' });
    try {
      await excluirProfissionaisQA(await context.newPage());
    } finally {
      await context.close();
    }
  });

  test('CT-06: no cadastro, o E-mail tem limite de 50 e não aceita digitar além', async ({ page }) => {
    await page.goto('/profissionais/criar');
    const campo = page.locator(CAMPO.profissional('email'));
    await expect(campo).toHaveAttribute('maxlength', String(LIMITE));
    const digitado = emailComTamanho(LIMITE + 5);
    await campo.pressSequentially(digitado);
    await expect(campo).toHaveValue(digitado.slice(0, LIMITE));
  });

  test('CT-07: o limite do E-mail do profissional é o mesmo do login', async ({ page, browser }) => {
    await page.goto('/profissionais/criar');
    const doProfissional = await page.locator(CAMPO.profissional('email')).getAttribute('maxlength');
    const { context, page: telaLogin } = await contextoAnonimo(browser);
    try {
      await telaLogin.goto('/login');
      expect(doProfissional).toBe(await telaLogin.locator(CAMPO.login).getAttribute('maxlength'));
    } finally {
      await context.close();
    }
  });

  test('CT-08: o servidor recusa e-mail com mais de 50 caracteres no cadastro', async ({ page }) => {
    await page.goto('/profissionais/criar');
    await removerLimiteDaTela(page.locator(CAMPO.profissional('email')));
    await preencherProfissional(page, { nome, email: emailComTamanho(LIMITE + 1), cpf });
    await salvarProfissional(page);
    await expect(mensagemDoCampo(page, CAMPO.profissional('email'))).toContainText(MSG.emailMax);
    await expect(page).toHaveURL(/\/profissionais\/criar/);
  });

  test('CT-09: cadastra o profissional com e-mail de exatamente 50 caracteres', async ({ page }) => {
    await page.goto('/profissionais/criar');
    await preencherProfissional(page, { nome, email, cpf });
    await salvarProfissional(page);
    await expect(page.getByText('Profissional cadastrado!')).toBeVisible();
    await expect(page).toHaveURL(/\/profissionais$/);
  });

  test('CT-10: o profissional entra no sistema com o login de 50 caracteres', async ({ browser }) => {
    const { context, page } = await contextoAnonimo(browser);
    try {
      await login(page, email, cpf.replace(/\D/g, ''));
      await expect(page.getByText('Login efetuado com sucesso!')).toBeVisible();
      await expect(page).not.toHaveURL(/\/login/);
    } finally {
      await context.close();
    }
  });

  test('CT-11: na edição, o E-mail mantém o limite de 50 e o servidor recusa 51', async ({ page }) => {
    const id = await idDoProfissional(page, nome);
    await page.goto(`/profissionais/${id}`);
    const campo = page.locator(CAMPO.profissional('email'));
    await expect(campo).toHaveValue(email);
    await expect(campo).toHaveAttribute('maxlength', String(LIMITE));
    await expect(contador(page, CAMPO.profissional('email'))).toHaveText(`${LIMITE} / ${LIMITE}`);

    await removerLimiteDaTela(campo);
    await campo.fill(emailComTamanho(LIMITE + 1));
    await salvarProfissional(page);
    await expect(mensagemDoCampo(page, CAMPO.profissional('email'))).toContainText(MSG.emailMax);
  });
});

test.describe('Protocolo 7633 — Complemento: contador e limite de 50 em Nome, E-mail e Filiações do profissional', () => {
  const CAMPOS = [
    { campo: 'nome', rotulo: 'Nome', msg: MSG.nomeMax },
    { campo: 'email', rotulo: 'E-mail', msg: MSG.emailMax },
    { campo: 'filiacao1', rotulo: 'Filiação 1', msg: MSG.filiacao1Max },
    { campo: 'filiacao2', rotulo: 'Filiação 2', msg: MSG.filiacao2Max },
  ] as const;

  test('CT-12: os quatro campos mostram o contador "0 / 50" antes do preenchimento', async ({ page }) => {
    await page.goto('/profissionais/criar');
    for (const { campo, rotulo } of CAMPOS) {
      await expect(contador(page, CAMPO.profissional(campo)), rotulo).toHaveText(`0 / ${LIMITE}`);
    }
  });

  test('CT-13: o contador acompanha o preenchimento sem exigir os 50 caracteres', async ({ page }) => {
    await page.goto('/profissionais/criar');
    for (const { campo, rotulo } of CAMPOS) {
      const seletor = CAMPO.profissional(campo);
      const valor = campo === 'email' ? emailComTamanho(20) : textoComTamanho(20);
      await page.locator(seletor).fill(valor);
      await expect(contador(page, seletor), rotulo).toHaveText(`20 / ${LIMITE}`);
      await expect(mensagemDoCampo(page, seletor), rotulo).toHaveCount(0);
    }
  });

  test('CT-14: os quatro campos têm limite de 50 e não aceitam digitar além', async ({ page }) => {
    await page.goto('/profissionais/criar');
    for (const { campo, rotulo } of CAMPOS) {
      const seletor = CAMPO.profissional(campo);
      await expect(page.locator(seletor), rotulo).toHaveAttribute('maxlength', String(LIMITE));
      const digitado = campo === 'email' ? emailComTamanho(LIMITE + 5) : textoComTamanho(LIMITE + 5);
      await page.locator(seletor).pressSequentially(digitado);
      await expect(page.locator(seletor), rotulo).toHaveValue(digitado.slice(0, LIMITE));
      await expect(contador(page, seletor), rotulo).toHaveText(`${LIMITE} / ${LIMITE}`);
    }
  });

  test('CT-15: o servidor recusa Nome e Filiações com mais de 50 caracteres', async ({ page }) => {
    await page.goto('/profissionais/criar');
    for (const { campo } of CAMPOS) await removerLimiteDaTela(page.locator(CAMPO.profissional(campo)));
    await preencherProfissional(page, {
      nome: textoComTamanho(LIMITE + 1),
      email: emailComTamanho(30),
      cpf: gerarCpf(),
      filiacao1: textoComTamanho(LIMITE + 1, 'Mae'),
      filiacao2: textoComTamanho(LIMITE + 1, 'Pai'),
    });
    await salvarProfissional(page);
    for (const { campo, rotulo, msg } of CAMPOS.filter((c) => c.campo !== 'email')) {
      await expect(mensagemDoCampo(page, CAMPO.profissional(campo)), rotulo).toContainText(msg);
    }
    await expect(page).toHaveURL(/\/profissionais\/criar/);
  });
});

test.describe('Protocolo 7633 — Alinhamento: outros campos que geram login', () => {
  test('CT-16: Login de acesso do cadastro de Usuários tem limite de 50', async ({ page }) => {
    await page.goto('/usuarios/criar');
    await expect(page.locator('[id="usuario.email"]')).toHaveAttribute('maxlength', String(LIMITE));
  });

  test('CT-17: E-mail do cadastro de Aluno tem limite de 50', async ({ page }) => {
    await page.goto('/alunos/criar');
    // O formulário só aparece depois de verificar um CPF ainda não cadastrado (nada é gravado aqui).
    await page.getByRole('textbox', { name: 'CPF' }).fill(gerarCpf());
    await page.getByRole('button', { name: 'Verificar CPF' }).click();
    await expect(page.locator('[id="aluno.email"]')).toHaveAttribute('maxlength', String(LIMITE));
  });
});

test.describe('Protocolo 7633 — Correção das pendências (PEN-7633-01 a 03)', () => {
  test.describe.configure({ mode: 'serial' });

  const marca = Date.now() % 100000;
  const comEmail = { nome: `${PREFIXO_QA} Desligado ${marca}`, email: emailComTamanho(40), cpf: gerarCpf() };
  const semEmail = { nome: `${PREFIXO_QA} Sem Email ${marca}`, email: '', cpf: gerarCpf() };

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/user.json' });
    try {
      await excluirProfissionaisQA(await context.newPage());
    } finally {
      await context.close();
    }
  });

  test('CT-18 (PEN-7633-02): profissional sem e-mail entra com o CPF como login', async ({ page, browser }) => {
    await page.goto('/profissionais/criar');
    await preencherProfissional(page, semEmail);
    await salvarProfissional(page);
    await expect(page.getByText('Profissional cadastrado!')).toBeVisible();

    const { context, page: tela } = await contextoAnonimo(browser);
    try {
      const cpf = semEmail.cpf.replace(/\D/g, '');
      await login(tela, cpf, cpf);
      await expect(tela.getByText('Login efetuado com sucesso!')).toBeVisible();
      await expect(tela).not.toHaveURL(/\/login/);
    } finally {
      await context.close();
    }
  });

  test('CT-19 (PEN-7633-03): o modal de exclusão pergunta pelo profissional, não pelo cargo', async ({ page }) => {
    await page.goto('/profissionais/criar');
    await preencherProfissional(page, comEmail);
    await salvarProfissional(page);
    await expect(page.getByText('Profissional cadastrado!')).toBeVisible();

    const id = await idDoProfissional(page, comEmail.nome);
    await page.getByRole('button', { name: `Ações para ${comEmail.nome}`, exact: true }).click();
    await page.locator(`[id="profissionais.btn_delete-${id}"]`).click();
    const dialogo = page.getByRole('dialog');
    await expect(dialogo).toContainText('Tem certeza que deseja apagar este profissional?');
    await expect(dialogo).not.toContainText('cargo');
    await dialogo.getByPlaceholder('Digite o código de confirmação').fill(String(id));
    await dialogo.getByRole('button', { name: 'Excluir' }).click();
    await expect(page.locator(`[id="profissionais.btn_acoes-${id}"]`)).toHaveCount(0);
  });

  test('CT-20 (PEN-7633-01): o profissional excluído não entra mais no sistema', async ({ browser }) => {
    const { context, page } = await contextoAnonimo(browser);
    try {
      await login(page, comEmail.email, comEmail.cpf.replace(/\D/g, ''));
      await expect(page.getByText('Login efetuado com sucesso!')).toHaveCount(0);
      await expect(page).toHaveURL(/\/login/);
    } finally {
      await context.close();
    }
  });
});
