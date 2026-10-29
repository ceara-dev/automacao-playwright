import { expect, test } from '../fixtures';

// Template de auditoria de responsividade.
// Copie para e2e/protocolo<numero>/ e ajuste ROTA, PROTOCOLO e a espera inicial.
// Se o spec morar em outro nível de e2e/, ajuste o caminho de ../fixtures.

const PROTOCOLO = 'geral';
const ROTA = '/relatorios/insercao-aulas';
const ESPERA_INICIAL = /Relatório de Inserção de Aulas/i;

test.use({ protocolo: PROTOCOLO });
test.describe.configure({ timeout: 180_000 });

const VIEWPORTS = [
  { name: 'mobile-320', width: 320, height: 568 },
  { name: 'mobile-360', width: 360, height: 640 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-414', width: 414, height: 896 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'landscape-844', width: 844, height: 390 },
] as const;

for (const viewport of VIEWPORTS) {
  test(`layout em ${viewport.name}`, async ({ page, anexar }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(ROTA, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(ESPERA_INICIAL).first()).toBeVisible({ timeout: 60_000 });

    const metricas = await page.evaluate(() => {
      const largura = window.innerWidth;
      const visivel = (el: Element): boolean => {
        const rect = el.getBoundingClientRect();
        const estilo = getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && estilo.visibility !== 'hidden' && estilo.display !== 'none';
      };
      const seletor = (el: Element): string => {
        if (el.id) return `#${el.id}`;
        const classes = Array.from(el.classList).slice(0, 2).join('.');
        return `${el.tagName.toLowerCase()}${classes ? `.${classes}` : ''}`;
      };

      const foraDaTela = Array.from(document.querySelectorAll('body *'))
        .filter((el) => visivel(el) && !['fixed', 'sticky'].includes(getComputedStyle(el).position))
        .filter((el) => el.getBoundingClientRect().right > largura + 1)
        .slice(0, 15)
        .map((el) => {
          const rect = el.getBoundingClientRect();
          return { elemento: seletor(el), direita: Math.round(rect.right), largura: Math.round(rect.width) };
        });

      const alvosPequenos = Array.from(
        document.querySelectorAll('button, a[href], [role="button"], .v-btn, .v-list-item'),
      )
        .filter(visivel)
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width < 44 || rect.height < 44;
        })
        .slice(0, 15)
        .map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            elemento: seletor(el),
            texto: (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40),
            largura: Math.round(rect.width),
            altura: Math.round(rect.height),
          };
        });

      const fontesPequenas = Array.from(document.querySelectorAll('input, textarea, select'))
        .filter((el) => visivel(el) && (el as HTMLInputElement).type !== 'hidden')
        .map((el) => ({ elemento: seletor(el), fonte: parseFloat(getComputedStyle(el).fontSize) }))
        .filter((item) => item.fonte < 16);

      const overlays = Array.from(document.querySelectorAll('[role="dialog"], .v-overlay__content'))
        .filter(visivel)
        .map((el) => {
          const rect = el.getBoundingClientRect();
          return { elemento: seletor(el), x: Math.round(rect.x), largura: Math.round(rect.width) };
        })
        .filter((item) => item.largura > largura || item.x < 0);

      return {
        viewport: { largura, altura: window.innerHeight },
        overflowDocumento: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        foraDaTela,
        alvosPequenos,
        fontesPequenas,
        overlays,
      };
    });

    anexar(`metricas-${viewport.name}.json`, JSON.stringify(metricas, null, 2));

    expect
      .soft(metricas.overflowDocumento, `scroll horizontal na página em ${viewport.name}`)
      .toBeLessThanOrEqual(1);
    expect.soft(metricas.overlays, `overlay maior que a viewport em ${viewport.name}`).toEqual([]);
    expect.soft(metricas.fontesPequenas, `input com fonte < 16px (zoom no iOS) em ${viewport.name}`).toEqual([]);
    expect
      .soft(metricas.alvosPequenos.length, `alvos de toque < 44px em ${viewport.name}: ${JSON.stringify(metricas.alvosPequenos)}`)
      .toBe(0);

    // Fluxo principal no mobile: ajuste os seletores para a tela auditada.
    // await page.getByRole('button', { name: 'Consultar' }).click();
    // await expect(page.getByRole('table')).toBeVisible();
    // await page.getByRole('button', { name: 'Gerar PDF' }).click();
    // await expect(page.getByRole('dialog')).toBeVisible();
    // const dialogo = await page.getByRole('dialog').boundingBox();
    // expect.soft(dialogo!.width).toBeLessThanOrEqual(viewport.width);
  });
}
