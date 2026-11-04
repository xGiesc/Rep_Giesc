import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HistoryScreen } from './screens/HistoryScreen';
import { PlanEditor } from './screens/PlanEditor';
import { PlansScreen } from './screens/PlansScreen';
import { WorkoutScreen } from './screens/WorkoutScreen';
import { colors, spacing } from './theme';
import { Plan, Session } from './types';

type Route =
  | { name: 'tabs' }
  | { name: 'editor'; plan: Plan | null }
  | { name: 'workout'; plan: Plan };

export type ExtraTab = { key: string; label: string; render: () => React.ReactNode };

/**
 * Schermate principali (schede, allenamento, storico) per un insieme di dati:
 * le mie, oppure quelle di un cliente visto dal suo PT (canTrain = false).
 */
export function Home({
  plans,
  onSavePlan,
  onDeletePlan,
  history,
  onFinishSession,
  canTrain = true,
  plansTitle,
  historyTitle,
  onBack,
  extraTabs = [],
}: {
  plans: Plan[];
  onSavePlan: (p: Plan) => void;
  onDeletePlan: (id: string) => void;
  history: Session[];
  onFinishSession?: (s: Session) => void;
  canTrain?: boolean;
  plansTitle?: string;
  historyTitle?: string;
  onBack?: () => void;
  extraTabs?: ExtraTab[];
}) {
  const [tab, setTab] = useState<string>('plans');
  const [route, setRoute] = useState<Route>({ name: 'tabs' });
  const goHome = () => setRoute({ name: 'tabs' });

  if (route.name === 'editor') {
    return (
      <PlanEditor
        plan={route.plan}
        onBack={goHome}
        onSave={(p) => {
          onSavePlan(p);
          goHome();
        }}
        onDelete={(id) => {
          onDeletePlan(id);
          goHome();
        }}
      />
    );
  }
  if (route.name === 'workout') {
    return (
      <WorkoutScreen
        plan={route.plan}
        history={history}
        onCancel={goHome}
        onFinish={(s) => {
          onFinishSession?.(s);
          setTab('history');
          goHome();
        }}
      />
    );
  }

  const extra = extraTabs.find((t) => t.key === tab);
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {extra ? (
          extra.render()
        ) : tab === 'plans' ? (
          <PlansScreen
            plans={plans}
            title={plansTitle}
            canStart={canTrain}
            onBack={onBack}
            onNew={() => setRoute({ name: 'editor', plan: null })}
            onEdit={(plan) => setRoute({ name: 'editor', plan })}
            onStart={(plan) => setRoute({ name: 'workout', plan })}
          />
        ) : (
          <HistoryScreen history={history} title={historyTitle} onBack={onBack} />
        )}
      </View>
      <View style={styles.tabBar}>
        <TabButton label="Schede" active={tab === 'plans'} onPress={() => setTab('plans')} />
        <TabButton label="Storico" active={tab === 'history'} onPress={() => setTab('history')} />
        {extraTabs.map((t) => (
          <TabButton key={t.key} label={t.label} active={tab === t.key} onPress={() => setTab(t.key)} />
        ))}
      </View>
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.tab}>
      <Text style={[styles.tabText, active && { color: colors.accent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  tabText: { color: colors.muted, fontWeight: '700', fontSize: 15 },
});
