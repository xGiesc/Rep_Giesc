// Verifica le regole di sicurezza del database eseguendo davvero supabase/schema.sql
// su un Postgres in memoria (PGlite), simulando ruoli e login di Supabase.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
const PT = '00000000-0000-0000-0000-0000000000a1';
const PT2 = '00000000-0000-0000-0000-0000000000a2';
const LUCA = '00000000-0000-0000-0000-0000000000b1';
const ANNA = '00000000-0000-0000-0000-0000000000b2'; // atleta senza PT
const EVIL = '00000000-0000-0000-0000-0000000000c1';

/** Esegue `fn` come utente loggato (authenticated) o anonimo. */
async function as<T>(user: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role ${user ? 'authenticated' : 'anon'}; select set_config('request.jwt.claim.sub', '${user ?? ''}', false);`);
  try {
    return await fn();
  } finally {
    await db.exec('reset role');
  }
}
const q = (sql: string, params: unknown[] = []) => db.query<Record<string, unknown>>(sql, params);
const denied = async (fn: () => Promise<unknown>) => {
  try {
    await fn();
  } catch (e) {
    return String(e);
  }
  return null;
};
/** Una scrittura "riuscita" ma su 0 righe (bloccata da RLS) conta come negata. */
const affected = async (sql: string, params: unknown[] = []) => {
  try {
    return (await db.query(sql, params)).affectedRows ?? 0;
  } catch {
    return 0;
  }
};

before(async () => {
  // simulazione dell'ambiente Supabase
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    -- come in Supabase: di default tutto è concesso ad anon/authenticated
    alter default privileges in schema public grant all on tables to anon, authenticated;
    alter default privileges in schema public grant execute on functions to anon, authenticated;
  `);
  await db.exec(readFileSync('supabase/schema.sql', 'utf8'));
  await db.exec(readFileSync('supabase/schema.sql', 'utf8')); // rieseguibile senza errori

  const meta = (n: string, code = '') => JSON.stringify({ name: n, invite_code: code });
  await db.query(`insert into auth.users(id,email,raw_user_meta_data) values ($1,'pt@x.it',$2),($3,'pt2@x.it',$4)`, [PT, meta('Coach'), PT2, meta('Coach2')]);
  await db.exec(`update public.profiles set role='pt' where id in ('${PT}','${PT2}')`); // fatto a mano dall'admin
  const code = (await q(`select invite_code from public.profiles where id=$1`, [PT])).rows[0].invite_code as string;
  await db.query(`insert into auth.users(id,email,raw_user_meta_data) values ($1,'luca@x.it',$2),($3,'anna@x.it',$4),($5,'evil@x.it',$6)`, [
    LUCA, meta('Luca', code), ANNA, meta('Anna'), EVIL, JSON.stringify({ name: 'Evil', role: 'pt' }),
  ]);
  // una scheda assegnata dal PT a Luca, un'altra di Anna creata da lei stessa (via admin), un allenamento di Luca
  await db.exec(`
    insert into public.plans(id,owner_id,created_by,name) values ('p-luca','${LUCA}','${PT}','Push'),('p-anna','${ANNA}','${ANNA}','Anna plan'),('p-pt','${PT}','${PT}','Mia');
    insert into public.sessions(id,user_id,plan_name,date) values ('s-luca','${LUCA}','Push', now());
  `);
});
after(() => db.close());

test('lo schema è rieseguibile e il trigger crea i profili (sempre come atleta)', async () => {
  const r = await q(`select id, role, pt_id from public.profiles order by id`);
  assert.equal(r.rows.length, 5);
  const evil = r.rows.find((x) => x.id === EVIL)!;
  assert.equal(evil.role, 'client', 'il ruolo nei metadati di registrazione NON deve valere');
  assert.equal(r.rows.find((x) => x.id === LUCA)!.pt_id, PT, 'il codice PT collega al PT');
  assert.equal(r.rows.find((x) => x.id === ANNA)!.pt_id, null);
});

test('chi non è loggato non vede e non scrive nulla', async () => {
  await as(null, async () => {
    assert.ok(await denied(() => q('select * from public.plans')), 'plans');
    assert.ok(await denied(() => q('select id from public.profiles')), 'profiles');
    assert.ok(await denied(() => q('select * from public.sessions')), 'sessions');
    assert.ok(await denied(() => q(`insert into public.plans(id,owner_id,name) values ('x','${ANNA}','x')`)), 'insert');
    assert.ok(await denied(() => q(`select public.join_pt('X')`)), 'join_pt anonimo');
  });
});

