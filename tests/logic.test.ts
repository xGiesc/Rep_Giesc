import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildFrame } from '../src/anim/engine';
import { animationForName } from '../src/anim/mapping';
import { PATTERNS } from '../src/anim/patterns';
import { CATALOG, MOVEMENT_MUSCLES, MOVEMENT_STEPS } from '../src/catalog';
import { daysLeft, expiryInfo, inWeeks, toIsoDate } from '../src/expiry';
import { findExercise, searchExercises } from '../src/exerciseDb';
import { KNOWN_MUSCLES } from '../src/anim/engine';
import { existsSync } from 'node:fs';
import { GIF_BY_EXERCISE, GIF_BY_MOVEMENT } from '../src/exerciseGifs';

test('catalogo: id unici, nomi e istruzioni presenti', () => {
  const ids = new Set(CATALOG.map((e) => e.id));
  assert.equal(ids.size, CATALOG.length, 'id duplicati');
  const names = new Set(CATALOG.map((e) => e.name.toLowerCase()));
  assert.equal(names.size, CATALOG.length, 'nomi duplicati');
  for (const e of CATALOG) {
    assert.ok(e.name.trim().length > 3, e.id);
    assert.ok(e.instructions.length >= 4, `${e.id}: istruzioni`);
    assert.ok(e.primaryMuscles.length > 0, `${e.id}: muscoli`);
  }
});

test('ogni esercizio ha un movimento animato e muscoli noti', () => {
  for (const e of CATALOG) {
    assert.ok(PATTERNS[e.movement] || GIF_BY_EXERCISE[e.id], `${e.id}: né animazione né GIF`);
    assert.ok(MOVEMENT_STEPS[e.movement], `${e.movement}: istruzioni di base`);
    assert.ok(MOVEMENT_MUSCLES[e.movement], `${e.movement}: muscoli di base`);
    for (const m of [...e.primaryMuscles, ...e.secondaryMuscles]) assert.ok(KNOWN_MUSCLES.includes(m), `${e.id}: muscolo ${m}`);
  }
});

