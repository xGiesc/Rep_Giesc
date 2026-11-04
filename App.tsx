import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { Profile, fetchProfile, useCloudPlans, useCloudSessions } from './src/cloud';
import { Home } from './src/Home';
import { AccountScreen } from './src/screens/AccountScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { ClientsScreen } from './src/screens/ClientsScreen';
import { useStoredState } from './src/storage';
import { cloudEnabled, supabase } from './src/supabase';
import { colors } from './src/theme';
import { Plan, Session } from './src/types';
import { setupWeb } from './src/webSetup';

setupWeb();

const SAMPLE_PLANS: Plan[] = [
  {
    id: 'sample-push',
    name: 'Push (esempio)',
    exercises: [
      {
        id: 'e1',
        name: 'Barbell Bench Press - Medium Grip',
        dbId: 'Barbell_Bench_Press_-_Medium_Grip',
        sets: 4,
        reps: 8,
        rest: 120,
      },
      {
        id: 'e2',
        name: 'Standing Military Press',
        dbId: 'Standing_Military_Press',
        sets: 3,
        reps: 10,
        rest: 90,
      },
      {
        id: 'e3',
        name: 'Cable Crossover',
        dbId: 'Cable_Crossover',
        sets: 3,
        reps: 12,
        rest: 60,
      },
    ],
  },
];


/** Senza cloud configurato: tutto sul dispositivo, senza login. */
function LocalApp() {
  const [plans, setPlans, plansLoaded] = useStoredState<Plan[]>('plans', []);
  const [history, setHistory] = useStoredState<Session[]>('history', []);
  const [seeded, setSeeded, seededLoaded] = useStoredState<boolean>('seeded', false);
  useEffect(() => {
    if (plansLoaded && seededLoaded && !seeded) {
      setSeeded(true);
      if (plans.length === 0) setPlans(SAMPLE_PLANS);
    }
  }, [plansLoaded, seededLoaded, seeded, plans.length, setPlans, setSeeded]);

  return (
    <Home
      plans={plans}
      history={history}
      onSavePlan={(p) =>
        setPlans((prev) =>
          prev.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p],
        )
      }
      onDeletePlan={(id) => setPlans((prev) => prev.filter((x) => x.id !== id))}
      onFinishSession={(s) => setHistory((prev) => [s, ...prev])}
    />
  );
}

/** Vista del PT su un suo cliente: modifica le schede, vede lo storico. */
function ClientView({ me, client, onBack }: { me: string; client: Profile; onBack: () => void }) {
  const cp = useCloudPlans(client.id, me);
  const cs = useCloudSessions(client.id);
  const label = client.name || client.email || 'Cliente';
  return (
    <Home
      plans={cp.plans}
      history={cs.sessions}
      canTrain={false}
      plansTitle={`Schede di ${label}`}
      historyTitle={`Storico di ${label}`}
      onBack={onBack}
      onSavePlan={cp.save}
      onDeletePlan={cp.remove}
    />
  );
}

function CloudApp({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [client, setClient] = useState<Profile | null>(null);
  const reload = useCallback(() => {
    fetchProfile(userId).then(setProfile);
  }, [userId]);
  useEffect(reload, [reload]);

  const mine = useCloudPlans(userId, userId);
  const sessions = useCloudSessions(userId);

  if (!profile) return <Center><ActivityIndicator color={colors.accent} /></Center>;
  if (client) return <ClientView me={userId} client={client} onBack={() => setClient(null)} />;

  const isPt = profile.role === 'pt';
  return (
    <Home
      plans={mine.plans}
      history={sessions.sessions}
      onSavePlan={mine.save}
      onDeletePlan={mine.remove}
      onFinishSession={sessions.add}
      canEdit={isPt}
      extraTabs={[
        ...(isPt
          ? [{ key: 'clients', label: 'Ragazzi', render: () => <ClientsScreen code={profile.invite_code} onOpen={setClient} /> }]
          : []),
        { key: 'account', label: 'Account', render: () => <AccountScreen profile={profile} onChanged={reload} /> },
      ]}
    />
  );
}

function CloudGate() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user.id ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  if (userId === undefined) return <Center><ActivityIndicator color={colors.accent} /></Center>;
  if (userId === null) return <AuthScreen />;
  return <CloudApp key={userId} userId={userId} />;
}

function Center({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>{children}</View>;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root}>
        <StatusBar style="light" />
        <View style={styles.container}>{cloudEnabled ? <CloudGate /> : <LocalApp />}</View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  // Su web limita la larghezza per un aspetto "da telefono" anche sul PC
  container: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' },
});
