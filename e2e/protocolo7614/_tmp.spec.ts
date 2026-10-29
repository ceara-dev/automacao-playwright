import { test } from '@playwright/test';
import { PERFIS, TURMA_3SER, contextoComo, boletimDaTurma } from './boletim';

test.describe.configure({ timeout: 600_000 });

test('tmp: disciplinas por pagina do boletim da 3a Serie', async ({ browser }) => {
  const b = await boletimDaTurma(browser, TURMA_3SER.diario);
  const paginas = b.texto.split('\f');
  console.log('TOTAL PAGINAS', b.paginas, 'blocos de texto', paginas.length);
  paginas.forEach((p, i) => {
    const titulos = [...p.matchAll(/^(.+?) — Professor\(a\): /gm)].map((m) => m[1]);
    const temFrequencia = /Frequência anual na turma/.test(p);
    console.log(`PAGINA ${i + 1}: titulos=[${titulos.join(' | ')}] frequencia=${temFrequencia}`);
  });
});

test('tmp: perfil do T.I restrito', async ({ browser }) => {
  const { context, page } = await contextoComo(browser, PERFIS.tiRestrito);
  try {
    await page.goto('/diarios', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const botoes = await page.locator('button').evaluateAll((els) => els.map((e) => ({ texto: (e.textContent ?? '').trim().slice(0, 60), aria: e.getAttribute('aria-label'), titulo: e.getAttribute('title') })));
    console.log('BOTOES', JSON.stringify(botoes.filter((b) => b.aria || b.titulo || b.texto), null, 2));
    const links = await page.locator('a').evaluateAll((els) => els.map((e) => ({ texto: (e.textContent ?? '').trim().slice(0, 60), href: e.getAttribute('href') })));
    console.log('LINKS', JSON.stringify(links.filter((l) => l.texto || l.href), null, 2));
  } finally {
    await context.close();
  }
});