test('animazioni: ogni fotogramma è valido (niente NaN, tutto nel riquadro)', () => {
  for (const [id, p] of Object.entries(PATTERNS)) {
    for (const impl of ['barbell', 'dumbbell', 'kettlebell', 'cable', 'none'] as const) {
      for (let s = 0; s <= 1; s += 0.125) {
        const { shapes, vb } = buildFrame(p, s, impl, ['chest', 'biceps'], ['triceps']);
        assert.ok(shapes.length > 30, `${id}: forme`);
        assert.ok(vb.every(Number.isFinite) && vb[2] > 50 && vb[3] > 40, `${id}: riquadro`);
        const [x0, y0, w, h] = vb;
        for (const sh of shapes) {
          const nums =
            sh.k === 'line' ? [sh.x1, sh.y1, sh.x2, sh.y2] : sh.k === 'circle' || sh.k === 'ellipse' ? [sh.cx, sh.cy] : (sh.d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
          assert.ok(nums.length > 0, `${id}: forma vuota`);
          nums.forEach((n, i) => {
            assert.ok(Number.isFinite(n), `${id} ${impl} ${s}: valore non valido`);
            const lo = i % 2 === 0 ? x0 : y0;
            const size = i % 2 === 0 ? w : h;
            // il pavimento/ombra può uscire un po' dal riquadro, tutto il resto no
            assert.ok(n > lo - size * 0.6 && n < lo + size * 1.6, `${id} ${impl} ${s}: forma lontana dal riquadro (${n})`);
          });
        }
      }
    }
  }
});

test('movimenti diversi a inizio e fine (l’animazione si muove davvero)', () => {
  for (const [id, p] of Object.entries(PATTERNS)) {
    const a = JSON.stringify(buildFrame(p, 0, 'none', [], []).shapes);
    const b = JSON.stringify(buildFrame(p, 1, 'none', [], []).shapes);
    assert.notEqual(a, b, `${id}: fermo`);
  }
});

test('ricerca e nomi', () => {
  assert.ok(findExercise('panca-piana-bilanciere'));
  assert.equal(findExercise(undefined, '  Panca piana con bilanciere ')?.id, 'panca-piana-bilanciere');
  assert.ok(searchExercises('squat', null, null).length >= 5);
  assert.ok(searchExercises('', 'quadriceps', null).every((e) => e.primaryMuscles.includes('quadriceps')));
});

test('nomi personalizzati in italiano riconosciuti', () => {
  const cases: Array<[string, string]> = [
    ['Panca piana', 'bench_press'],
    ['panca inclinata manubri', 'incline_press'],
    ['Lat machine', 'lat_pulldown'],
    ['Stacco rumeno', 'romanian_deadlift'],
    ['Leg press', 'leg_press'],
    ['Trazioni', 'pull_up'],
    ['Curl manubri', 'biceps_curl'],
  ];
  for (const [name, pattern] of cases) assert.equal(animationForName(name)?.pattern, pattern, name);
  assert.equal(animationForName('Yoga del mattino'), null);
});

test('scadenze: date e messaggi', () => {
  assert.equal(expiryInfo(undefined), null);
  assert.equal(daysLeft(inWeeks(4)), 28);
  assert.equal(expiryInfo(inWeeks(4))?.tone, 'ok');
  assert.equal(expiryInfo(inWeeks(1))?.tone, 'soon');
  assert.equal(expiryInfo(toIsoDate(new Date(2020, 0, 1)))?.tone, 'expired');
  assert.equal(expiryInfo(toIsoDate(new Date()))?.text, 'Scade oggi');
});

test('rotazione schede: prevista, giro, scadute', async () => {
  const { cycleState } = await import('../src/rotation');
  const ex = [{ id: 'e', name: 'x', sets: 1, reps: 1 }];
  const A = { id: 'A', name: 'A', exercises: ex };
  const B = { id: 'B', name: 'B', exercises: ex };
  const C = { id: 'C', name: 'C', exercises: ex, expiresAt: '2000-01-01' };
  const s = (planId: string, date: string) => ({ id: date, planName: planId, planId, date, exercises: [] });
  assert.equal(cycleState([A, B, C], []).next?.id, 'A');
  const c1 = cycleState([A, B, C], [s('A', '2026-01-01')]);
  assert.equal(c1.next?.id, 'B');
  assert.deepEqual(c1.done.map((p) => p.id), ['A', 'C'], 'fatta + scaduta');
  const c2 = cycleState([A, B, C], [s('A', '2026-01-01'), s('B', '2026-01-03')]);
  assert.equal(c2.next?.id, 'A', 'giro completo: si ricomincia');
  assert.deepEqual(c2.done.map((p) => p.id), ['A', 'B', 'C'], 'le eseguite restano consultabili');
  assert.equal(cycleState([C], []).next, null);
  assert.equal(cycleState([], []).next, null);
});

test('notifiche atleta e coach', async () => {
  const { athleteNotifications, coachNotifications } = await import('../src/notifications');
  const { toIsoDate } = await import('../src/expiry');
  const day = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return toIsoDate(d); };
  const ex = [{ id: 'e', name: 'x', sets: 1, reps: 1 }];
  const a = athleteNotifications(
    [
      { id: 'P1', name: 'Push', exercises: ex, byPt: true, createdAt: new Date().toISOString(), expiresAt: day(3) },
      { id: 'P2', name: 'Pull', exercises: ex, byPt: true, createdAt: '2020-01-01T00:00:00Z', expiresAt: day(-2) },
      { id: 'P3', name: 'Leg', exercises: ex, createdAt: new Date().toISOString(), expiresAt: day(40) },
    ],
    [{ id: 's', planName: 'Push', planId: 'P1', date: new Date(Date.now() - 10 * 86400000).toISOString(), exercises: [] }],
  );
  const kinds = a.map((n) => n.kind).sort();
  assert.deepEqual(kinds, ['inactive', 'plan_expired', 'plan_new', 'plan_soon']);
  assert.ok(new Set(a.map((n) => n.id)).size === a.length, 'id unici');
  assert.equal(a[0].kind, 'plan_expired', 'le scadute vengono prima');

  const c = coachNotifications({
    clients: [{ id: 'u1', name: 'Luca', email: null }, { id: 'u2', name: 'Anna', email: null }],
    plans: [{ id: 'P1', name: 'Push', owner_id: 'u1', expires_at: day(2) }],
    sessions: [{ id: 'S1', user_id: 'u1', plan_name: 'Push', date: new Date().toISOString() }],
  });
  assert.deepEqual(c.map((n) => n.kind).sort(), ['no_plan', 'plan_soon', 'workout_done']);
  assert.equal(c.find((n) => n.kind === 'no_plan')!.athleteId, 'u2');
});

test('GIF della libreria: i file esistono e quasi tutto il catalogo ne ha una', () => {
  for (const f of [...Object.values(GIF_BY_EXERCISE), ...Object.values(GIF_BY_MOVEMENT)]) {
    assert.ok(existsSync(`public/gifs/${f}`), `GIF mancante: ${f}`);
  }
  for (const id of Object.keys(GIF_BY_EXERCISE)) assert.ok(findExercise(id), `esercizio sconosciuto: ${id}`);
  const without = CATALOG.filter((e) => !GIF_BY_EXERCISE[e.id] && !GIF_BY_MOVEMENT[e.movement]);
  assert.deepEqual(without.map((e) => e.id), ['iperestensioni']);
});
