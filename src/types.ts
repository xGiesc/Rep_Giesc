export const DEFAULT_REST = 90;

export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  /** Recupero tra le serie, in secondi (assente nelle schede vecchie → 90). */
  rest?: number;
  /** Id dell'esercizio nel database incluso (immagini, istruzioni). */
  dbId?: string;
};

export const restOf = (e: Exercise) =>
  typeof e.rest === 'number' && e.rest >= 0 ? e.rest : DEFAULT_REST;

export type Plan = {
  id: string;
  name: string;
  exercises: Exercise[];
};

export type SetLog = {
  kg: number;
  reps: number;
};

export type SessionExercise = {
  name: string;
  sets: SetLog[];
};

export type Session = {
  id: string;
  planName: string;
  date: string; // ISO
  exercises: SessionExercise[];
};

export const newId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
