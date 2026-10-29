import { test, expect } from '@playwright/test';

test('acessa o dashboard autenticado', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Módulos principais' })).toBeVisible();
});
