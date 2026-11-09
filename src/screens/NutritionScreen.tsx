import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Header } from '../components';
import type { Food } from '../foodsBase';
import {
  Entry, Goals, MEALS, MealKey, Macros, dayKey, dayLabel, entryMacros, r1, shiftDay, sumMacros,
} from '../nutrition';
import type { NutritionData } from '../nutritionStore';
import { colors, radius, spacing } from '../theme';
import { FoodSearch } from './FoodSearch';
import { GoalsScreen } from './GoalsScreen';

type Route =
  | { name: 'diary' }
  | { name: 'add'; meal: MealKey }
  | { name: 'edit'; entry: Entry }
  | { name: 'goals' };

/** Diario alimentare: pasti del giorno, calorie e macro rispetto all’obiettivo. */
export function NutritionScreen({
  data, readOnly = false, canSetGoals = true, who, onBack,
}: {
  data: NutritionData;
  /** vista del PT: si leggono i pasti, non si modificano */
  readOnly?: boolean;
  canSetGoals?: boolean;
  who?: string;
  onBack?: () => void;
}) {
  const [route, setRoute] = useState<Route>({ name: 'diary' });
  const [day, setDay] = useState(dayKey());
  const entries = data.days[day] ?? [];
  const back = () => setRoute({ name: 'diary' });

  const recents = useMemo<Food[]>(() => {
    const seen = new Set<string>();
    const out: Food[] = [];
    for (const d of Object.keys(data.days).sort().reverse()) {
      for (const e of [...data.days[d]].reverse()) {
        const k = e.name + '|' + (e.brand ?? '');
        if (seen.has(k)) continue;
        seen.add(k);
        out.push({ id: 'recent:' + k, name: e.name, brand: e.brand, kcal: e.kcal, p: e.p, c: e.c, f: e.f });
        if (out.length >= 12) return out;
      }
    }
    return out;
  }, [data.days]);

  if (route.name === 'add' || route.name === 'edit') {
    const entry = route.name === 'edit' ? route.entry : undefined;
    return (
      <FoodSearch
        meal={route.name === 'edit' ? route.entry.meal : route.meal}
        entry={entry}
        foods={data.foods}
        recents={recents}
        onAdd={(e) => data.setDay(day, [...entries, e])}
        onUpdate={(e) => data.setDay(day, entries.map((x) => (x.id === e.id ? e : x)))}
        onDelete={(id) => data.setDay(day, entries.filter((x) => x.id !== id))}
        onSaveFood={data.saveFood}
        onRemoveFood={data.removeFood}
        onBack={back}
      />
    );
  }
  if (route.name === 'goals') {
    return (
      <GoalsScreen
        goals={data.goals}
        by={who ? 'pt' : 'self'}
        who={who}
        onSave={data.setGoals}
        onClear={() => data.setGoals(null)}
        onBack={back}
      />
    );
  }

  const total = sumMacros(entries);
  const goals = data.goals;
  const lockedByPt = !who && goals?.by === 'pt';
  const title = who ? `Alimentazione di ${who}` : 'Alimentazione';

  return (
    <View style={{ flex: 1 }}>
      <Header title={title} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.dateRow}>
          <Pressable onPress={() => setDay(shiftDay(day, -1))} hitSlop={10} testID="day-prev"><Text style={styles.arrow}>‹</Text></Pressable>
          <Text style={styles.date} testID="day-label">{dayLabel(day)}</Text>
          <Pressable onPress={() => setDay(shiftDay(day, 1))} hitSlop={10} disabled={day >= dayKey()} testID="day-next">
            <Text style={[styles.arrow, day >= dayKey() && { opacity: 0.25 }]}>›</Text>
          </Pressable>
        </View>

        {data.error ? <Text style={styles.err}>Errore di sincronizzazione: {data.error}</Text> : null}

        <Summary total={total} goals={goals} />

        {goals ? null : (
          <Card style={{ gap: spacing.sm }}>
            <Text style={styles.h}>{canSetGoals ? 'Imposta un obiettivo' : 'Nessun obiettivo'}</Text>
            <Text style={styles.muted}>
              {who
                ? 'Imposta calorie e macro per questo atleta.'
                : 'Calcola calorie e macro giornalieri dai tuoi dati, oppure inseriscili a mano.'}
            </Text>
          </Card>
        )}
        {canSetGoals && !lockedByPt ? (
          <Button label={goals ? 'Modifica obiettivi' : 'Imposta obiettivi'} variant="ghost" onPress={() => setRoute({ name: 'goals' })} testID="goals-btn" />
        ) : null}
        {lockedByPt ? <Text style={styles.muted}>Obiettivi impostati dal tuo personal trainer.</Text> : null}

        {MEALS.map((m) => {
          const list = entries.filter((e) => e.meal === m.key);
          const sub = sumMacros(list);
          return (
            <Card key={m.key} style={{ gap: spacing.sm }} testID={`meal-${m.key}`}>
              <View style={styles.mealHead}>
                <Text style={styles.h}>{m.label}</Text>
                <Text style={styles.muted}>{Math.round(sub.kcal)} kcal</Text>
              </View>
              {list.map((e) => <EntryRow key={e.id} e={e} onPress={readOnly ? undefined : () => setRoute({ name: 'edit', entry: e })} />)}
              {!readOnly ? (
                <Pressable onPress={() => setRoute({ name: 'add', meal: m.key })} style={styles.add} testID={`add-${m.key}`}>
                  <Text style={styles.addText}>+ Aggiungi</Text>
                </Pressable>
              ) : list.length === 0 ? <Text style={styles.muted}>Niente</Text> : null}
            </Card>
          );
        })}

        <Week days={data.days} goal={goals?.kcal} today={day} />
      </ScrollView>
    </View>
  );
}

