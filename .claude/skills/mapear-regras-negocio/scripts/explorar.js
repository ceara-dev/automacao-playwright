// Exploração de uma rota do Apoio para levantamento de regras de negócio.
//
// Uso (na raiz do projeto, após `npx playwright test --project=setup`):
//   node .claude/skills/mapear-regras-negocio/scripts/explorar.js <rota> [admin|restrito] [pastaSaida]
//
// Gera em <pastaSaida> (padrão: ./.regras-tmp/<slug>-<perfil>/):
//   aria.yaml        → snapshot de acessibilidade da página (base dos locators)
//   props.json       → props Inertia completas (<script data-page="app">)
//   resumo.txt       → componente, chaves das props, permissões, status HTTP dos links
//   componente.js    → bundle compilado do componente Vue da página (formatado se houver prettier)
//   layout.js        → AuthenticatedLayout (menu lateral: `permission` de cada item)
//
// O servidor de homologação NÃO responde a Chromium headless — por isso headless:false.

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { chromium } = require(path.join(process.cwd(), 'node_modules/@playwright/test'));

const BASE = 'http://veramendes.local';
const [rota = '/dashboard', perfil = 'admin', saidaArg] = process.argv.slice(2);
const slug = rota.replace(/^\//, '').replace(/[^\w-]+/g, '_') || 'raiz';
const saida = saidaArg ?? path.join('.regras-tmp', `${slug}-${perfil}`);
fs.mkdirSync(saida, { recursive: true });

try { process.loadEnvFile('.env'); } catch { /* variáveis podem vir do ambiente */ }

function formatar(arquivo) {
  try {
    const formatado = execSync('npx --yes prettier@3 --parser babel', {
      input: fs.readFileSync(arquivo), maxBuffer: 64 * 1024 * 1024, stdio: ['pipe', 'pipe', 'ignore'],
    });
    fs.writeFileSync(arquivo, formatado);
  } catch { /* sem prettier: mantém minificado */ }
}

async function baixarAsset(page, nome, destino) {
  const js = await page.evaluate(async (u) => (await fetch(u)).text(), `${BASE}/build/assets/${nome}`);
  fs.writeFileSync(destino, js);
  formatar(destino);
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext(
    perfil === 'admin'
      ? { baseURL: BASE, storageState: 'e2e/.auth/user.json' }
      : { baseURL: BASE },
  );
  const page = await context.newPage();
  page.setDefaultTimeout(90_000);

  if (perfil !== 'admin') {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByRole('textbox', { name: 'Login de acesso' }).fill(process.env.RESTRICTED_USER_EMAIL ?? '');
    await page.getByRole('textbox', { name: 'Senha' }).fill(process.env.RESTRICTED_USER_PASSWORD ?? '');
    await page.getByRole('button', { name: 'Entrar no sistema' }).click();
    await page.waitForURL(/dashboard|password/);
  }

  const resposta = await page.goto(rota, { waitUntil: 'domcontentloaded' });
  if (resposta && resposta.status() >= 400) {
    // Página de erro (ex.: 403) não tem <main> nem props Inertia: registra e encerra.
    const texto = (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 300);
    const resumo = `rota: ${rota} | perfil: ${perfil} | HTTP ${resposta.status()}\n${texto}`;
    fs.writeFileSync(path.join(saida, 'resumo.txt'), resumo);
    console.log(resumo);
    await browser.close();
    return;
  }
  await page.locator('main').waitFor();
  await page.waitForTimeout(3000);

  fs.writeFileSync(path.join(saida, 'aria.yaml'), await page.locator('body').ariaSnapshot());

  const html = await page.evaluate(async (u) => (await fetch(u)).text(), rota);
  const match = html.match(/<script[^>]*data-page="app"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw new Error(`Props Inertia não encontradas em ${rota}`);
  const pagina = JSON.parse(match[1]);
  fs.writeFileSync(path.join(saida, 'props.json'), JSON.stringify(pagina, null, 1));

  // Bundle do componente: o app.js mapeia "./Pages/<Componente>.vue" → "assets/<Componente>-<hash>.js"
  const appSrc = html.match(/src="[^"]*\/build\/assets\/(app-[^"]+\.js)"/)?.[1];
  const app = appSrc ? await page.evaluate(async (u) => (await fetch(u)).text(), `${BASE}/build/assets/${appSrc}`) : '';
  const base = pagina.component.split('/').pop();
  const chunk = app.match(new RegExp(`assets/(${base}-[\\w-]+\\.js)`))?.[1];
  if (chunk) await baixarAsset(page, chunk, path.join(saida, 'componente.js'));
  const layout = app.match(/assets\/(AuthenticatedLayout-[\w-]+\.js)/)?.[1];
  if (layout) await baixarAsset(page, layout, path.join(saida, 'layout.js'));

  // Status HTTP de cada link do <main> para o perfil atual (403 = link exibido sem permissão)
  const hrefs = [...new Set(await page.locator('main a[href]').evaluateAll(
    (els) => els.map((el) => el.href).filter((h) => h.startsWith(location.origin)),
  ))];
  const links = [];
  for (const href of hrefs) {
    const status = await page.evaluate(async (u) => (await fetch(u, { redirect: 'manual' })).status, href);
    links.push(`${status}  ${href}`);
  }

  const props = pagina.props;
  const ignorar = new Set(['ziggy', 'user', 'auth', 'role', 'flash', 'errors']);
  const resumo = [
    `rota: ${rota} | perfil: ${perfil} | url final: ${page.url()}`,
    `componente: ${pagina.component} | bundle: ${chunk ?? 'não encontrado'}`,
    `título: ${await page.title()}`,
    `cargo: ${props.auth?.role?.label} | restrito_a_vinculo: ${props.auth?.restrito_a_vinculo}`,
    `permissões (${props.auth?.permissions?.length ?? 0}): ${(props.auth?.permissions ?? []).join(', ')}`,
    '',
    'props da página:',
    ...Object.entries(props)
      .filter(([k]) => !ignorar.has(k))
      .map(([k, v]) => `  ${k}: ${JSON.stringify(v).slice(0, 300)}`),
    '',
    'links no <main> (status para este perfil):',
    ...links.map((l) => `  ${l}`),
  ].join('\n');
  fs.writeFileSync(path.join(saida, 'resumo.txt'), resumo);
  console.log(resumo);
  console.log(`\nArquivos em ${saida}`);

  await browser.close();
})();
