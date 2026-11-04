import { expect, test } from '@playwright/test';
import { LOCAL, expectBanner, expectNoOverflow, snap, trackErrors } from './helpers';

// Modalità senza cloud: tutto sul dispositivo, senza login.
test.describe('app locale', () => {
  test('schede, apertura senza iniziare, animazioni, allenamento, timer, storico', async ({ page }, info) => {
    const errors = trackErrors(page);
    await page.goto(LOCAL);

    // --- home: solo l'allenamento previsto
    await expect(page.getByText('ALLENAMENTO PREVISTO')).toBeVisible();
    await expect(page.getByText('Push (esempio)')).toBeVisible();
    await expect(page.getByText('Apri', { exact: true })).toHaveCount(1);
    await expectBanner(page);
    await expectNoOverflow(page, 'home');
    await snap(page, info, '00-home');

    // --- schede: tutte, con Da fare / Eseguite
    await page.getByText('Schede', { exact: true }).click();
    await expect(page.getByText(/Da fare \(\d+\)/)).toBeVisible();
    await expect(page.getByText('Push (esempio)')).toBeVisible();
    await expect(page).toHaveTitle('GRG Personal Trainer');
    await expect(page.locator('link[rel=manifest]')).toHaveCount(1);
    await expectBanner(page);
    await expectNoOverflow(page, 'schede');
    await snap(page, info, '01-schede');

    // --- apri la scheda senza iniziare, guarda l'animazione di un esercizio
    await page.getByText('Apri', { exact: true }).first().click();
    await expect(page.getByText('Inizia allenamento')).toBeVisible();
    await expect(page.getByText('Military press con bilanciere')).toBeVisible();
    await expectNoOverflow(page, 'scheda aperta');
    await page.getByText('Video e info ›').first().click();
    await expect(page.getByText('Animazione schematica')).toBeVisible();
    await expect(page.getByText('Come si esegue')).toBeVisible();
    await expect(page.getByText('Petto', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('4 serie × 8 rip. · recupero 2 min')).toBeVisible();
    await expect(page.getByText('YouTube')).toHaveCount(0);
    const frame = () =>
      page.evaluate(() => Array.from(document.querySelectorAll('svg line')).map((e) => e.getAttribute('x2') + ',' + e.getAttribute('y2')).join('|'));
    expect(await page.locator('svg line, svg circle, svg rect').count()).toBeGreaterThan(10);
    const f1 = await frame();
    await page.waitForTimeout(900);
    expect(await frame(), "l'animazione si muove").not.toBe(f1);
    await expectNoOverflow(page, 'dettaglio esercizio');
    await snap(page, info, '02-dettaglio-animazione');
    await page.getByText('‹ Indietro').click();
    await page.getByText('‹ Indietro').click();

    // --- allenamento: timer di recupero
    await page.getByText('Inizia', { exact: true }).first().click();
    await expect(page.getByText('Recupero 2 min')).toBeVisible();
    await expect(page.getByText('Video e info ›')).toHaveCount(3);
    await expectNoOverflow(page, 'allenamento');
    await snap(page, info, '03-allenamento');
    await page.getByTestId('check-0-0').click();
    await expect(page.getByText(/^Recupero · Panca piana con bilanciere/)).toBeVisible();
    const time = () => page.getByText(/^[0-2]:\d\d$/).first().innerText();
    const secs = (s: string) => Number(s.split(':')[0]) * 60 + Number(s.split(':')[1]);
    const t1 = secs(await time());
    expect(t1).toBeGreaterThanOrEqual(119);
    await page.waitForTimeout(2200);
    const t2 = secs(await time());
    expect(t2).toBeLessThan(t1);
    await page.getByText('+15').click();
    await page.waitForTimeout(300);
    expect(secs(await time())).toBeGreaterThanOrEqual(t2 + 12);
    await snap(page, info, '04-timer');
    await page.getByText('Salta').click();
    await expect(page.getByText(/^Recupero · /)).toHaveCount(0);

    // --- aggiungi un esercizio durante l'allenamento (vale solo per la seduta)
    await page.getByText('+ Aggiungi esercizio').click();
    await page.getByPlaceholder(/^Cerca/).fill('curl con bilanciere');
    await page.getByText('Curl con bilanciere', { exact: true }).first().click();
    await expect(page.getByText('Curl con bilanciere', { exact: true })).toHaveCount(1);
    await page.getByText('Annulla', { exact: true }).click();

    // --- editor: scadenza, picklist, recupero personalizzato
    await page.getByText('Modifica', { exact: true }).first().click();
    await expect(page.getByText('Modifica scheda')).toBeVisible();
    await expect(page.getByText('3 serie × 12 rip. · recupero 1 min')).toBeVisible();
    await expectNoOverflow(page, 'editor');
    await page.getByText('4 settimane', { exact: true }).click();
    await expect(page.getByText(/Scade il .* · tra 28 giorni \(da oggi\)/)).toBeVisible();
    await snap(page, info, '05-editor');
    await page.getByText(/Scegli dall’elenco/).click();
    await expect(page.getByText('Scegli esercizio')).toBeVisible();
    await expect(page.getByText(/^\d+ esercizi$/)).toBeVisible();
    await page.getByPlaceholder(/^Cerca/).fill('squat');
    await expect(page.getByText('Usa “squat” come nome personalizzato')).toBeVisible();
    await expectNoOverflow(page, 'picklist');
    await snap(page, info, '06-picklist');
    await page.getByText('Quadricipiti', { exact: true }).click();
    await page.getByText('Squat con bilanciere', { exact: true }).first().click();
    await expect(page.getByText('Con animazione e istruzioni nella scheda dell’esercizio.')).toBeVisible();
    // subito il modulo: focus su Serie e pulsante Aggiungi già visibile, senza scorrere
    await expect(page.getByText('Aggiungi alla scheda')).toBeInViewport();
    await expect(page.getByText('Serie', { exact: true }).locator('xpath=following::input[1]')).toBeFocused();
    await snap(page, info, '06b-aggiungi-esercizio');
    await page
      .getByText('Recupero tra le serie (secondi, 0 = nessun timer)')
      .locator('xpath=following::input[1]')
      .fill('2');
    await page.getByText('Aggiungi alla scheda').click();
    await expect(page.getByText(/recupero 2 s/)).toBeVisible();
    await page.getByText('Salva scheda').click();

    // --- la scadenza compare sulla scheda
    await expect(page.getByText(/Scade il .* · tra 28 giorni/)).toBeVisible();

    // --- allenamento con l'esercizio a 2 s: il timer finisce da solo
    await page.getByText('Inizia', { exact: true }).first().click();
    await page.getByTestId('check-3-0').click();
    await expect(page.getByText('Recupero finito!')).toBeVisible({ timeout: 6000 });
    await page.getByText('OK', { exact: true }).click();
    await expect(page.getByText('Recupero finito!')).toHaveCount(0);

    // --- storico e persistenza dopo ricarica
    await page.getByText('Termina allenamento').click();
    await expect(page.getByText('Push (esempio)').first()).toBeVisible();
    await expect(page.getByText('Storico').first()).toBeVisible();
    await snap(page, info, '07-storico');
    await page.reload();
    await expect(page.getByText('ALLENAMENTO PREVISTO')).toBeVisible();
    await page.getByText('Schede', { exact: true }).click();
    await page.getByTestId('filter-done').click();
    await expect(page.getByText('Push (esempio)')).toBeVisible();
    await expect(page.getByText(/1 allenamento fatto/)).toBeVisible();
    await page.getByText('Modifica', { exact: true }).first().click();
    await expect(page.getByText(/Squat con bilanciere/).first()).toBeVisible();

    expect(errors, 'errori JS in console').toEqual([]);
  });

  test('nome personalizzato riconosciuto mostra comunque l’animazione', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('plans', JSON.stringify([{ id: 'p', name: 'Mia', exercises: [{ id: 'e', name: 'Panca piana', sets: 3, reps: 10, rest: 60 }] }]));
      localStorage.setItem('seeded', 'true');
    });
    await page.goto(LOCAL);
    await page.getByText('Apri', { exact: true }).click();
    await page.getByText('Video e info ›').click();
    await expect(page.getByText('Animazione schematica')).toBeVisible();
  });
});
