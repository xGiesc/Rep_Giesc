import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Header } from '../components';
import { ago } from '../expiry';
import { cycleState } from '../rotation';
import { colors, spacing } from '../theme';
import { Plan, Session } from '../types';

/** Home: solo l'allenamento previsto. */
export function NextWorkout({
  plans,
  history,
  title = 'Oggi',
  canStart = true,
  onStart,
  onOpen,
  onAll,
  onBack,
}: {
  plans: Plan[];
  history: Session[];
  title?: string;
  canStart?: boolean;
  onStart: (p: Plan) => void;
  onOpen: (p: Plan) => void;
  onAll: () => void;
  onBack?: () => void;
}) {
  const { next, todo } = cycleState(plans, history);
  const last = [...history].sort((a, b) => b.date.localeCompare(a.date))[0];
  const after = todo.filter((p) => p.id !== next?.id && p.exercises.length > 0)[0];
  return (
    <View style={{ flex: 1 }}>
      <Header title={title} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.body}>
        {next ? (
          <Card style={{ gap: spacing.md }}>
            <Text testID="next-workout" style={styles.kicker}>ALLENAMENTO PREVISTO</Text>
            <Text style={styles.name}>{next.name}</Text>
            <View style={{ gap: 6 }}>
              {next.exercises.map((e) => (
                <View key={e.id} style={styles.exRow}>
                  <View style={styles.dot} />
                  <Text style={styles.exName} numberOfLines={1}>{e.name}</Text>
                  <Text style={styles.exMeta}>{e.sets}×{e.reps}</Text>
                </View>
              ))}
            </View>
            <View style={styles.row}>
              {canStart ? <Button label="Inizia allenamento" onPress={() => onStart(next)} style={{ flex: 1.6 }} /> : null}
              <Button label="Apri" variant="ghost" onPress={() => onOpen(next)} style={{ flex: 1 }} />
            </View>
          </Card>
        ) : (
          <Card style={{ gap: spacing.sm }}>
            <Text style={styles.name}>Nessun allenamento previsto</Text>
            <Text style={styles.muted}>
              {plans.length === 0
                ? 'Il tuo personal trainer non ti ha ancora assegnato una scheda.'
                : 'Le tue schede sono scadute: chiedi al tuo personal trainer di rinnovarle.'}
            </Text>
          </Card>
        )}
        {after ? <Text style={styles.muted}>Poi: {after.name}</Text> : null}
        {last ? <Text style={styles.muted}>Ultimo allenamento: {last.planName} · {ago(last.date)}</Text> : null}
        <Button label="Vedi tutte le schede" variant="ghost" onPress={onAll} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.md },
  kicker: { color: colors.accentInk, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  name: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.4 },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  exName: { color: colors.text, fontSize: 15, flex: 1 },
  exMeta: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  row: { flexDirection: 'row', gap: spacing.sm },
  muted: { color: colors.muted, fontSize: 13 },
});
