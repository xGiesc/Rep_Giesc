import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { NutritionData } from './nutritionStore';
import { HistoryScreen } from './screens/HistoryScreen';
import { NutritionScreen } from './screens/NutritionScreen';
import { PlanEditor } from './screens/PlanEditor';
import { PlanView } from './screens/PlanView';
import { NextWorkout } from './screens/NextWorkout';
import { PlansScreen } from './screens/PlansScreen';
import { WorkoutScreen } from './screens/WorkoutScreen';
import { colors, spacing } from './theme';
import { Plan, Session } from './types';

type Route =
  | { name: 'tabs' }
  | { name: 'editor'; plan: Plan | null }
  | { name: 'workout'; plan: Plan }
  | { name: 'view'; plan: Plan };

export type ExtraTab = { key: string; label: string; icon?: IconName; render: () => React.ReactNode };

export type IconName = 'home' | 'plans' | 'history' | 'food' | 'clients' | 'account';

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
  canEdit = true,
  plansTitle,
  historyTitle,
  onBack,
  extraTabs = [],
  coachMode = false,
  nutrition,
  nutritionWho,
}: {
  plans: Plan[];
  onSavePlan: (p: Plan) => void;
  onDeletePlan: (id: string) => void;
  history: Session[];
  onFinishSession?: (s: Session) => void;
  canTrain?: boolean;
  canEdit?: boolean;
  plansTitle?: string;
  historyTitle?: string;
  onBack?: () => void;
  extraTabs?: ExtraTab[];
  /** Il coach guarda un atleta: niente Home, si parte dall'elenco di tutte le schede. */
  coachMode?: boolean;
  /** Diario alimentare (se presente compare la scheda «Dieta»). */
  nutrition?: NutritionData;
  /** Nome dell'atleta quando lo guarda il PT: diario in sola lettura, obiettivi modificabili. */
  nutritionWho?: string;
}) {
  const [tab, setTab] = useState<string>(coachMode ? 'plans' : 'home');
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
  if (route.name === 'view') {
    return (
      <PlanView
        plan={plans.find((p) => p.id === route.plan.id) ?? route.plan}
        canStart={canTrain}
        onStart={() => setRoute({ name: 'workout', plan: route.plan })}
        onBack={goHome}
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
        ) : tab === 'home' ? (
          <NextWorkout
            plans={plans}
            history={history}
            title={plansTitle ? plansTitle : 'Oggi'}
            canStart={canTrain}
            onStart={(plan) => setRoute({ name: 'workout', plan })}
            onOpen={(plan) => setRoute({ name: 'view', plan })}
            onAll={() => setTab('plans')}
            onBack={onBack}
          />
        ) : tab === 'food' && nutrition ? (
          <NutritionScreen
            data={nutrition}
            readOnly={!!nutritionWho}
            who={nutritionWho}
            onBack={nutritionWho ? onBack : undefined}
          />
        ) : tab === 'plans' ? (
          <PlansScreen
            plans={plans}
            title={plansTitle}
            canStart={canTrain}
            history={history}
            canEdit={canEdit}
            coach={coachMode}
            onOpen={(plan) => setRoute({ name: 'view', plan })}
            onBack={onBack}
            onNew={() => setRoute({ name: 'editor', plan: null })}
            onEdit={(plan) => setRoute({ name: 'editor', plan })}
            onStart={(plan) => setRoute({ name: 'workout', plan })}
          />
        ) : (
          <HistoryScreen history={history} title={historyTitle} onBack={onBack} />
        )}
      </View>
      <TabBar
        tabs={[
          ...(coachMode ? [] : [{ key: 'home', label: 'Home', icon: 'home' as IconName }]),
          { key: 'plans', label: 'Schede', icon: 'plans' },
          { key: 'history', label: 'Storico', icon: 'history' },
          ...(nutrition ? [{ key: 'food', label: 'Dieta', icon: 'food' as IconName }] : []),
          ...extraTabs.map((t) => ({ key: t.key, label: t.label, icon: t.icon ?? ('account' as IconName) })),
        ]}
        active={tab}
        onChange={setTab}
      />
    </View>
  );
}

function Icon({ name, color }: { name: IconName; color: string }) {
  const p = { stroke: color, strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      {name === 'home' ? (
        <>
          <Path d="M3.5 11L12 4l8.5 7" {...p} />
          <Path d="M6 10v9.5h12V10" {...p} />
        </>
      ) : name === 'plans' ? (
        <>
          <Rect x="4" y="3" width="16" height="18" rx="3" {...p} />
          <Path d="M8 8h8M8 12h8M8 16h5" {...p} />
        </>
      ) : name === 'history' ? (
        <>
          <Circle cx="12" cy="12" r="9" {...p} />
          <Path d="M12 7v5l3 2" {...p} />
        </>
      ) : name === 'food' ? (
        <>
          <Path d="M4 11h16a8 8 0 01-16 0z" {...p} />
          <Path d="M8 7c0-1.5 1-1.5 1-3M12 7c0-1.5 1-1.5 1-3M16 7c0-1.5 1-1.5 1-3" {...p} />
        </>
      ) : name === 'clients' ? (
        <>
          <Circle cx="9" cy="8" r="3.5" {...p} />
          <Path d="M2.5 20c.5-4 3.2-6 6.5-6s6 2 6.5 6" {...p} />
          <Path d="M16 4.6a3.5 3.5 0 010 6.8M18.5 14.4c1.8.7 2.8 2.7 3 5.6" {...p} />
        </>
      ) : (
        <>
          <Circle cx="12" cy="8" r="4" {...p} />
          <Path d="M4 21c.7-4.5 4-7 8-7s7.3 2.5 8 7" {...p} />
        </>
      )}
    </Svg>
  );
}

export function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ key: string; label: string; icon: IconName }>;
  active: string;
  onChange: (key: string) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: 4 + insets.bottom }]}>
      {tabs.map((t) => (
        <TabButton key={t.key} label={t.label} icon={t.icon} active={active === t.key} onPress={() => onChange(t.key)} />
      ))}
    </View>
  );
}

function TabButton({ label, icon, active, onPress }: { label: string; icon: IconName; active: boolean; onPress: () => void }) {
  const color = active ? colors.accent : '#a3a3ad';
  return (
    <Pressable onPress={onPress} style={styles.tab}>
      <Icon name={icon} color={color} />
      <Text style={[styles.tabText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 6,
    paddingBottom: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, gap: 3 },
  tabText: { fontWeight: '700', fontSize: 11 },
});
