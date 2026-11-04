export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
};

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
