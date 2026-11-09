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
    // la GIF della libreria è mostrata e il file esiste davvero
    const gifEl = page.getByTestId('exercise-gif');
    await expect(gifEl).toBeVisible();
    const gifInfo = await gifEl.evaluate(async (el) => {
      const bg = getComputedStyle(el).backgroundImage;
      const img = el.querySelector('img');
      const url = (bg.match(/url\("?([^")]+)"?\)/)?.[1] ?? img?.getAttribute('src')) as string;
      const r = await fetch(url);
      return { url, ok: r.ok, type: r.headers.get('content-type'), size: (await r.arrayBuffer()).byteLength };
    });
    expect(gifInfo.ok, gifInfo.url).toBe(true);
    expect(gifInfo.type).toContain('image/gif');
    expect(gifInfo.size).toBeGreaterThan(2000);
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

  test('esercizio senza GIF nella libreria: ripiega sull’animazione dell’app', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('plans', JSON.stringify([{ id: 'p', name: 'Mia', exercises: [{ id: 'e', name: 'Iperestensioni (panca per lombari)', dbId: 'iperestensioni', sets: 3, reps: 10, rest: 60 }] }]));
      localStorage.setItem('seeded', 'true');
    });
    await page.goto(LOCAL);
    await page.getByText('Apri', { exact: true }).click();
    await page.getByText('Video e info ›').click();
    await expect(page.getByTestId('exercise-gif')).toHaveCount(0);
    expect(await page.locator('svg path').count()).toBeGreaterThan(30);
  });
  test('diario alimentare: obiettivi, alimenti comuni, prodotto online, alimento creato, modifica e persistenza', async ({ page }, info) => {
    const errors = trackErrors(page);
    await page.route('**://world.openfoodfacts.org/**', (r) =>
      r.fulfill({
        status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify({ products: [
          { code: '111', product_name: 'Biscotti Test', brands: 'Marca', serving_quantity: 30, nutriments: { 'energy-kcal_100g': 450, proteins_100g: 6, carbohydrates_100g: 70, fat_100g: 16 } },
          { code: '222', product_name: 'Incompleto', nutriments: {} },
        ] }),
      }),
    );
    await page.goto(LOCAL);
    await page.getByText('Dieta', { exact: true }).click();
    await expect(page.getByText('Alimentazione', { exact: true })).toBeVisible();
    await expect(page.getByTestId('day-label')).toHaveText('Oggi');
    await expect(page.getByText('Imposta un obiettivo')).toBeVisible();
    await expectNoOverflow(page, 'dieta vuota');
    await snap(page, info, '10-dieta-vuota');

    // obiettivi (con calcolo automatico)
    await page.getByTestId('goals-btn').click();
    await page.getByTestId('goal-age').fill('30');
    await page.getByTestId('goal-weight').fill('80');
    await page.getByTestId('goal-height').fill('180');
    await page.getByText('Calcola', { exact: true }).click();
    expect(Number(await page.getByTestId('goal-kcal').inputValue())).toBeGreaterThan(2500);
    await page.getByTestId('goal-kcal').fill('2000');
    await page.getByTestId('goal-p').fill('150');
    await page.getByTestId('goal-c').fill('200');
    await page.getByTestId('goal-f').fill('60');
    await expectNoOverflow(page, 'obiettivi');
    await page.getByText('Salva obiettivo').click();
    await expect(page.getByTestId('kcal-left')).toHaveText('2000');

    // alimento comune a pranzo: riso 100 g = 332 kcal
    await page.getByTestId('add-pranzo').click();
    await page.getByTestId('food-search').fill('riso bianco');
    await page.getByTestId('food-row').first().click();
    await page.getByTestId('food-grams').fill('100');
    await expect(page.getByTestId('food-total')).toContainText('332 kcal');
    await expectNoOverflow(page, 'quantità');
    await page.getByText('Aggiungi', { exact: true }).click();
    await expect(page.getByTestId('kcal-eaten')).toHaveText('332');
    await expect(page.getByTestId('kcal-left')).toHaveText('1668');

    // prodotto confezionato (Open Food Facts) a colazione: 50 g = 225 kcal; quello incompleto è scartato
    await page.getByTestId('add-colazione').click();
    await page.getByTestId('food-search').fill('biscotti');
    await expect(page.getByText('Biscotti Test')).toBeVisible();
    await expect(page.getByText('Incompleto')).toHaveCount(0);
    await page.getByText('Biscotti Test').click();
    await page.getByTestId('food-grams').fill('50');
    await expect(page.getByTestId('food-total')).toContainText('225 kcal');
    await page.getByText('Aggiungi', { exact: true }).click();
    await expect(page.getByTestId('kcal-eaten')).toHaveText('557');

    // alimento creato a mano nello spuntino
    await page.getByTestId('add-spuntino').click();
    await page.getByText('+ Crea un alimento').click();
    await page.getByTestId('custom-name').fill('Mio budino');
    await page.getByTestId('custom-kcal').fill('100');
    await page.getByTestId('custom-p').fill('4');
    await page.getByTestId('custom-c').fill('15');
    await page.getByTestId('custom-f').fill('2');
    await page.getByText('Salva e scegli la quantità').click();
    await page.getByTestId('food-grams').fill('200');
    await page.getByText('Aggiungi', { exact: true }).click();
    await expect(page.getByTestId('kcal-eaten')).toHaveText('757');
    await expect(page.getByTestId('meal-spuntino')).toContainText('Mio budino');
    await expectNoOverflow(page, 'diario pieno');
    await snap(page, info, '11-dieta-piena');

    // modifica la quantità e poi elimina
    await page.getByTestId('meal-spuntino').getByTestId('entry').click();
    await page.getByTestId('food-grams').fill('100');
    await page.getByText('Aggiorna', { exact: true }).click();
    await expect(page.getByTestId('kcal-eaten')).toHaveText('657');
    await page.getByTestId('meal-colazione').getByTestId('entry').click();
    await page.getByText('Elimina dal diario').click();
    await expect(page.getByTestId('kcal-eaten')).toHaveText('432');

    // giorno precedente vuoto, poi si torna a oggi; i dati restano dopo la ricarica
    await page.getByTestId('day-prev').click();
    await expect(page.getByTestId('day-label')).toHaveText('Ieri');
    await expect(page.getByTestId('kcal-eaten')).toHaveText('0');
    await page.getByTestId('day-next').click();
    await page.reload();
    await page.getByText('Dieta', { exact: true }).click();
    await expect(page.getByTestId('kcal-eaten')).toHaveText('432');
    await expect(page.getByTestId('kcal-left')).toHaveText('1568');

    expect(errors, 'errori JS in console').toEqual([]);
  });
  test('codice a barre: la fotocamera legge il prodotto e apre la quantità', async ({ page }) => {
    const errors = trackErrors(page);
    const code = '8001234567897'; // EAN-13 valido (cifra di controllo corretta)
    let asked = '';
    await page.route('**://world.openfoodfacts.org/**', (r) => {
      asked = r.request().url();
      return r.fulfill({
        status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify({ status: 1, product: { product_name: 'Prodotto Scansionato', brands: 'Marca', serving_quantity: 25, nutriments: { 'energy-kcal_100g': 400, proteins_100g: 10, carbohydrates_100g: 60, fat_100g: 12 } } }),
      });
    });
    // fotocamera finta: un video generato da un canvas che disegna il codice EAN-13
    await page.addInitScript((digits: string) => {
      const L = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
      const G = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
      const R = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];
      const PAR = ['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];
      const d = digits.split('').map(Number);
      let bits = '101';
      for (let i = 1; i <= 6; i++) bits += (PAR[d[0]][i - 1] === 'L' ? L : G)[d[i]];
      bits += '01010';
      for (let i = 7; i <= 12; i++) bits += R[d[i]];
      bits += '101';
      const cv = document.createElement('canvas');
      cv.width = 640; cv.height = 480;
      const g = cv.getContext('2d')!;
      const draw = () => {
        g.fillStyle = '#fff'; g.fillRect(0, 0, 640, 480);
        const w = 4, x0 = (640 - bits.length * w) / 2;
        g.fillStyle = '#000';
        [...bits].forEach((b, i) => b === '1' && g.fillRect(x0 + i * w, 140, w, 200));
      };
      draw();
      setInterval(draw, 100);
      const stream = (cv as any).captureStream(15);
      (navigator.mediaDevices as any).getUserMedia = async () => stream;
    }, code);

    await page.goto(LOCAL);
    await page.getByText('Dieta', { exact: true }).click();
    await page.getByTestId('add-pranzo').click();
    await page.getByTestId('scan-btn').click();
    // letto il codice → ricerca del prodotto → schermata della quantità
    await expect(page.getByText('Prodotto Scansionato')).toBeVisible({ timeout: 15000 });
    expect(asked).toContain(code);
    await expect(page.getByTestId('food-grams')).toHaveValue('25');
    await expect(page.getByTestId('food-total')).toContainText('100 kcal');
    await page.getByText('Aggiungi', { exact: true }).click();
    await expect(page.getByTestId('kcal-eaten')).toHaveText('100');
    expect(errors, 'errori JS in console').toEqual([]);
  });
});
