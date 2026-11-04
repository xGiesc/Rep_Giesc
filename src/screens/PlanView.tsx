import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Header } from '../components';
import { fmtRest } from '../format';
import { colors, spacing } from '../theme';
import { Exercise, Plan, restOf } from '../types';
import { ExerciseDetail } from './ExerciseDetail';

/** Scheda in sola lettura: si possono guardare esercizi e animazioni senza iniziare. */
export function PlanView({
  plan,
  canStart,
  onStart,
  onBack,
}: {
  plan: Plan;
  canStart: boolean;
  onStart: () => void;
  onBack: () => void;
}) {
  const [detail, setDetail] = useState<Exercise | null>(null);

  if (detail) {
    return (
      <ExerciseDetail
        name={detail.name}
        dbId={detail.dbId}
        sets={detail.sets}
        reps={detail.reps}
        rest={restOf(detail)}
        onClose={() => setDetail(null)}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Header title={plan.name} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.body}>
        {plan.exercises.length === 0 ? (
          <Text style={styles.muted}>Questa scheda non ha ancora esercizi.</Text>
        ) : null}
        {plan.exercises.map((e, i) => (
          <Pressable key={e.id} onPress={() => setDetail(e)}>
            <Card style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>
                  {i + 1}. {e.name}
                </Text>
                <Text style={styles.muted}>
                  {e.sets} serie × {e.reps} rip. · recupero {fmtRest(restOf(e))}
                </Text>
              </View>
              <Text style={styles.info}>Video e info ›</Text>
            </Card>
          </Pressable>
        ))}
        {canStart ? (
          <Button
            label="Inizia allenamento"
            onPress={onStart}
            disabled={plan.exercises.length === 0}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 13, marginTop: 2 },
  info: { color: colors.text, fontSize: 13, fontWeight: '700' },
});
