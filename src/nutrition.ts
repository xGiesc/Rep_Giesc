import type { Food } from './foodsBase';

export type MealKey = 'colazione' | 'pranzo' | 'cena' | 'spuntino';
export const MEALS: Array<{ key: MealKey; label: string }> = [
  { key: 'colazione', label: 'Colazione' },
  { key: 'pranzo', label: 'Pranzo' },
  { key: 'cena', label: 'Cena' },
  { key: 'spuntino', label: 'Spuntini' },
];

/** Una voce del diario: l'alimento (valori per 100 g) e i grammi mangiati. */
export type Entry = {
  id: string;
  meal: MealKey;
  name: string;
  brand?: string;
  grams: number;
  kcal: number; // per 100 g
  p: number;
  c: number;
  f: number;
};

export type Macros = { kcal: number; p: number; c: number; f: number };
export const ZERO: Macros = { kcal: 0, p: 0, c: 0, f: 0 };

export type Activity = 'sedentary' | 'light' | 'moderate' | 'high' | 'athlete';
export type Aim = 'lose' | 'maintain' | 'gain';

export type NutritionProfile = {
  sex: 'm' | 'f';
  age: number;
  weight: number; // kg
  height: number; // cm
  activity: Activity;
  aim: Aim;
};

export type Goals = {
  kcal: number;
  p: number;
  c: number;
  f: number;
  /** Chi ha impostato i valori: l'atleta (calcolo/manuale) o il personal trainer. */
  by: 'self' | 'pt';
  profile?: NutritionProfile;
};

export const ACTIVITY: Array<{ key: Activity; label: string; mult: number }> = [
  { key: 'sedentary', label: 'Sedentario', mult: 1.2 },
  { key: 'light', label: 'Leggero (1-3 allenamenti)', mult: 1.375 },
  { key: 'moderate', label: 'Moderato (3-5 allenamenti)', mult: 1.55 },
  { key: 'high', label: 'Alto (6-7 allenamenti)', mult: 1.725 },
  { key: 'athlete', label: 'Molto alto (lavoro fisico)', mult: 1.9 },
];
export const AIMS: Array<{ key: Aim; label: string; delta: number }> = [
  { key: 'lose', label: 'Dimagrire', delta: -0.15 },
  { key: 'maintain', label: 'Mantenere', delta: 0 },
  { key: 'gain', label: 'Massa', delta: 0.1 },
];

const round = (n: number) => Math.round(n);
export const r1 = (n: number) => Math.round(n * 10) / 10;

/** Metabolismo basale (Mifflin-St Jeor). */
export function bmr(p: NutritionProfile): number {
  return 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === 'm' ? 5 : -161);
}

/** Calorie e macro suggeriti dal profilo: proteine 1,8 g/kg, grassi 25% delle kcal, resto carboidrati. */
export function suggestGoals(p: NutritionProfile): Omit<Goals, 'by'> {
  const mult = ACTIVITY.find((a) => a.key === p.activity)?.mult ?? 1.375;
  const delta = AIMS.find((a) => a.key === p.aim)?.delta ?? 0;
  const kcal = round((bmr(p) * mult * (1 + delta)) / 10) * 10;
  const protein = round(p.weight * (p.aim === 'lose' ? 2 : 1.8));
  const fat = round((kcal * 0.25) / 9);
  const carbs = Math.max(0, round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, p: protein, c: carbs, f: fat, profile: p };
}

export const validProfile = (p: Partial<NutritionProfile>): p is NutritionProfile =>
  (p.sex === 'm' || p.sex === 'f') &&
  typeof p.age === 'number' && p.age >= 14 && p.age <= 100 &&
  typeof p.weight === 'number' && p.weight >= 30 && p.weight <= 300 &&
  typeof p.height === 'number' && p.height >= 120 && p.height <= 230 &&
  !!p.activity && !!p.aim;

