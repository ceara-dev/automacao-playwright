import { test as setup, expect } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

setup('autentica no sistema', async ({ page }) => {
  await page.goto('/login');

  await page.getByRole('textbox', { name: 'Login de acesso' }).fill(process.env.USER_EMAIL!);
  await page.getByRole('textbox', { name: 'Senha' }).fill(process.env.USER_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar no sistema' }).click();

  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByText('Login efetuado com sucesso!')).toBeVisible();

  await page.context().storageState({ path: authFile });
});
