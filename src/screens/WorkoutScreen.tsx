import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Header } from '../components';
import { colors, spacing } from '../theme';
import { Plan, Session, newId } from '../types';
import { TextInput } from 'react-native';

type SetRow = { kg: string; reps: string; done: boolean };

const num = (s: string) => {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export function WorkoutScreen({
  plan,
  history,
  onFinish,
  onCancel,
}: {
  plan: Plan;
  history: Session[];
  onFinish: (session: Session) => void;
  onCancel: () => void;
}) {
  // Ultimo carico usato per ogni esercizio (dallo storico, il più recente)
  const lastKg = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of history) {
      for (const ex of s.exercises) {
        const last = [...ex.sets].reverse().find((x) => x.kg > 0);
        if (last && map[ex.name.toLowerCase()] === undefined) {
          map[ex.name.toLowerCase()] = last.kg;
        }
      }
    }
    return map;
  }, [history]);

  const [rows, setRows] = useState<SetRow[][]>(() =>
    plan.exercises.map((e) =>
      Array.from({ length: e.sets }, () => ({
        kg: lastKg[e.name.toLowerCase()]?.toString() ?? '',
        reps: String(e.reps),
        done: false,
      })),
    ),
  );

  const patch = (ei: number, si: number, p: Partial<SetRow>) =>
    setRows((prev) =>
      prev.map((exRows, i) =>
        i !== ei
          ? exRows
          : exRows.map((r, j) => (j === si ? { ...r, ...p } : r)),
      ),
    );

  const addSet = (ei: number) =>
    setRows((prev) =>
      prev.map((exRows, i) =>
        i !== ei
          ? exRows
          : [...exRows, { ...exRows[exRows.length - 1], done: false }],
      ),
    );

  const doneCount = rows.flat().filter((r) => r.done).length;
  const totalCount = rows.flat().length;

  const finish = () => {
    const exercises = plan.exercises
      .map((e, i) => ({
        name: e.name,
        sets: rows[i]
          .filter((r) => r.done)
          .map((r) => ({ kg: num(r.kg), reps: Math.round(num(r.reps)) })),
      }))
      .filter((e) => e.sets.length > 0);
    onFinish({
      id: newId(),
      planName: plan.name,
      date: new Date().toISOString(),
      exercises,
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <Header
        title={plan.name}
        onBack={onCancel}
        right={
          <Text style={styles.progress}>
            {doneCount}/{totalCount}
          </Text>
        }
      />
      <ScrollView contentContainerStyle={styles.body}>
        {plan.exercises.map((e, ei) => (
          <Card key={e.id} style={{ gap: spacing.sm }}>
            <Text style={styles.exName}>{e.name}</Text>
            <View style={styles.setRow}>
              <Text style={[styles.colLabel, { width: 28 }]}>Set</Text>
              <Text style={[styles.colLabel, { flex: 1 }]}>Kg</Text>
              <Text style={[styles.colLabel, { flex: 1 }]}>Rip.</Text>
              <Text style={[styles.colLabel, { width: 44, textAlign: 'center' }]}>
                ✓
              </Text>
            </View>
            {rows[ei].map((r, si) => (
              <View key={si} style={styles.setRow}>
                <Text style={[styles.setNum, { width: 28 }]}>{si + 1}</Text>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={r.kg}
                  onChangeText={(t) => patch(ei, si, { kg: t })}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={r.reps}
                  onChangeText={(t) => patch(ei, si, { reps: t })}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                />
                <Pressable
                  onPress={() => patch(ei, si, { done: !r.done })}
                  style={[
                    styles.check,
                    r.done && { backgroundColor: colors.success },
                  ]}
                >
                  <Text style={styles.checkText}>{r.done ? '✓' : ''}</Text>
                </Pressable>
              </View>
            ))}
            <Button
              label="+ Aggiungi serie"
              variant="ghost"
              onPress={() => addSet(ei)}
            />
          </Card>
        ))}
        <Button
          label="Termina allenamento"
          onPress={finish}
          disabled={doneCount === 0}
        />
        <Button label="Annulla" variant="ghost" onPress={onCancel} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.md },
  progress: { color: colors.accent, fontSize: 18, fontWeight: '700' },
  exName: { color: colors.text, fontSize: 18, fontWeight: '700' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  colLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  setNum: { color: colors.muted, fontSize: 16, fontWeight: '600' },
  input: {
    backgroundColor: colors.cardAlt,
    color: colors.text,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
  },
  check: {
    width: 44,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { color: colors.accentText, fontWeight: '800', fontSize: 16 },
});
