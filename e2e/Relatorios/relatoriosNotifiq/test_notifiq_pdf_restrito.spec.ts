import { test, expect, type Page } from '@playwright/test';
import { DEFAULT_PERIODO } from '../../helpers/pdf';

// CT-NOTIFIQ-018 — PDF restrito expõe somente os dados da escola do usuário.
//
// Usuário criado via interface (módulo Usuários/ACL):
//   - Login: qa.restrito@caju.com.br (RESTRICTED_USER_EMAIL)
//   - Senha: Restrito@1234 (RESTRICTED_USER_PASSWORD) — definida no 1º login
//   - Cargo: Professor
//   - Escolas permitidas: Colégio Apoio (1 franquia vinculada)
//
// Limitação do ambiente de homologação: existe apenas UMA escola
// ("Colégio Apoio"), portanto não há segunda escola para contrastar no
// caso negativo (o PDF não deveria exibir dados de outra escola). O cenário
// valida o acesso do usuário restrito e o escopo de dados exibidos.

const RESTRICTED_EMAIL = process.env.RESTRICTED_USER_EMAIL ?? '';
const RESTRICTED_PASSWORD = process.env.RESTRICTED_USER_PASSWORD ?? '';

async function loginRestrito(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Login de acesso' }).fill(RESTRICTED_EMAIL);
  await page.getByRole('textbox', { name: 'Senha' }).fill(RESTRICTED_PASSWORD);
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();
  await expect(page).toHaveURL(/dashboard/);
}

test.describe('CT-NOTIFIQ-018: usuário restrito a uma escola', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('acessa o Notifiq com perfil restrito e vê apenas a escola vinculada', async ({ page }) => {
    await loginRestrito(page);

    // Perfil restrito: Professor (não Super Administrador)
    await expect(page.getByText('Apoio · Professor')).toBeVisible();

    // Menu reduzido: tem Relatórios, mas não tem seções administrativas
    await expect(page.getByRole('option', { name: 'Relatórios' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Escolas' })).toHaveCount(0);
    await expect(page.getByRole('option', { name: 'Usuários' })).toHaveCount(0);

    await page.goto('/relatorios/notifiq');
    await expect(page.getByRole('heading', { name: 'Relatórios Notifiq' })).toBeVisible();

    // Registros no período pertencem à escola do usuário
    const tabela = page.getByRole('table').last();
    await expect(tabela.getByText('Colégio Apoio', { exact: true }).first()).toBeVisible();
  });

  test('exporta o PDF contendo apenas os dados da escola do usuário', async ({ page }) => {
    test.fail(true, 'DEFEITO: registro-entrada-saida/export retorna 403 para usuário restrito (cargo Professor) mesmo com a permissão relatorios.notifiq.export');

    await loginRestrito(page);

    const origin = new URL(page.url()).origin;
    const url = `${origin}/relatorios/notifiq/registro-entrada-saida/export?data_inicio=${DEFAULT_PERIODO.data_inicio}&data_fim=${DEFAULT_PERIODO.data_fim}&formato=pdf`;

    const response = await page.request.get(url);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/pdf');
  });
});
