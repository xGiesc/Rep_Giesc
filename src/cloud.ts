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

export async function fetchProfile(id: string): Promise<Profile | null> {
  const { data } = await db().from('profiles').select('*').eq('id', id).maybeSingle();
  return (data as Profile) ?? null;
}

export async function fetchClients(): Promise<Profile[]> {
  const { data } = await db().from('profiles').select('*').order('name');
  return ((data as Profile[]) ?? []).filter((p) => p.pt_id !== null);
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
      .select('id,name,exercises,owner_id,created_by,created_at')
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
      .select('id,plan_name,date,exercises')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        setSessions(
          (data ?? []).map((r) => ({
            id: r.id,
            planName: r.plan_name,
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
        date: s.date,
        exercises: s.exercises,
      });
    },
    [userId],
  );

  return { sessions, add, loaded };
}
