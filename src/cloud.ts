import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Plan, Session } from './types';

export type Profile = {
  id: string;
  email: string | null;
  name: string;
  role: 'client' | 'pt';
  invite_code: string;
  pt_id: string | null;
};

const db = () => {
  if (!supabase) throw new Error('Cloud non configurato');
  return supabase;
};

const PROFILE_COLS = 'id,email,name,role,pt_id';

/** Il codice invito non è leggibile dalla tabella: lo dà solo la funzione my_invite_code() al PT stesso. */
export async function fetchProfile(id: string): Promise<Profile | null> {
  const { data } = await db().from('profiles').select(PROFILE_COLS).eq('id', id).maybeSingle();
  if (!data) return null;
  const p = { ...(data as Omit<Profile, 'invite_code'>), invite_code: '' } as Profile;
  if (p.role === 'pt') {
    const { data: code } = await db().rpc('my_invite_code');
    if (typeof code === 'string') p.invite_code = code;
  }
  return p;
}

export async function fetchClients(): Promise<Profile[]> {
  const { data } = await db().from('profiles').select(PROFILE_COLS).order('name');
  return ((data as Array<Omit<Profile, 'invite_code'>>) ?? [])
    .filter((p) => p.pt_id !== null)
    .map((p) => ({ ...p, invite_code: '' }));
}

export type ClientOverview = {
  client: Profile;
  plans: number;
  workouts: number;
  lastWorkout: string | null;
  nextExpiry: string | null;
  /** expired = c'è una scheda scaduta; soon = scade entro 7 giorni; ok; none = nessuna scadenza */
  status: 'expired' | 'soon' | 'ok' | 'none';
};

/** Riepilogo di tutti i atleti del PT (home del PT). */
export async function fetchClientsOverview(): Promise<ClientOverview[]> {
  const clients = await fetchClients();
  if (clients.length === 0) return [];
  const ids = clients.map((c) => c.id);
  const [pl, se] = await Promise.all([
    db().from('plans').select('owner_id,expires_at').in('owner_id', ids),
    db().from('sessions').select('user_id,date').in('user_id', ids).order('date', { ascending: false }).limit(2000),
  ]);
  const plans = (pl.data ?? []) as Array<{ owner_id: string; expires_at: string | null }>;
  const sessions = (se.data ?? []) as Array<{ user_id: string; date: string }>;
  const rows = clients.map((client) => {
    const mine = plans.filter((p) => p.owner_id === client.id);
    const ss = sessions.filter((x) => x.user_id === client.id);
    const exp = mine.map((p) => p.expires_at).filter((x): x is string => !!x).sort();
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const expired = exp.filter((d) => d < todayIso);
    const upcoming = exp.filter((d) => d >= todayIso);
    const nextExpiry = expired.length ? expired[expired.length - 1] : (upcoming[0] ?? null);
    let status: ClientOverview['status'] = 'none';
    if (expired.length) status = 'expired';
    else if (upcoming.length) {
      const days = Math.round((new Date(upcoming[0]).getTime() - new Date(todayIso).getTime()) / 86400000);
      status = days <= 7 ? 'soon' : 'ok';
    }
    return {
      client,
      plans: mine.length,
      workouts: ss.length,
      lastWorkout: ss[0]?.date ?? null,
      nextExpiry,
      status,
    };
  });
  const rank = { expired: 0, soon: 1, ok: 2, none: 3 } as const;
  return rows.sort((a, b) => rank[a.status] - rank[b.status] || a.client.name.localeCompare(b.client.name));
}

export async function joinPt(code: string): Promise<boolean> {
  const { data, error } = await db().rpc('join_pt', { code });
  return !error && data === true;
}

export async function leavePt() {
  await db().rpc('leave_pt');
}

export async function updateName(id: string, name: string) {
  await db().from('profiles').update({ name }).eq('id', id);
}

/** Schede di `ownerId` (le proprie, oppure quelle di un cliente se sei il suo PT). */
export function useCloudPlans(ownerId: string, me: string) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: e } = await db()
      .from('plans')
      .select('id,name,exercises,owner_id,created_by,created_at,expires_at')
      .eq('owner_id', ownerId)
      .order('created_at');
    if (e) setError(e.message);
    else {
      setError(null);
      setPlans(
        (data ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          exercises: r.exercises,
          byPt: r.created_by !== r.owner_id,
          expiresAt: r.expires_at ?? undefined,
        })),
      );
    }
    setLoaded(true);
  }, [ownerId]);

  useEffect(() => {
    setLoaded(false);
    setPlans([]);
    load();
  }, [load]);

  const save = useCallback(
    async (plan: Plan) => {
      setPlans((prev) =>
        prev.some((x) => x.id === plan.id)
          ? prev.map((x) => (x.id === plan.id ? { ...plan, byPt: x.byPt } : x))
          : [...prev, { ...plan, byPt: ownerId !== me }],
      );
      const { error: e } = await db().from('plans').upsert({
        id: plan.id,
        owner_id: ownerId,
        name: plan.name,
        exercises: plan.exercises,
        expires_at: plan.expiresAt ?? null,
        updated_at: new Date().toISOString(),
      });
      if (e) {
        setError(e.message);
        load();
      }
    },
    [ownerId, me, load],
  );

  const remove = useCallback(
    async (id: string) => {
      setPlans((prev) => prev.filter((x) => x.id !== id));
      const { error: e } = await db().from('plans').delete().eq('id', id);
      if (e) {
        setError(e.message);
        load();
      }
    },
    [load],
  );

  return { plans, save, remove, loaded, error, reload: load };
}

export function useCloudSessions(userId: string) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    setLoaded(false);
    setSessions([]);
    db()
      .from('sessions')
      .select('id,plan_name,plan_id,date,exercises')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        setSessions(
          (data ?? []).map((r) => ({
            id: r.id,
            planName: r.plan_name,
            planId: r.plan_id ?? undefined,
            date: r.date,
            exercises: r.exercises,
          })),
        );
        setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const add = useCallback(
    async (s: Session) => {
      setSessions((prev) => [s, ...prev]);
      await db().from('sessions').insert({
        id: s.id,
        user_id: userId,
        plan_name: s.planName,
        plan_id: s.planId ?? null,
        date: s.date,
        exercises: s.exercises,
      });
    },
    [userId],
  );

  return { sessions, add, loaded };
}
