import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Food } from './foodsBase';
import { Entry, Goals, dayKey, shiftDay } from './nutrition';
import { useStoredState } from './storage';
import { supabase } from './supabase';

/** Dati alimentari di una persona (sul dispositivo oppure nel cloud): stessa interfaccia per entrambi. */
export type NutritionData = {
  days: Record<string, Entry[]>;
  goals: Goals | null;
  /** alimenti creati a mano */
  foods: Food[];
  loaded: boolean;
  error: string | null;
  setDay: (day: string, entries: Entry[]) => void;
  setGoals: (g: Goals | null) => void;
  saveFood: (f: Food) => void;
  removeFood: (id: string) => void;
};

const HISTORY_DAYS = 90;

export function useLocalNutrition(): NutritionData {
  const [days, setDays, l1] = useStoredState<Record<string, Entry[]>>('nutrition-days', {});
  const [goals, setGoalsState, l2] = useStoredState<Goals | null>('nutrition-goals', null);
  const [foods, setFoods, l3] = useStoredState<Food[]>('nutrition-foods', []);
  return {
    days, goals, foods, loaded: l1 && l2 && l3, error: null,
    setDay: (day, entries) =>
      setDays((p) => {
        const next = { ...p };
        if (entries.length) next[day] = entries;
        else delete next[day];
        return next;
      }),
    setGoals: setGoalsState,
    saveFood: (f) => setFoods((p) => [f, ...p.filter((x) => x.id !== f.id)]),
    removeFood: (id) => setFoods((p) => p.filter((x) => x.id !== id)),
  };
}

const db = () => {
  if (!supabase) throw new Error('Cloud non configurato');
  return supabase;
};

/**
 * Diario di `ownerId`: il proprio, oppure quello di un atleta se sei il suo PT
 * (il PT legge i pasti e può impostare gli obiettivi, ma non modifica i pasti: lo decide il database).
 */
export function useCloudNutrition(ownerId: string): NutritionData {
  const [days, setDays] = useState<Record<string, Entry[]>>({});
  const [goals, setGoalsState] = useState<Goals | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoaded(false);
    setDays({});
    setGoalsState(null);
    setFoods([]);
    const since = shiftDay(dayKey(), -HISTORY_DAYS);
    Promise.all([
      db().from('nutrition_days').select('day,entries').eq('user_id', ownerId).gte('day', since),
      db().from('nutrition_prefs').select('goals,foods').eq('user_id', ownerId).maybeSingle(),
    ])
      .then(([d, p]) => {
        if (!alive) return;
        if (d.error || p.error) setError((d.error || p.error)!.message);
        const map: Record<string, Entry[]> = {};
        for (const r of (d.data ?? []) as Array<{ day: string; entries: Entry[] }>) map[r.day] = r.entries;
        setDays(map);
        const pref = p.data as { goals: Goals | null; foods: Food[] } | null;
        setGoalsState(pref?.goals ?? null);
        setFoods(pref?.foods ?? []);
        setLoaded(true);
      })
      .catch((e) => {
        if (!alive) return;
        setError(String(e?.message ?? e));
        setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [ownerId]);

  const savePrefs = useCallback(
    async (g: Goals | null, f: Food[]) => {
      const { error: e } = await db().from('nutrition_prefs').upsert({
        user_id: ownerId, goals: g, foods: f, updated_at: new Date().toISOString(),
      });
      if (e) setError(e.message);
    },
    [ownerId],
  );

  return useMemo(
    () => ({
      days, goals, foods, loaded, error,
      setDay: (day: string, entries: Entry[]) => {
        setDays((p) => {
          const next = { ...p };
          if (entries.length) next[day] = entries;
          else delete next[day];
          return next;
        });
        const run = entries.length
          ? db().from('nutrition_days').upsert({ user_id: ownerId, day, entries, updated_at: new Date().toISOString() })
          : db().from('nutrition_days').delete().eq('user_id', ownerId).eq('day', day);
        run.then(({ error: e }) => e && setError(e.message));
      },
      setGoals: (g: Goals | null) => {
        setGoalsState(g);
        savePrefs(g, foods);
      },
      saveFood: (f: Food) => {
        const next = [f, ...foods.filter((x) => x.id !== f.id)];
        setFoods(next);
        savePrefs(goals, next);
      },
      removeFood: (id: string) => {
        const next = foods.filter((x) => x.id !== id);
        setFoods(next);
        savePrefs(goals, next);
      },
    }),
    [days, goals, foods, loaded, error, ownerId, savePrefs],
  );
}
