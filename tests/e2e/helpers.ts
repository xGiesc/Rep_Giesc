import { expect, Page, TestInfo } from '@playwright/test';

export const LOCAL = 'http://127.0.0.1:4173/Rep_Giesc/';
export const CLOUD = 'http://127.0.0.1:4174/Rep_Giesc/';

/** Raccoglie errori JS e di console: a fine test devono essere vuoti. */
export function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text());
  });
  return errors;
}

/** Niente sbordamenti: né la pagina né campi/pulsanti oltre il bordo dello schermo. */
export async function expectNoOverflow(page: Page, where: string) {
  const bad = await page.evaluate(() => {
    const W = window.innerWidth;
    const out: string[] = [];
    if (document.documentElement.scrollWidth > W + 1) out.push('pagina scorre in orizzontale');
    const inScroll = (el: Element) => {
      for (let p = el.parentElement; p; p = p.parentElement) {
        const o = getComputedStyle(p).overflowX;
        if (o === 'auto' || o === 'scroll') return true;
      }
      return false;
    };
    document.querySelectorAll('input, div[tabindex="0"], img').forEach((e) => {
      const r = e.getBoundingClientRect();
      if (r.width > 0 && r.right > W + 1 && !inScroll(e)) out.push(`${e.tagName} oltre il bordo (${Math.round(r.right)}px)`);
    });
    return out;
  });
  expect(bad, `sbordamenti in "${where}"`).toEqual([]);
}

/** Salva uno screenshot tra gli allegati del test (utile per dare un'occhiata a mano). */
export async function snap(page: Page, info: TestInfo, name: string) {
  const body = await page.screenshot();
  if (process.env.SNAP_DIR) (await import('node:fs')).writeFileSync(`${process.env.SNAP_DIR}/${info.project.name}-${name}.png`, body);
  await info.attach(name, { body, contentType: 'image/png' });
}

/** La banda nera col logo deve esserci, essere nera e mostrare l'immagine. */
export async function expectBanner(page: Page) {
  const img = page.getByRole('img', { name: 'GR Personal Trainer' }).first();
  await expect(img).toBeVisible();
  const ok = await page.evaluate(() => {
    const el = document.querySelector('img[alt="GR Personal Trainer"]') as HTMLImageElement | null;
    if (!el) return false;
    let p: HTMLElement | null = el.parentElement;
    while (p && getComputedStyle(p).backgroundColor === 'rgba(0, 0, 0, 0)') p = p.parentElement;
    return !!p && getComputedStyle(p).backgroundColor === 'rgb(0, 0, 0)' && el.naturalWidth > 100;
  });
  expect(ok, 'banda nera con logo caricato').toBe(true);
}
