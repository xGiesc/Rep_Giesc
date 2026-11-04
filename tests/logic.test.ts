import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildFrame, VIEW } from '../src/anim/engine';
import { animationForName } from '../src/anim/mapping';
import { PATTERNS } from '../src/anim/patterns';
import { CATALOG, MOVEMENT_MUSCLES, MOVEMENT_STEPS } from '../src/catalog';
import { daysLeft, expiryInfo, inWeeks, toIsoDate } from '../src/expiry';
import { findExercise, searchExercises } from '../src/exerciseDb';
import { KNOWN_MUSCLES } from '../src/anim/engine';

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
    assert.ok(PATTERNS[e.movement], `${e.id}: movimento "${e.movement}" mancante`);
    assert.ok(MOVEMENT_STEPS[e.movement], `${e.movement}: istruzioni di base`);
    assert.ok(MOVEMENT_MUSCLES[e.movement], `${e.movement}: muscoli di base`);
    for (const m of [...e.primaryMuscles, ...e.secondaryMuscles]) assert.ok(KNOWN_MUSCLES.includes(m), `${e.id}: muscolo ${m}`);
  }
});

test('animazioni: ogni fotogramma è valido (niente NaN, tutto nel riquadro)', () => {
  for (const [id, p] of Object.entries(PATTERNS)) {
    for (const impl of ['barbell', 'dumbbell', 'kettlebell', 'cable', 'none'] as const) {
      for (let s = 0; s <= 1; s += 0.125) {
        const shapes = buildFrame(p, s, impl, ['chest', 'biceps'], ['triceps']);
        assert.ok(shapes.length > 8, `${id}: forme`);
        for (const sh of shapes) {
          const nums = sh.k === 'line' ? [sh.x1, sh.y1, sh.x2, sh.y2] : sh.k === 'circle' ? [sh.cx, sh.cy] : sh.k === 'rect' ? [sh.x, sh.y] : sh.pts.flat();
          for (const n of nums) {
            assert.ok(Number.isFinite(n), `${id} ${impl} ${s}: valore non valido`);
            assert.ok(n > -40 && n < VIEW.w + 40, `${id} ${impl} ${s}: forma fuori dal riquadro (${n})`);
          }
        }
      }
    }
  }
});

test('movimenti diversi a inizio e fine (l’animazione si muove davvero)', () => {
  for (const [id, p] of Object.entries(PATTERNS)) {
    const a = JSON.stringify(buildFrame(p, 0, 'none', [], []));
    const b = JSON.stringify(buildFrame(p, 1, 'none', [], []));
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
