import raw from './data/exercises.json';

/**
 * Database esercizi: "Free Exercise DB" (github.com/yuhonas/free-exercise-db),
 * pubblico dominio. Dati inclusi nell'app (funzionano anche offline); le
 * immagini vengono caricate da GitHub.
 */
export type DbExercise = {
  id: string;
  name: string;
  equipment: string | null;
  level: string | null;
  category: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  images: number;
};

export const EXERCISES = raw as DbExercise[];

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));
const BY_NAME = new Map(EXERCISES.map((e) => [e.name.toLowerCase(), e]));

/** Trova per id; se manca prova con il nome esatto (schede create a mano). */
export function findExercise(dbId?: string, name?: string) {
  if (dbId && BY_ID.has(dbId)) return BY_ID.get(dbId);
  if (name) return BY_NAME.get(name.trim().toLowerCase());
  return undefined;
}

const IMAGE_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

export const imageUrl = (id: string, index: number) =>
  `${IMAGE_BASE}/${encodeURIComponent(id)}/${index}.jpg`;


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
  machine: 'Macchina',
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
  'bands',
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
    const hay = e.name.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}
