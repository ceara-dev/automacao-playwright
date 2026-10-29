import { defineConfig, devices } from '@playwright/test';
import { execFileSync } from 'child_process';

try {
  process.loadEnvFile('.env');
} catch {
  // .env is optional; credentials can also come from the environment
}

// PW_MONITOR=2 abre o navegador no 2º monitor (numeração do `xrandr --listmonitors`, começando em 1).
// Sem a variável, a janela abre onde o sistema decidir.
function posicaoNoMonitor(): string[] {
  const numero = Number(process.env.PW_MONITOR);
  if (!numero) return [];
  try {
    const monitores = execFileSync('xrandr', ['--listmonitors'], { encoding: 'utf8' }).split('\n').slice(1);
    const posicao = /\+(-?\d+)\+(-?\d+)/.exec(monitores[numero - 1] ?? '');
    if (posicao) return [`--window-position=${posicao[1]},${posicao[2]}`];
  } catch {
    // sem xrandr: segue sem posicionar
  }
  console.warn(`PW_MONITOR=${process.env.PW_MONITOR}: monitor não encontrado; a janela abre na posição padrão.`);
  return [];
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/html', open: 'never' }]],
  use: {
    baseURL: 'http://veramendes.local',
    headless: false,
    launchOptions: { args: posicaoNoMonitor() },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      testIgnore: /protocolo7621\//,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'ti',
      testMatch: /protocolo7621\//,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/ti.json',
      },
      dependencies: ['setup'],
    },
  ],
});