test('un atleta vede solo le proprie schede e i propri dati', async () => {
  await as(LUCA, async () => {
    const plans = (await q('select id from public.plans')).rows.map((r) => r.id);
    assert.deepEqual(plans, ['p-luca']);
    const profs = (await q('select id from public.profiles order by id')).rows.map((r) => r.id);
    assert.deepEqual(profs.sort(), [LUCA, PT].sort(), 'vede sé stesso e il proprio PT, nessun altro');
    assert.equal((await q('select * from public.sessions')).rows.length, 1);
  });
  await as(ANNA, async () => {
    assert.deepEqual((await q('select id from public.plans')).rows.map((r) => r.id), ['p-anna']);
    assert.equal((await q('select * from public.sessions')).rows.length, 0, 'non vede gli allenamenti di Luca');
  });
});

test('il codice invito non è leggibile da nessuno tranne dal PT stesso', async () => {
  await as(LUCA, async () => {
    assert.ok(await denied(() => q('select invite_code from public.profiles')), 'colonna invite_code non selezionabile');
    assert.ok(await denied(() => q('select * from public.profiles')), 'select * negato (si elencano le colonne)');
    assert.equal((await q('select public.my_invite_code() as c')).rows[0].c, null, 'un atleta non ha codice');
  });
  await as(PT, async () => {
    const c = (await q('select public.my_invite_code() as c')).rows[0].c as string;
    assert.match(c, /^[0-9A-F]{8}$/);
  });
});

test('l’atleta NON può modificare, creare o cancellare schede', async () => {
  await as(LUCA, async () => {
    assert.equal(await affected(`update public.plans set name='Hack' where id='p-luca'`), 0, 'update scheda assegnata');
    assert.equal(await affected(`delete from public.plans where id='p-luca'`), 0, 'delete scheda');
    assert.ok(await denied(() => q(`insert into public.plans(id,owner_id,name) values ('mia','${LUCA}','Mia')`)), 'insert scheda propria');
  });
  const still = (await q(`select name from public.plans where id='p-luca'`)).rows[0].name;
  assert.equal(still, 'Push');
});

test('l’atleta non può cambiare ruolo, codice, PT o email', async () => {
  await as(EVIL, async () => {
    assert.ok(await denied(() => q(`update public.profiles set role='pt' where id='${EVIL}'`)), 'role');
    assert.ok(await denied(() => q(`update public.profiles set pt_id='${PT}' where id='${EVIL}'`)), 'pt_id');
    assert.ok(await denied(() => q(`update public.profiles set invite_code='AAAAAAAA' where id='${EVIL}'`)), 'invite_code');
    assert.ok(await denied(() => q(`update public.profiles set email='x@y' where id='${EVIL}'`)), 'email');
    assert.equal(await affected(`update public.profiles set name='Nuovo' where id='${EVIL}'`), 1, 'il proprio nome sì');
    assert.equal(await affected(`update public.profiles set name='Hack' where id='${LUCA}'`), 0, 'nome di altri no');
  });
  const r = (await q(`select role from public.profiles where id='${EVIL}'`)).rows[0].role;
  assert.equal(r, 'client');
});

test('un falso PT (ruolo client) non può gestire nessuno', async () => {
  await as(EVIL, async () => {
    assert.equal(await q('select id from public.plans').then((x) => x.rows.length), 0);
    assert.equal(await affected(`update public.plans set name='Hack' where id='p-luca'`), 0);
    assert.ok(await denied(() => q(`insert into public.plans(id,owner_id,name) values ('z','${LUCA}','z')`)));
    assert.equal(await q('select * from public.sessions').then((x) => x.rows.length), 0);
    assert.equal((await q(`select public.join_pt('${'0'.repeat(8)}') as ok`)).rows[0].ok, false, 'codice sbagliato');
  });
});

