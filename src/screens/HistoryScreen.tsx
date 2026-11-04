import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Header } from '../components';
import { colors, spacing } from '../theme';
import { Session } from '../types';

const volume = (s: Session) =>
  s.exercises.reduce(
    (tot, e) => tot + e.sets.reduce((t, x) => t + x.kg * x.reps, 0),
    0,
  );

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export function HistoryScreen({
  history,
  title = 'Storico',
  onBack,
}: {
  history: Session[];
  title?: string;
  onBack?: () => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Header title={title} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.list}>
        {history.length === 0 ? (
          <Text style={styles.empty}>
            Nessun allenamento registrato. Inizia una scheda per vederlo qui.
          </Text>
        ) : null}
        {history.map((s) => (
          <Card key={s.id} style={{ gap: spacing.sm }}>
            <View style={styles.top}>
              <Text style={styles.name}>{s.planName}</Text>
              <Text style={styles.volume}>
                {Math.round(volume(s)).toLocaleString('it-IT')} kg
              </Text>
            </View>
            <Text style={styles.muted}>{formatDate(s.date)}</Text>
            {s.exercises.map((e) => (
              <View key={e.name} style={{ marginTop: spacing.xs }}>
                <Text style={styles.exName}>{e.name}</Text>
                <Text style={styles.muted}>
                  {e.sets.map((x) => `${x.kg}×${x.reps}`).join('  ·  ')}
                </Text>
              </View>
            ))}
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md },
  top: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { color: colors.text, fontSize: 18, fontWeight: '700' },
  volume: { color: colors.accent, fontSize: 16, fontWeight: '700' },
  exName: { color: colors.text, fontSize: 14, fontWeight: '600' },
  muted: { color: colors.muted, fontSize: 13 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: spacing.xl },
});
