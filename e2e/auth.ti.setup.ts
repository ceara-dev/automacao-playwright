import { test as setup, expect } from '@playwright/test';

const authFile = 'e2e/.auth/ti.json';

setup('autentica como T.I', async ({ page }) => {
  await page.goto('/login');

  await page.getByRole('textbox', { name: 'Login de acesso' }).fill(process.env.QA_7614_TI_EMAIL!);
  await page.getByRole('textbox', { name: 'Senha' }).fill(process.env.QA_7614_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();

  await expect(page).toHaveURL(/dashboard/);
  await page.context().storageState({ path: authFile });
});
