import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { PlanEditor } from './src/screens/PlanEditor';
import { PlansScreen } from './src/screens/PlansScreen';
import { WorkoutScreen } from './src/screens/WorkoutScreen';
import { useStoredState } from './src/storage';
import { colors, spacing } from './src/theme';
import { Plan, Session } from './src/types';

type Route =
  | { name: 'tabs' }
  | { name: 'editor'; plan: Plan | null }
  | { name: 'workout'; plan: Plan };

const SAMPLE_PLANS: Plan[] = [
  {
    id: 'sample-push',
    name: 'Push (esempio)',
    exercises: [
      { id: 'e1', name: 'Panca piana', sets: 4, reps: 8 },
      { id: 'e2', name: 'Military press', sets: 3, reps: 10 },
      { id: 'e3', name: 'Croci ai cavi', sets: 3, reps: 12 },
    ],
  },
];

export default function App() {
  const [plans, setPlans, plansLoaded] = useStoredState<Plan[]>('plans', []);
  const [history, setHistory] = useStoredState<Session[]>('history', []);
  const [tab, setTab] = useState<'plans' | 'history'>('plans');
  const [route, setRoute] = useState<Route>({ name: 'tabs' });

  // Solo alla primissima apertura inserisce una scheda d'esempio
  const [seeded, setSeeded, seededLoaded] = useStoredState<boolean>(
    'seeded',
    false,
  );
  useEffect(() => {
    if (plansLoaded && seededLoaded && !seeded) {
      setSeeded(true);
      if (plans.length === 0) setPlans(SAMPLE_PLANS);
    }
  }, [plansLoaded, seededLoaded, seeded, plans.length, setPlans, setSeeded]);

  const goHome = () => setRoute({ name: 'tabs' });

  let content: React.ReactNode;
  if (route.name === 'editor') {
    content = (
      <PlanEditor
        plan={route.plan}
        onBack={goHome}
        onSave={(p) => {
          setPlans((prev) =>
            prev.some((x) => x.id === p.id)
              ? prev.map((x) => (x.id === p.id ? p : x))
              : [...prev, p],
          );
          goHome();
        }}
        onDelete={(id) => {
          setPlans((prev) => prev.filter((x) => x.id !== id));
          goHome();
        }}
      />
    );
  } else if (route.name === 'workout') {
    content = (
      <WorkoutScreen
        plan={route.plan}
        history={history}
        onCancel={goHome}
        onFinish={(s) => {
          setHistory((prev) => [s, ...prev]);
          setTab('history');
          goHome();
        }}
      />
    );
  } else {
    content = (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {tab === 'plans' ? (
            <PlansScreen
              plans={plans}
              onNew={() => setRoute({ name: 'editor', plan: null })}
              onEdit={(plan) => setRoute({ name: 'editor', plan })}
              onStart={(plan) => setRoute({ name: 'workout', plan })}
            />
          ) : (
            <HistoryScreen history={history} />
          )}
        </View>
        <View style={styles.tabBar}>
          <TabButton
            label="Schede"
            active={tab === 'plans'}
            onPress={() => setTab('plans')}
          />
          <TabButton
            label="Storico"
            active={tab === 'history'}
            onPress={() => setTab('history')}
          />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root}>
        <StatusBar style="light" />
        <View style={styles.container}>{content}</View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.tab}>
      <Text style={[styles.tabText, active && { color: colors.accent }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  // Su web limita la larghezza per un aspetto "da telefono" anche sul PC
  container: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  tabText: { color: colors.muted, fontWeight: '700', fontSize: 15 },
});