/** Valori di una voce in base ai grammi. */
export function entryMacros(e: Pick<Entry, 'grams' | 'kcal' | 'p' | 'c' | 'f'>): Macros {
  const k = e.grams / 100;
  return { kcal: e.kcal * k, p: e.p * k, c: e.c * k, f: e.f * k };
}

export function sumMacros(list: Array<Pick<Entry, 'grams' | 'kcal' | 'p' | 'c' | 'f'>>): Macros {
  return list.reduce(
    (a, e) => {
      const m = entryMacros(e);
      return { kcal: a.kcal + m.kcal, p: a.p + m.p, c: a.c + m.c, f: a.f + m.f };
    },
    { ...ZERO },
  );
}

export const foodToEntry = (food: Food, grams: number, meal: MealKey, id: string): Entry => ({
  id, meal, name: food.name, brand: food.brand, grams, kcal: food.kcal, p: food.p, c: food.c, f: food.f,
});

/** Data locale AAAA-MM-GG. */
export function dayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function shiftDay(key: string, delta: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + delta));
}
const MONTHS = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
const WEEKDAYS = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
export function dayLabel(key: string): string {
  const today = dayKey();
  if (key === today) return 'Oggi';
  if (key === shiftDay(today, -1)) return 'Ieri';
  if (key === shiftDay(today, 1)) return 'Domani';
  const [y, m, d] = key.split('-').map(Number);
  const w = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${w.slice(0, 3)} ${d} ${MONTHS[m - 1]}`;
}

/** Numero da testo digitato (accetta la virgola). */
export function num(s: string): number {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

// ───────────────────────── Open Food Facts ─────────────────────────
type OffProduct = {
  code?: string;
  product_name?: string;
  product_name_it?: string;
  brands?: string;
  serving_quantity?: number | string;
  nutriments?: Record<string, unknown>;
};

const n100 = (nu: Record<string, unknown>, k: string): number | null => {
  const v = nu[`${k}_100g`];
  const x = typeof v === 'string' ? parseFloat(v) : v;
  return typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : null;
};

/** Converte un prodotto Open Food Facts; null se mancano i dati di base. */
export function parseOffProduct(p: OffProduct): Food | null {
  const name = (p.product_name_it || p.product_name || '').trim();
  const nu = p.nutriments;
  if (!name || !nu) return null;
  let kcal = n100(nu, 'energy-kcal');
  if (kcal === null) {
    const kj = n100(nu, 'energy');
    if (kj !== null) kcal = kj / 4.184;
  }
  const prot = n100(nu, 'proteins');
  const carb = n100(nu, 'carbohydrates');
  const fat = n100(nu, 'fat');
  if (kcal === null || kcal > 950 || prot === null || carb === null || fat === null) return null;
  const sv = typeof p.serving_quantity === 'string' ? parseFloat(p.serving_quantity) : p.serving_quantity;
  return {
    id: 'off:' + (p.code || name),
    name: name.slice(0, 80),
    brand: (p.brands || '').split(',')[0].trim().slice(0, 40) || undefined,
    kcal: r1(kcal), p: r1(prot), c: r1(carb), f: r1(fat),
    serving: typeof sv === 'number' && sv > 0 && sv < 1000 ? sv : undefined,
  };
}

const OFF = 'https://world.openfoodfacts.org';
const FIELDS = 'code,product_name,product_name_it,brands,nutriments,serving_quantity';

export async function searchOff(query: string, signal?: AbortSignal): Promise<Food[]> {
  const url = `${OFF}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=25&lc=it&fields=${FIELDS}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('offline');
  const data = (await res.json()) as { products?: OffProduct[] };
  return (data.products ?? []).map(parseOffProduct).filter((x): x is Food => !!x);
}

export async function lookupBarcode(code: string, signal?: AbortSignal): Promise<Food | null> {
  const res = await fetch(`${OFF}/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`, { signal });
  if (!res.ok) throw new Error('offline');
  const data = (await res.json()) as { status?: number; product?: OffProduct };
  return data.status === 1 && data.product ? parseOffProduct({ ...data.product, code }) : null;
}
