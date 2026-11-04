import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Header } from '../components';
import { colors, spacing } from '../theme';
import { expiryInfo } from '../expiry';
import { cycleState } from '../rotation';
import { Plan, Session } from '../types';

export function PlansScreen({
  plans,
  onNew,
  onEdit,
  onStart,
  title = 'Le mie schede',
  canStart = true,
  canEdit = true,
  onOpen,
  onBack,
  history = [],
}: {
  plans: Plan[];
  onNew: () => void;
  onEdit: (plan: Plan) => void;
  onStart: (plan: Plan) => void;
  title?: string;
  canStart?: boolean;
  canEdit?: boolean;
  onOpen?: (plan: Plan) => void;
  history?: Session[];
  onBack?: () => void;
}) {
  const [showDone, setShowDone] = useState(false);
  const cyc = cycleState(plans, history);
  const shown = showDone ? cyc.done : cyc.todo;
  return (
    <View style={{ flex: 1 }}>
      <Header
        title={title}
        onBack={onBack}
      />
      <View style={styles.toggle}>
        {([['todo', `Da fare (${cyc.todo.length})`], ['done', `Eseguite (${cyc.done.length})`]] as const).map(([k, label]) => {
          const on = (k === 'done') === showDone;
          return (
            <Pressable key={k} testID={`filter-${k}`} onPress={() => setShowDone(k === 'done')} style={[styles.seg, on && styles.segOn]}>
              <Text style={[styles.segText, on && { color: colors.accentText }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {shown.length === 0 ? (
          <Text style={styles.empty}>
            {showDone
              ? 'Nessuna scheda eseguita in questo giro.'
              : plans.length === 0
                ? canEdit ? 'Nessuna scheda. Creane una per iniziare ad allenarti.' : 'Nessuna scheda per ora: il tuo personal trainer te la assegnerà qui.'
                : 'Hai fatto tutto! Guarda tra le eseguite.'}
          </Text>
        ) : null}
        {shown.map((plan) => (
          <Card key={plan.id} style={{ gap: spacing.md }}>
            <Text style={styles.planName}>{plan.name}</Text>
            {plan.byPt && canStart ? (
              <Text style={styles.byPt}>Assegnata dal tuo personal trainer</Text>
            ) : null}
            {(() => {
              const ex = expiryInfo(plan.expiresAt);
              const done = history.filter((h) => h.planId === plan.id).length;
              return (
                <View style={styles.pills}>
                  {ex ? (
                    <View
                      style={[
                        styles.pill,
                        ex.tone === 'expired' && { backgroundColor: colors.accent },
                        ex.tone === 'soon' && { backgroundColor: colors.accentSoft },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          ex.tone === 'expired' && { color: colors.accentText },
                          ex.tone === 'soon' && { color: colors.accentInk },
                        ]}
                      >
                        {ex.text}
                      </Text>
                    </View>
                  ) : null}
                  {done > 0 ? (
                    <View style={styles.pill}>
                      <Text style={styles.pillText}>
                        {done} {done === 1 ? 'allenamento fatto' : 'allenamenti fatti'}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })()}
            <Text style={styles.muted}>
              {plan.exercises.length} esercizi
              {plan.exercises.length
                ? ' · ' + plan.exercises.map((e) => e.name).join(', ')
                : ''}
            </Text>
            <View style={styles.row}>
              {canStart ? (
                <Button
                  label="Inizia"
                  onPress={() => onStart(plan)}
                  disabled={plan.exercises.length === 0}
                  style={{ flex: 1.4 }}
                />
              ) : null}
              {onOpen ? (
                <Button
                  label="Apri"
                  variant="ghost"
                  onPress={() => onOpen(plan)}
                  style={{ flex: 1 }}
                />
              ) : null}
              {canEdit ? (
                <Button
                  label="Modifica"
                  variant="ghost"
                  onPress={() => onEdit(plan)}
                  style={{ flex: 1 }}
                />
              ) : null}
            </View>
          </Card>
        ))}
        {canEdit ? <Button label="+ Nuova scheda" variant="ghost" onPress={onNew} /> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.cardAlt,
    borderRadius: 999,
    padding: 4,
  },
  seg: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 999 },
  segOn: { backgroundColor: colors.accent },
  segText: { color: colors.text, fontWeight: '800', fontSize: 13 },
  list: { padding: spacing.lg, gap: spacing.md },
  planName: { color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: {
    backgroundColor: colors.cardAlt,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  byPt: { color: colors.accentInk, fontSize: 12, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 13 },
  row: { flexDirection: 'row', gap: spacing.sm },
  empty: { color: colors.muted, textAlign: 'center', marginTop: spacing.xl },
});
