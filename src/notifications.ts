import { daysLeft, fmtDate } from './expiry';
import { Plan, Session } from './types';

export type NotifKind = 'plan_new' | 'plan_soon' | 'plan_expired' | 'inactive' | 'workout_done' | 'no_plan';

export type Notif = {
  /** Stabile nel tempo: serve a ricordare quali sono già state lette. */
  id: string;
  kind: NotifKind;
  title: string;
  text: string;
  /** Data dell'evento (ISO), per l'ordinamento. */
  at: string;
  athleteId?: string;
};

const SOON_DAYS = 7;
const INACTIVE_DAYS = 7;
const NEW_PLAN_DAYS = 30;
const DONE_DAYS = 3;
const DAY = 86400000;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
export const daysSince = (iso: string, now: Date) => Math.round((startOfDay(now) - startOfDay(new Date(iso))) / DAY);
const isActive = (p: Plan | { expiresAt?: string; exercisesCount: number }) =>
  ('exercisesCount' in p ? p.exercisesCount : (p as Plan).exercises.length) > 0 && !(p.expiresAt && daysLeft(p.expiresAt) < 0);

function expiryText(iso: string) {
  const d = daysLeft(iso);
  return d === 0 ? 'scade oggi' : d === 1 ? 'scade domani' : `scade tra ${d} giorni`;
}

/** Notifiche dell'atleta: scheda ricevuta, in scadenza/scaduta, promemoria allenamento. */
export function athleteNotifications(plans: Plan[], history: Session[], now = new Date()): Notif[] {
  const out: Notif[] = [];
  for (const p of plans) {
    if (p.byPt && p.createdAt && daysSince(p.createdAt, now) <= NEW_PLAN_DAYS) {
      out.push({ id: `new:${p.id}`, kind: 'plan_new', title: 'Nuova scheda ricevuta', text: `Il tuo personal trainer ti ha assegnato “${p.name}”.`, at: p.createdAt });
    }
    if (p.expiresAt) {
      const d = daysLeft(p.expiresAt);
      if (d < 0) {
        out.push({ id: `expired:${p.id}:${p.expiresAt}`, kind: 'plan_expired', title: 'Scheda scaduta', text: `“${p.name}” è scaduta il ${fmtDate(p.expiresAt)}. Contatta il tuo personal trainer per rinnovarla.`, at: p.expiresAt });
      } else if (d <= SOON_DAYS) {
        out.push({ id: `soon:${p.id}:${p.expiresAt}`, kind: 'plan_soon', title: 'Scheda in scadenza', text: `“${p.name}” ${expiryText(p.expiresAt)} (${fmtDate(p.expiresAt)}).`, at: p.expiresAt });
      }
    }
  }
  const active = plans.filter((p) => isActive(p));
  const last = [...history].sort((a, b) => b.date.localeCompare(a.date))[0];
  if (active.length) {
    if (last && daysSince(last.date, now) >= INACTIVE_DAYS) {
      out.push({ id: `inactive:${last.date}`, kind: 'inactive', title: 'È ora di allenarsi', text: `Non ti alleni da ${daysSince(last.date, now)} giorni.`, at: now.toISOString() });
    } else if (!last) {
      const oldest = active.map((p) => p.createdAt).filter((x): x is string => !!x).sort()[0];
      if (oldest && daysSince(oldest, now) >= INACTIVE_DAYS) {
        out.push({ id: 'inactive:never', kind: 'inactive', title: 'Inizia ad allenarti', text: 'Hai una scheda pronta ma non hai ancora fatto nessun allenamento.', at: now.toISOString() });
      }
    }
  }
  return sortNotifs(out);
}

export type CoachData = {
  clients: Array<{ id: string; name: string; email: string | null }>;
  plans: Array<{ id: string; name: string; owner_id: string; expires_at: string | null; created_at?: string; exercises?: unknown[] }>;
  sessions: Array<{ id: string; user_id: string; plan_name: string; date: string }>;
};

/** Notifiche del coach: schede in scadenza/scadute, atleti fermi, allenamenti completati, atleti senza schede. */
export function coachNotifications(data: CoachData, now = new Date()): Notif[] {
  const out: Notif[] = [];
  for (const c of data.clients) {
    const who = c.name || c.email || 'Atleta';
    const plans = data.plans.filter((p) => p.owner_id === c.id);
    const sessions = data.sessions.filter((s) => s.user_id === c.id).sort((a, b) => b.date.localeCompare(a.date));
    if (plans.length === 0) {
      out.push({ id: `noplan:${c.id}`, kind: 'no_plan', athleteId: c.id, title: 'Atleta senza schede', text: `${who} non ha ancora nessuna scheda.`, at: now.toISOString() });
    }
    for (const p of plans) {
      if (!p.expires_at) continue;
      const d = daysLeft(p.expires_at);
      if (d < 0) {
        out.push({ id: `expired:${p.id}:${p.expires_at}`, kind: 'plan_expired', athleteId: c.id, title: 'Scheda scaduta', text: `${who}: “${p.name}” è scaduta il ${fmtDate(p.expires_at)}. È il momento del controllo.`, at: p.expires_at });
      } else if (d <= SOON_DAYS) {
        out.push({ id: `soon:${p.id}:${p.expires_at}`, kind: 'plan_soon', athleteId: c.id, title: 'Scheda in scadenza', text: `${who}: “${p.name}” ${expiryText(p.expires_at)} (${fmtDate(p.expires_at)}).`, at: p.expires_at });
      }
    }
    const hasActive = plans.some((p) => (p.exercises ? p.exercises.length > 0 : true) && !(p.expires_at && daysLeft(p.expires_at) < 0));
    if (hasActive && sessions[0] && daysSince(sessions[0].date, now) >= INACTIVE_DAYS) {
      out.push({ id: `inactive:${c.id}:${sessions[0].date}`, kind: 'inactive', athleteId: c.id, title: 'Atleta fermo', text: `${who} non si allena da ${daysSince(sessions[0].date, now)} giorni.`, at: now.toISOString() });
    }
    for (const s of sessions) {
      if (daysSince(s.date, now) <= DONE_DAYS) {
        out.push({ id: `done:${s.id}`, kind: 'workout_done', athleteId: c.id, title: 'Allenamento completato', text: `${who} ha completato “${s.plan_name}”.`, at: s.date });
      }
    }
  }
  return sortNotifs(out);
}

const PRIORITY: Record<NotifKind, number> = { plan_expired: 0, plan_soon: 1, no_plan: 2, inactive: 3, plan_new: 4, workout_done: 5 };

function sortNotifs(list: Notif[]) {
  return list.sort((a, b) => PRIORITY[a.kind] - PRIORITY[b.kind] || b.at.localeCompare(a.at));
}
