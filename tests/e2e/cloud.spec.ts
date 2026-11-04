import { expect, Page, test } from '@playwright/test';
import { CLOUD, expectBanner, expectNoOverflow, snap, trackErrors } from './helpers';

// Versione con login: il "cloud" (Supabase) è simulato qui, nessuna rete reale.
const REF = 'mock';

type Role = 'client' | 'pt';
const PT_ID = 'pt1';
const CLIENT_ID = 'u1';

async function setup(page: Page, role: Role, opts: { loggedIn?: boolean; expires?: string } = {}) {
  const loggedIn = opts.loggedIn ?? true;
  const uid = role === 'client' ? CLIENT_ID : PT_ID;
  const me = {
    id: uid,
    email: 'x@y.it',
    name: 'Mario',
    role,
    invite_code: 'ABC123',
    pt_id: role === 'client' ? PT_ID : null,
  };
  const luca = { id: CLIENT_ID, email: 'a@b.it', name: 'Luca', role: 'client', invite_code: 'ZZZ', pt_id: PT_ID };
  const plan = {
    id: 'p1',
    name: 'Push PT',
    exercises: [{ id: 'e1', name: 'Panca piana con bilanciere', dbId: 'panca-piana-bilanciere', sets: 4, reps: 8, rest: 90 }],
    owner_id: CLIENT_ID,
    created_by: PT_ID,
    created_at: '2026-01-01',
    expires_at: opts.expires ?? '2020-01-01',
  };

  await page.route('**/mock.supabase.co/**', async (route) => {
    const req = route.request();
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const url = req.url();
    const single = (req.headers()['accept'] ?? '').includes('vnd.pgrst.object');
    let body: unknown = {};
    if (url.includes('/rest/v1/rpc/my_invite_code')) body = role === 'pt' ? 'ABC123' : null;
    else if (url.includes('/rest/v1/profiles')) {
      if (url.includes('id=eq')) body = single ? me : [me];
      else body = role === 'pt' ? [me, luca] : [me];
    } else if (url.includes('/rest/v1/plans')) body = req.method() === 'GET' ? [plan] : [];
    else if (url.includes('/rest/v1/sessions')) body = [];
    await route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(body) });
  });

  if (loggedIn) {
    const session = {
      access_token: 'a.b.c',
      refresh_token: 'r',
      expires_in: 99999,
      expires_at: 4102444800,
      token_type: 'bearer',
      user: { id: uid, email: 'x@y.it', aud: 'authenticated', app_metadata: {}, user_metadata: {} },
    };
    await page.addInitScript(
      ([key, value]) => localStorage.setItem(key, value),
      [`sb-${REF}-auth-token`, JSON.stringify(session)],
    );
  }
}

test.describe('login e ruoli', () => {
  test('senza accesso compare il login con la banda del logo', async ({ page }, info) => {
    const errors = trackErrors(page);
    await setup(page, 'client', { loggedIn: false });
    await page.goto(CLOUD);
    await expect(page.getByText('Accedi').first()).toBeVisible();
    await expectBanner(page);
    await expectNoOverflow(page, 'login');
    await snap(page, info, 'login');
    await page.getByText('Registrati', { exact: true }).click();
    await expect(page.getByText(/Codice del tuo personal trainer/)).toBeVisible();
    await expectNoOverflow(page, 'registrazione');
    expect(errors).toEqual([]);
  });

  test('atleta: home = solo la scheda prevista, Schede con Da fare/Eseguite, nessuna modifica', async ({ page }, info) => {
    const errors = trackErrors(page);
    await setup(page, 'client', { expires: '2099-01-01' });
    await page.goto(CLOUD);
    await expect(page.getByText('ALLENAMENTO PREVISTO')).toBeVisible();
    await expect(page.getByText('Push PT')).toBeVisible();
    await expectBanner(page);
    await expect(page.getByText('Inizia allenamento')).toBeVisible();
    await expect(page.getByText('Modifica', { exact: true })).toHaveCount(0);
    await expectNoOverflow(page, 'home atleta');
    await snap(page, info, 'atleta-home');
    await page.getByText('Schede', { exact: true }).click();
    await expect(page.getByText('Push PT')).toBeVisible();
    await expect(page.getByText('Apri', { exact: true })).toHaveCount(1);
    await expect(page.getByText('Inizia', { exact: true })).toHaveCount(1);
    await expect(page.getByText('Modifica', { exact: true })).toHaveCount(0);
    await expect(page.getByText('+ Nuova scheda')).toHaveCount(0);
    await expect(page.getByText('Assegnata dal tuo personal trainer')).toBeVisible();
    await expectNoOverflow(page, 'schede atleta');
    await snap(page, info, 'atleta-schede');
    await page.getByTestId('filter-done').click();
    await expect(page.getByText('Push PT')).toHaveCount(0);
    await page.getByTestId('filter-todo').click();
    await page.getByText('Apri', { exact: true }).click();
    await expect(page.getByText('Inizia allenamento')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('atleta: scheda scaduta → nessun allenamento previsto, compare tra le eseguite', async ({ page }) => {
    await setup(page, 'client');
    await page.goto(CLOUD);
    await expect(page.getByText('Nessun allenamento previsto')).toBeVisible();
    await page.getByText('Schede', { exact: true }).click();
    await page.getByTestId('filter-done').click();
    await expect(page.getByText('Push PT')).toBeVisible();
    await expect(page.getByText(/Scaduta il/)).toBeVisible();
  });

  test('PT: home = atleti, niente Schede/Storico, switch modalità, modifica schede dell'atleta', async ({ page }, info) => {
    const errors = trackErrors(page);
    await setup(page, 'pt');
    await page.goto(CLOUD);
    await expect(page.getByText('I miei atleti')).toBeVisible();
    await expectBanner(page);
    await expect(page.getByText('Luca').first()).toBeVisible();
    await expect(page.getByText(/Scheda scaduta il/)).toBeVisible();
    await expect(page.getByText('Storico', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Schede', { exact: true })).toHaveCount(0);
    await expectNoOverflow(page, 'home PT');
    await snap(page, info, 'pt-home');

    await page.getByText('Account', { exact: true }).click();
    await expect(page.getByText('ABC123')).toBeVisible();
    await page.getByText('Passa alla modalità allenamento').click();
    await expect(page.getByText('Storico', { exact: true })).toBeVisible();
    await page.getByText('Schede', { exact: true }).click();
    await page.getByTestId('filter-done').click();
    await expect(page.getByText('Push PT')).toBeVisible();
    await expect(page.getByText('Modifica', { exact: true })).toHaveCount(1);
    await page.getByText('Account', { exact: true }).click();
    await page.getByText('Torna ai miei atleti').click();
    await expect(page.getByText('I miei atleti')).toBeVisible();

    await page.getByText('Luca').first().click();
    await page.getByText('Schede', { exact: true }).click();
    await page.getByTestId('filter-done').click();
    await expect(page.getByText('Modifica', { exact: true })).toHaveCount(1);
    await expect(page.getByText('Inizia', { exact: true })).toHaveCount(0);
    await snap(page, info, 'pt-schede-ragazzo');
    expect(errors).toEqual([]);
  });
});
