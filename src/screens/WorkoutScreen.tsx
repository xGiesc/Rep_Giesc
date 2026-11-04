import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button, Card, Header, RestTimerBar } from '../components';
import { keepScreenAwake, unlockAudio } from '../feedback';
import { fmtRest } from '../format';
import { colors, spacing } from '../theme';
import { Exercise, Plan, Session, newId, restOf } from '../types';
import { useRestTimer } from '../useRestTimer';
import { ExerciseDetail } from './ExerciseDetail';
import { ExercisePicker } from './ExercisePicker';

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

  // gli esercizi aggiunti durante l'allenamento valgono solo per questa seduta
  const [exs, setExs] = useState<Exercise[]>(plan.exercises);
  const [picking, setPicking] = useState(false);
  const [rows, setRows] = useState<SetRow[][]>(() =>
    plan.exercises.map((e) =>
      Array.from({ length: e.sets }, () => ({
        kg: lastKg[e.name.toLowerCase()]?.toString() ?? '',
        reps: String(e.reps),
        done: false,
      })),
    ),
  );
  const [detail, setDetail] = useState<Exercise | null>(null);
  const timer = useRestTimer();

  // Durante l'allenamento lo schermo resta acceso (così il timer non si perde)
  useEffect(() => keepScreenAwake(), []);

  const patch = (ei: number, si: number, p: Partial<SetRow>) =>
    setRows((prev) =>
      prev.map((exRows, i) =>
        i !== ei
          ? exRows
          : exRows.map((r, j) => (j === si ? { ...r, ...p } : r)),
      ),
    );

  const toggleDone = (ei: number, si: number) => {
    const nowDone = !rows[ei][si].done;
    patch(ei, si, { done: nowDone });
    if (!nowDone) return;

    unlockAudio(); // serve il tocco dell'utente per poter suonare a fine recupero
    const allDone = rows.every((exRows, i) =>
      exRows.every((r, j) => (i === ei && j === si ? true : r.done)),
    );
    const ex = exs[ei];
    // niente recupero dopo l'ultima serie di tutto l'allenamento
    if (!allDone) timer.start(restOf(ex), `${ex.name} · serie ${si + 1}`);
  };

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
    const exercises = exs
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
      planId: plan.id,
      date: new Date().toISOString(),
      exercises,
    });
  };

  const timerBar = timer.active ? (
    <View style={styles.timerWrap} pointerEvents="box-none">
      <RestTimerBar
        label={timer.label}
        remaining={timer.remaining}
        total={timer.total}
        finished={timer.finished}
        onAdjust={timer.adjust}
        onSkip={timer.skip}
      />
    </View>
  ) : null;

  if (picking) {
    return (
      <ExercisePicker
        onClose={() => setPicking(false)}
        onPick={(name, dbId) => {
          const e: Exercise = { id: newId(), name, dbId, sets: 3, reps: 10, rest: 90 };
          setExs((prev) => [...prev, e]);
          setRows((prev) => [
            ...prev,
            Array.from({ length: 3 }, () => ({
              kg: lastKg[name.toLowerCase()]?.toString() ?? '',
              reps: '10',
              done: false,
            })),
          ]);
          setPicking(false);
        }}
      />
    );
  }

  if (detail) {
    return (
      <View style={{ flex: 1 }}>
        <ExerciseDetail
          name={detail.name}
          dbId={detail.dbId}
          sets={detail.sets}
          reps={detail.reps}
          rest={restOf(detail)}
          onClose={() => setDetail(null)}
        />
        {timerBar}
      </View>
    );
  }

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
      <ScrollView
        contentContainerStyle={[
          styles.body,
          timer.active && { paddingBottom: 150 },
        ]}
      >
        {exs.map((e, ei) => (
          <Card key={e.id} style={{ gap: spacing.sm }}>
            <Pressable onPress={() => setDetail(e)} style={styles.exHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.exName}>{e.name}</Text>
                <Text style={styles.exMeta}>
                  Recupero {fmtRest(restOf(e))}
                </Text>
              </View>
              <Text style={styles.exInfo}>Video e info ›</Text>
            </Pressable>
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
                  onPress={() => toggleDone(ei, si)}
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
          label="+ Aggiungi esercizio"
          variant="ghost"
          onPress={() => setPicking(true)}
        />
        <Button
          label="Termina allenamento"
          onPress={finish}
          disabled={doneCount === 0}
        />
        <Button label="Annulla" variant="ghost" onPress={onCancel} />
      </ScrollView>
      {timerBar}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.md },
  progress: { color: colors.accent, fontSize: 18, fontWeight: '700' },
  exHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  exName: { color: colors.text, fontSize: 18, fontWeight: '700' },
  exMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  exInfo: { color: colors.accent, fontSize: 13, fontWeight: '700' },
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
    minWidth: 0, // su web l'<input> ha una larghezza minima: senza questo la riga sborda
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
  timerWrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
  },
});
