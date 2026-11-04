import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Header } from '../components';
import { colors, spacing } from '../theme';
import { Plan } from '../types';

export function PlansScreen({
  plans,
  onNew,
  onEdit,
  onStart,
}: {
  plans: Plan[];
  onNew: () => void;
  onEdit: (plan: Plan) => void;
  onStart: (plan: Plan) => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Header title="Le mie schede" />
      <ScrollView contentContainerStyle={styles.list}>
        {plans.length === 0 ? (
          <Text style={styles.empty}>
            Nessuna scheda. Creane una per iniziare ad allenarti.
          </Text>
        ) : null}
        {plans.map((plan) => (
          <Card key={plan.id} style={{ gap: spacing.md }}>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.muted}>
              {plan.exercises.length} esercizi
              {plan.exercises.length
                ? ' · ' + plan.exercises.map((e) => e.name).join(', ')
                : ''}
            </Text>
            <View style={styles.row}>
              <Button
                label="Inizia"
                onPress={() => onStart(plan)}
                disabled={plan.exercises.length === 0}
                style={{ flex: 1 }}
              />
              <Button
                label="Modifica"
                variant="ghost"
                onPress={() => onEdit(plan)}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        ))}
        <Button label="+ Nuova scheda" variant="ghost" onPress={onNew} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md },
  planName: { color: colors.text, fontSize: 20, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 13 },
  row: { flexDirection: 'row', gap: spacing.sm },
  empty: { color: colors.muted, textAlign: 'center', marginTop: spacing.xl },
});
