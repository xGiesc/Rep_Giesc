import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import type { DbExercise } from './exerciseDb';

/**
 * GIF di ExerciseDB (servizio esterno, caricate dal telefono quando si apre un esercizio).
 * Si disattiva con EXPO_PUBLIC_EXERCISEDB=off. Se la ricerca fallisce o non trova nulla,
 * l'app mostra la sua animazione schematica.
 */
export const GIF_ENABLED = process.env.EXPO_PUBLIC_EXERCISEDB !== 'off';
const BASE = process.env.EXPO_PUBLIC_EXERCISEDB_URL ?? 'https://oss.exercisedb.dev/api/v1';
const TIMEOUT_MS = 8000;

// movimento dell'app → nome inglese usato da ExerciseDB
const MOVE_EN: Record<string, string> = {
  biceps_curl: 'biceps curl',
  front_raise: 'front raise',
  triceps_pushdown: 'triceps pushdown',
  lying_triceps_ext: 'lying triceps extension',
  bench_press: 'bench press',
  incline_press: 'incline bench press',
  chest_press_machine: 'chest press',
  push_up: 'push up',
  overhead_press: 'shoulder press',
  squat: 'squat',
  squat_front: 'front squat',
  squat_hang: 'squat',
  good_morning: 'good morning',
  lunge: 'lunge',
  deadlift: 'deadlift',
  romanian_deadlift: 'romanian deadlift',
  hip_thrust: 'hip thrust',
  bent_row: 'bent over row',
  seated_row: 'seated row',
  lat_pulldown: 'lat pulldown',
  pull_up: 'pull up',
  calf_raise: 'calf raise',
  crunch: 'crunch',
  shrug: 'shrug',
  upright_row: 'upright row',
  leg_extension: 'leg extension',
  leg_curl: 'leg curl',
  leg_press: 'leg press',
  dips: 'dip',
  chest_fly: 'chest fly',
  triceps_overhead: 'triceps extension',
  back_extension: 'back extension',
  leg_raise: 'leg raise',
};

// attrezzo → prefisso nei nomi di ExerciseDB
const EQUIP_PREFIX: Record<string, string> = {
  barbell: 'barbell',
  dumbbell: 'dumbbell',
  cable: 'cable',
  machine: 'lever',
  kettlebells: 'kettlebell',
  bands: 'band',
  'e-z curl bar': 'ez barbell',
};

// parole del nome italiano che cambiano il significato
const NAME_HINTS: Array<[RegExp, string]> = [
  [/inclinat/, 'incline'],
  [/declinat/, 'decline'],
  [/presa stretta/, 'close grip'],
  [/multipower/, 'smith'],
  [/seduti|seduto/, 'seated'],
  [/alternat/, 'alternate'],
  [/martello/, 'hammer'],
  [/concentrat/, 'concentration'],
  [/scott|predicatore/, 'preacher'],
  [/bulgar/, 'bulgarian split squat'],
  [/goblet/, 'goblet'],
  [/sumo/, 'sumo'],
];

/** Testo di ricerca in inglese per un esercizio del catalogo. */
export function gifQuery(ex: { name: string; movement: string; equipment?: string | null }): string {
  const hints = NAME_HINTS.filter(([re]) => re.test(ex.name.toLowerCase())).map(([, w]) => w);
  const base = MOVE_EN[ex.movement] ?? '';
  const prefix = ex.equipment ? (EQUIP_PREFIX[ex.equipment] ?? '') : '';
  const seen = new Set<string>();
  return [prefix, ...hints, base]
    .join(' ')
    .split(/\s+/)
    .filter((w) => w && !seen.has(w) && seen.add(w))
    .join(' ');
}

type Cand = { name?: string; gifUrl?: string; equipments?: string[] };

/** Trova la prima lista di esercizi dentro la risposta, qualunque sia la forma. */
export function extractList(json: unknown, depth = 0): Cand[] {
  if (depth > 4 || json == null) return [];
  if (Array.isArray(json)) {
    return json.some((x) => x && typeof x === 'object' && 'gifUrl' in (x as object)) ? (json as Cand[]) : [];
  }
  if (typeof json === 'object') {
    for (const v of Object.values(json as Record<string, unknown>)) {
      const r = extractList(v, depth + 1);
      if (r.length) return r;
    }
  }
  return [];
}

const words = (s: string) => s.toLowerCase().split(/[^a-z]+/).filter(Boolean);

/** Sceglie il risultato che assomiglia di più alla ricerca (parole in comune, stesso attrezzo). */
export function pickBest(list: Cand[], query: string, equipment?: string | null): Cand | null {
  const q = new Set(words(query));
  const eqWord = equipment ? (EQUIP_PREFIX[equipment] ?? '') : '';
  let best: Cand | null = null;
  let bestScore = 0;
  for (const c of list) {
    if (!c.gifUrl || !c.name) continue;
    const w = words(c.name);
    const common = w.filter((x) => q.has(x)).length;
    if (common === 0) continue;
    const extra = w.length - common; // parole in più nel nome: penalizza
    let score = common * 3 - extra;
    if (eqWord && w.includes(eqWord.split(' ')[0])) score += 3;
    if (!eqWord && !(c.equipments ?? []).some((e) => /body weight/i.test(e)) && c.equipments?.length) score -= 2;
    if (score > bestScore) {
      best = c;
      bestScore = score;
    }
  }
  return best;
}

async function getJson(url: string): Promise<unknown> {
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const t = setTimeout(() => ctl?.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctl?.signal });
    if (!res.ok) return null;
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export async function findGif(query: string, equipment?: string | null): Promise<string | null> {
  const key = `gif:${query}|${equipment ?? ''}`;
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) return cached;
  } catch {
    /* niente cache */
  }
  const q = encodeURIComponent(query);
  for (const url of [`${BASE}/exercises?search=${q}&limit=12`, `${BASE}/exercises/search?q=${q}&limit=12`]) {
    try {
      const best = pickBest(extractList(await getJson(url)), query, equipment);
      if (best?.gifUrl) {
        AsyncStorage.setItem(key, best.gifUrl).catch(() => {});
        return best.gifUrl;
      }
    } catch {
      /* si prova l'indirizzo successivo */
    }
  }
  return null;
}

export type GifState = { url: string | null; loading: boolean };

/** GIF di ExerciseDB per un esercizio (null = non trovata: si usa l'animazione dell'app). */
export function useExerciseGif(ex: DbExercise | null, movement?: string): GifState {
  const q = ex ? gifQuery({ name: ex.name, movement: ex.movement, equipment: ex.equipment }) : movement ? gifQuery({ name: '', movement }) : '';
  const equipment = ex?.equipment ?? null;
  const [state, setState] = useState<GifState>({ url: null, loading: GIF_ENABLED && !!q });
  useEffect(() => {
    if (!GIF_ENABLED || !q) return setState({ url: null, loading: false });
    let alive = true;
    setState({ url: null, loading: true });
    findGif(q, equipment).then((url) => alive && setState({ url, loading: false }));
    return () => {
      alive = false;
    };
  }, [q, equipment]);
  return state;
}
