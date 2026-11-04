import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Header } from '../components';
import { Logo } from '../Logo';
import { colors, spacing } from '../theme';
import { expiryInfo } from '../expiry';
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
  return (
    <View style={{ flex: 1 }}>
      <Header
        title={title}
        onBack={onBack}
        right={
          onBack ? undefined : (
            <Logo width={82} height={35} />
          )
        }
      />
      <ScrollView contentContainerStyle={styles.list}>
        {plans.length === 0 ? (
          <Text style={styles.empty}>
            {canEdit ? 'Nessuna scheda. Creane una per iniziare ad allenarti.' : 'Nessuna scheda per ora: il tuo personal trainer te la assegnerà qui.'}
          </Text>
        ) : null}
        {plans.map((plan) => (
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
                          ex.tone === 'soon' && { color: colors.accent },
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
  byPt: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 13 },
  row: { flexDirection: 'row', gap: spacing.sm },
  empty: { color: colors.muted, textAlign: 'center', marginTop: spacing.xl },
});
