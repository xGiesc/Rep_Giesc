import { daysLeft } from './expiry';
import { Plan, Session } from './types';

export type Cycle = {
  /** Scheda prevista per il prossimo allenamento (null se non ce ne sono). */
  next: Plan | null;
  /** Ancora da fare nel giro corrente (la prima è la prevista). */
  todo: Plan[];
  /** Eseguite almeno una volta, più quelle scadute (anche se tornano tra le "da fare" al nuovo giro). */
  done: Plan[];
  /** Schede scadute (sono comprese in `done`). */
  expired: Plan[];
};

const isExpired = (p: Plan) => !!p.expiresAt && daysLeft(p.expiresAt) < 0;

/**
 * Le schede attive (non scadute, con esercizi) si fanno a rotazione, nell'ordine in cui
 * sono elencate. Quando le hai fatte tutte, il giro ricomincia. Le scadute vanno tra le "eseguite".
 */
export function cycleState(plans: Plan[], history: Session[]): Cycle {
  const expired = plans.filter(isExpired);
  const active = plans.filter((p) => !isExpired(p) && p.exercises.length > 0);
  const ids = new Set(active.map((p) => p.id));
  const seen = new Set<string>();
  const ordered = [...history].sort((a, b) => a.date.localeCompare(b.date));
  for (const s of ordered) {
    if (!s.planId || !ids.has(s.planId)) continue;
    seen.add(s.planId);
    if (seen.size === active.length) seen.clear();
  }
  const todo = active.filter((p) => !seen.has(p.id));
  const everDone = new Set(history.map((h) => h.planId).filter(Boolean));
  const doneEver = active.filter((p) => everDone.has(p.id));
  const empties = plans.filter((p) => !isExpired(p) && p.exercises.length === 0);
  return { next: todo[0] ?? null, todo: [...todo, ...empties], done: [...doneEver, ...expired], expired };
}
