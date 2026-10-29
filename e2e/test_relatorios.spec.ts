import { test, expect } from '@playwright/test';

test('navega até a tela de Relatórios pelo menu lateral', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await page.getByRole('option', { name: 'Relatórios' }).click();

  await expect(page).toHaveURL(/relatorios/);
  await expect(page.getByRole('heading', { level: 5, name: 'Relatórios' })).toBeVisible();
  await expect(page.getByText('Consulte e gere relatórios personalizados do sistema')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Todos os relatórios' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Notifiq' })).toBeVisible();
});
