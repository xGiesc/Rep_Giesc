import { CATALOG, CatalogExercise } from './catalog';

/**
 * Elenco esercizi dell'app: nomi, muscoli e istruzioni in italiano, ognuno con
 * la sua animazione (vedi catalog.ts). Funziona anche offline.
 */
export type DbExercise = CatalogExercise;

export const EXERCISES: DbExercise[] = CATALOG;

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));
const norm = (t: string) => t.trim().toLowerCase();
const BY_NAME = new Map(EXERCISES.map((e) => [norm(e.name), e]));

/** Trova per id; se manca prova con il nome esatto (schede create a mano). */
export function findExercise(dbId?: string, name?: string) {
  if (dbId && BY_ID.has(dbId)) return BY_ID.get(dbId);
  if (name) return BY_NAME.get(norm(name));
  return undefined;
}

// ---- Etichette in italiano -------------------------------------------------

export const MUSCLE_IT: Record<string, string> = {
  chest: 'Petto',
  lats: 'Dorsali',
  'middle back': 'Dorso',
  'lower back': 'Lombari',
  traps: 'Trapezi',
  shoulders: 'Spalle',
  biceps: 'Bicipiti',
  triceps: 'Tricipiti',
  forearms: 'Avambracci',
  abdominals: 'Addominali',
  quadriceps: 'Quadricipiti',
  hamstrings: 'Femorali',
  glutes: 'Glutei',
  calves: 'Polpacci',
  adductors: 'Adduttori',
  abductors: 'Abduttori',
  neck: 'Collo',
};

export const EQUIPMENT_IT: Record<string, string> = {
  barbell: 'Bilanciere',
  dumbbell: 'Manubri',
  'body only': 'Corpo libero',
  cable: 'Cavi',
  machine: 'Macchina / multipower',
  kettlebells: 'Kettlebell',
  bands: 'Elastici',
  'medicine ball': 'Palla medica',
  'exercise ball': 'Fitball',
  'foam roll': 'Foam roller',
  'e-z curl bar': 'Barra EZ',
  other: 'Altro',
};

export const LEVEL_IT: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  expert: 'Esperto',
};

export const muscleLabel = (m: string) => MUSCLE_IT[m] ?? m;
export const equipmentLabel = (e: string | null) =>
  e ? (EQUIPMENT_IT[e] ?? e) : 'Nessun attrezzo';

// Ordine di visualizzazione dei filtri
export const MUSCLE_FILTERS = Object.keys(MUSCLE_IT);
export const EQUIPMENT_FILTERS = [
  'barbell',
  'dumbbell',
  'body only',
  'cable',
  'machine',
  'kettlebells',
];

export function searchExercises(
  query: string,
  muscle: string | null,
  equipment: string | null,
) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return EXERCISES.filter((e) => {
    if (muscle && !e.primaryMuscles.includes(muscle)) return false;
    if (equipment && e.equipment !== equipment) return false;
    if (words.length === 0) return true;
    const hay = norm(e.name);
    return words.every((w) => hay.includes(w));
  });
}