test('il PT gestisce solo i propri atleti', async () => {
  await as(PT, async () => {
    const plans = (await q('select id from public.plans order by id')).rows.map((r) => r.id);
    assert.deepEqual(plans, ['p-luca', 'p-pt'], 'vede le schede di Luca e le proprie, non quelle di Anna');
    assert.equal(await affected(`update public.plans set name='Push B' where id='p-luca'`), 1, 'modifica scheda dell’atleta');
    assert.equal(await affected(`update public.plans set name='Hack' where id='p-anna'`), 0, 'non quella di Anna');
    assert.equal(await affected(`insert into public.plans(id,owner_id,name) values ('nuova','${LUCA}','Nuova')`), 1, 'crea scheda per il atleta');
    assert.ok(await denied(() => q(`insert into public.plans(id,owner_id,name) values ('nuova2','${ANNA}','No')`)), 'non per chi non è suo');
    assert.equal((await q('select * from public.sessions')).rows.length, 1, 'vede gli allenamenti di Luca');
    assert.ok(await denied(() => q(`insert into public.sessions(id,user_id,plan_name,date) values ('fake','${LUCA}','x', now())`)), 'non può inventare allenamenti');
    const clients = (await q(`select id from public.profiles where pt_id = '${PT}'`)).rows.map((r) => r.id);
    assert.deepEqual(clients, [LUCA]);
  });
  await as(PT2, async () => {
    assert.deepEqual((await q('select id from public.plans')).rows.map((r) => r.id), [], 'un altro PT non vede nulla di Luca');
    assert.equal(await affected(`update public.plans set name='Hack' where id='p-luca'`), 0);
    assert.equal(await affected(`delete from public.plans where id='p-luca'`), 0);
  });
});

test('"creata da" non è falsificabile', async () => {
  await as(PT, async () => {
    await q(`insert into public.plans(id,owner_id,name,created_by) values ('forged','${LUCA}','F','${LUCA}')`);
  });
  const r = (await q(`select created_by from public.plans where id='forged'`)).rows[0].created_by;
  assert.equal(r, PT);
});

test('una scheda non si può rubare cambiando proprietario né riusando un id altrui', async () => {
  await as(PT2, async () => {
    assert.equal(await affected(`update public.plans set owner_id='${PT2}' where id='p-luca'`), 0);
    assert.ok(await denied(() => q(`insert into public.plans(id,owner_id,name) values ('p-luca','${PT2}','Rubata') on conflict (id) do update set owner_id=excluded.owner_id`)));
  });
  assert.equal((await q(`select owner_id from public.plans where id='p-luca'`)).rows[0].owner_id, LUCA);
});

test('gli allenamenti: ognuno scrive solo i propri', async () => {
  await as(LUCA, async () => {
    assert.equal(await affected(`insert into public.sessions(id,user_id,plan_name,date) values ('s2','${LUCA}','Push', now())`), 1);
    assert.ok(await denied(() => q(`insert into public.sessions(id,user_id,plan_name,date) values ('s3','${ANNA}','x', now())`)));
    assert.equal(await affected(`delete from public.sessions where id='s2'`), 1);
  });
  await as(ANNA, async () => {
    assert.equal(await affected(`delete from public.sessions where id='s-luca'`), 0);
  });
});

test('collegarsi, scollegarsi e scollegare un atleta', async () => {
  const code = await as(PT, async () => (await q('select public.my_invite_code() as c')).rows[0].c as string);
  await as(ANNA, async () => {
    assert.equal((await q(`select public.join_pt('${code.toLowerCase()}') as ok`)).rows[0].ok, true, 'codice valido (anche minuscolo)');
  });
  assert.equal((await q(`select pt_id from public.profiles where id='${ANNA}'`)).rows[0].pt_id, PT);
  await as(PT2, async () => {
    await q(`select public.remove_client('${ANNA}')`);
  });
  assert.equal((await q(`select pt_id from public.profiles where id='${ANNA}'`)).rows[0].pt_id, PT, 'un altro PT non può scollegarla');
  await as(PT, async () => {
    await q(`select public.remove_client('${ANNA}')`);
  });
  assert.equal((await q(`select pt_id from public.profiles where id='${ANNA}'`)).rows[0].pt_id, null);
  await as(LUCA, async () => {
    await q('select public.leave_pt()');
  });
  assert.equal((await q(`select pt_id from public.profiles where id='${LUCA}'`)).rows[0].pt_id, null);
});

test('limiti di dimensione sui dati', async () => {
  await as(PT, async () => {
    assert.ok(await denied(() => q(`insert into public.plans(id,owner_id,name) values ('big','${PT}', repeat('x',500))`)), 'nome troppo lungo');
    assert.ok(await denied(() => q(`insert into public.plans(id,owner_id,name,exercises) values ('big2','${PT}','x', (select jsonb_agg(i) from generate_series(1,200) i))`)), 'troppi esercizi');
    assert.ok(await denied(() => q(`insert into public.plans(id,owner_id,name,exercises) values ('big3','${PT}','x','{"a":1}')`)), 'non è un elenco');
  });
});

test('tutte le tabelle hanno la sicurezza a livello di riga attiva', async () => {
  const r = await q(`select relname, relrowsecurity from pg_class where relnamespace='public'::regnamespace and relkind='r'`);
  for (const t of r.rows) assert.equal(t.relrowsecurity, true, `RLS spenta su ${t.relname}`);
});