function Bar({ value, max, color }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color ?? colors.accent }, value > max && max > 0 && { backgroundColor: colors.ink }]} />
    </View>
  );
}

function Summary({ total, goals }: { total: Macros; goals: Goals | null }) {
  const left = goals ? Math.round(goals.kcal - total.kcal) : null;
  return (
    <Card style={{ gap: spacing.md }} testID="summary">
      <View style={styles.sumTop}>
        <View>
          <Text style={styles.big} testID="kcal-eaten">{Math.round(total.kcal)}</Text>
          <Text style={styles.muted}>kcal mangiate</Text>
        </View>
        {goals ? (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.big} testID="kcal-left">{Math.abs(left!)}</Text>
            <Text style={styles.muted}>{left! >= 0 ? `kcal rimaste (obiettivo ${goals.kcal})` : 'kcal oltre l’obiettivo'}</Text>
          </View>
        ) : null}
      </View>
      {goals ? <Bar value={total.kcal} max={goals.kcal} /> : null}
      <MacroLine label="Proteine" v={total.p} max={goals?.p} />
      <MacroLine label="Carboidrati" v={total.c} max={goals?.c} />
      <MacroLine label="Grassi" v={total.f} max={goals?.f} />
    </Card>
  );
}

function MacroLine({ label, v, max }: { label: string; v: number; max?: number }) {
  return (
    <View style={{ gap: 4 }}>
      <View style={styles.mealHead}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.muted}>{r1(v)}{max ? ` / ${max}` : ''} g</Text>
      </View>
      {max ? <Bar value={v} max={max} /> : null}
    </View>
  );
}

function EntryRow({ e, onPress }: { e: Entry; onPress?: () => void }) {
  const m = entryMacros(e);
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.entry} testID="entry">
      <View style={{ flex: 1 }}>
        <Text style={styles.entryName} numberOfLines={2}>{e.name}</Text>
        <Text style={styles.muted}>{e.grams} g · P {r1(m.p)} · C {r1(m.c)} · G {r1(m.f)}</Text>
      </View>
      <Text style={styles.entryKcal}>{Math.round(m.kcal)}</Text>
    </Pressable>
  );
}

const WD = ['D', 'L', 'M', 'M', 'G', 'V', 'S'];
function Week({ days, goal, today }: { days: Record<string, Entry[]>; goal?: number; today: string }) {
  const keys = Array.from({ length: 7 }, (_, i) => shiftDay(today, i - 6));
  const vals = keys.map((k) => sumMacros(days[k] ?? []).kcal);
  const max = Math.max(goal ?? 0, ...vals, 1);
  const logged = vals.filter((v) => v > 0);
  const avg = logged.length ? Math.round(logged.reduce((a, b) => a + b, 0) / logged.length) : 0;
  return (
    <Card style={{ gap: spacing.md }}>
      <View style={styles.mealHead}>
        <Text style={styles.h}>Ultimi 7 giorni</Text>
        <Text style={styles.muted}>{avg ? `media ${avg} kcal` : ''}</Text>
      </View>
      <View style={styles.chart}>
        {keys.map((k, i) => {
          const [y, m, d] = k.split('-').map(Number);
          return (
            <View key={k} style={styles.col}>
              <View style={styles.colBar}>
                <View style={[styles.colFill, { height: `${(vals[i] / max) * 100}%`, opacity: k === today ? 1 : 0.55 }]} />
              </View>
              <Text style={styles.colLabel}>{WD[new Date(y, m - 1, d).getDay()]}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { color: colors.accentInk, fontSize: 34, fontWeight: '700', paddingHorizontal: spacing.md },
  date: { color: colors.text, fontSize: 18, fontWeight: '800', textTransform: 'capitalize' },
  err: { color: colors.danger, fontSize: 13 },
  h: { color: colors.text, fontSize: 17, fontWeight: '800' },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  big: { color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: -0.5 },
  sumTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.cardAlt, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  macroLabel: { color: colors.text, fontSize: 14, fontWeight: '700' },
  mealHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  entry: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  entryName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  entryKcal: { color: colors.text, fontSize: 16, fontWeight: '800' },
  add: { paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm, backgroundColor: colors.accentSoft },
  addText: { color: colors.accentInk, fontWeight: '800', fontSize: 14 },
  chart: { flexDirection: 'row', gap: spacing.sm, height: 90, alignItems: 'flex-end' },
  col: { flex: 1, alignItems: 'center', gap: 4, height: '100%' },
  colBar: { flex: 1, width: '100%', justifyContent: 'flex-end', backgroundColor: colors.cardAlt, borderRadius: 6, overflow: 'hidden' },
  colFill: { width: '100%', backgroundColor: colors.accent, borderRadius: 6 },
  colLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' },
});
