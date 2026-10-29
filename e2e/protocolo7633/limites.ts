import { expect, type Browser, type BrowserContext, type Locator, type Page } from '@playwright/test';

// Protocolo #7633 — helpers da suíte de limite de caracteres (e-mail/login, nome e filiações do profissional).

export const BASE_URL = 'http://veramendes.local';

/** Limite combinado no protocolo: login, e-mail, nome e filiações do profissional. */
export const LIMITE = 50;

/** Prefixo dos registros criados pela suíte (limpos no afterAll). */
export const PREFIXO_QA = 'QA-7633';

export const MSG = {
  loginMax: `O login de acesso não pode ter mais de ${LIMITE} caracteres.`,
  emailMax: `O e-mail não pode ter mais de ${LIMITE} caracteres.`,
  nomeMax: `O nome não pode ter mais de ${LIMITE} caracteres.`,
  filiacao1Max: `A filiação 1 não pode ter mais de ${LIMITE} caracteres.`,
  filiacao2Max: `A filiação 2 não pode ter mais de ${LIMITE} caracteres.`,
};

export const CAMPO = {
  login: '[id="login.input_email"]',
  profissional: (campo: 'nome' | 'email' | 'filiacao1' | 'filiacao2' | 'cpf') => `[id="profissional.${campo}"]`,
};

/** E-mail único com exatamente `tamanho` caracteres (`qa7633<marca>xxxx@qa.com`). */
export function emailComTamanho(tamanho: number, marca: string = String(Date.now())): string {
  const dominio = '@qa.com';
  const prefixo = `qa7633${marca}`;
  const local = (prefixo + 'x'.repeat(tamanho)).slice(0, tamanho - dominio.length);
  return local + dominio;
}

/** Texto com exatamente `tamanho` caracteres, começando por `inicio`. */
export function textoComTamanho(tamanho: number, inicio = PREFIXO_QA): string {
  return (inicio + ' ' + 'a'.repeat(tamanho)).slice(0, tamanho);
}

/** CPF válido aleatório, já com máscara (###.###.###-##). */
export function gerarCpf(): string {
  const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  const dv = (d: number[]) => {
    const soma = d.reduce((t, x, i) => t + x * (d.length + 1 - i), 0);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  n.push(dv(n));
  n.push(dv(n));
  const s = n.join('');
  return `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${s.slice(9)}`;
}

/** Contexto sem sessão (tela de login). */
export async function contextoAnonimo(browser: Browser): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ baseURL: BASE_URL, storageState: { cookies: [], origins: [] } });
  return { context, page: await context.newPage() };
}

/** Contador do Vuetify ("N / 50") do campo. */
export function contador(page: Page, seletor: string): Locator {
  return page.locator('.v-input').filter({ has: page.locator(seletor) }).locator('.v-counter');
}

/** Tira o `maxlength` da tela para provar que o servidor também barra o excesso. */
export async function removerLimiteDaTela(campo: Locator): Promise<void> {
  await campo.evaluate((el) => el.removeAttribute('maxlength'));
}

export async function login(page: Page, usuario: string, senha: string): Promise<void> {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Login de acesso' }).fill(usuario);
  await page.getByRole('textbox', { name: 'Senha' }).fill(senha);
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
}

export type DadosProfissional = { nome: string; email: string; cpf: string; filiacao1?: string; filiacao2?: string };

/** Preenche o mínimo para salvar um Professor(a) na aba "Dados Pessoais". */
export async function preencherProfissional(page: Page, dados: DadosProfissional): Promise<void> {
  await page.locator(CAMPO.profissional('nome')).fill(dados.nome);
  if (dados.email) await page.locator(CAMPO.profissional('email')).fill(dados.email);
  await page.locator(CAMPO.profissional('cpf')).fill(dados.cpf);
  if (dados.filiacao1 !== undefined) await page.locator(CAMPO.profissional('filiacao1')).fill(dados.filiacao1);
  if (dados.filiacao2 !== undefined) await page.locator(CAMPO.profissional('filiacao2')).fill(dados.filiacao2);
  await page.locator('[id="profissional.funcao"]').click({ force: true });
  await page.getByRole('option', { name: 'Professor(a)' }).click();
}

export async function salvarProfissional(page: Page): Promise<void> {
  // "Salvar" no cadastro, "Atualizar" na edição.
  await page.getByRole('button', { name: /^(Salvar|Atualizar)$/ }).click();
}

/** Mensagem de validação exibida abaixo do campo. */
export function mensagemDoCampo(page: Page, seletor: string): Locator {
  return page.locator('.v-input').filter({ has: page.locator(seletor) }).locator('.v-messages__message');
}

/** id do profissional pelo nome, a partir do botão de ações da listagem. */
export async function idDoProfissional(page: Page, nome: string): Promise<number> {
  await page.goto(`/profissionais?search=${encodeURIComponent(nome)}`);
  const botao = page.getByRole('button', { name: `Ações para ${nome}`, exact: true });
  await expect(botao).toBeVisible();
  const id = (await botao.getAttribute('id'))!.replace('profissionais.btn_acoes-', '');
  return Number(id);
}

/** Exclui (lixeira) todos os profissionais criados pela suíte. O usuário de login vinculado permanece. */
export async function excluirProfissionaisQA(page: Page): Promise<void> {
  for (let tentativas = 0; tentativas < 20; tentativas++) {
    await page.goto(`/profissionais?search=${PREFIXO_QA}`);
    await page.waitForLoadState('networkidle');
    const botoes = page.locator('[id^="profissionais.btn_acoes-"]');
    if ((await botoes.count()) === 0) return;
    const id = (await botoes.first().getAttribute('id'))!.replace('profissionais.btn_acoes-', '');
    await botoes.first().click();
    await page.locator(`[id="profissionais.btn_delete-${id}"]`).click();
    const dialogo = page.getByRole('dialog');
    await dialogo.getByPlaceholder('Digite o código de confirmação').fill(id);
    await dialogo.getByRole('button', { name: 'Excluir' }).click();
    await expect(page.locator(`[id="profissionais.btn_acoes-${id}"]`)).toHaveCount(0);
  }
}
