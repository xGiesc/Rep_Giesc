import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { Profile, fetchProfile, useCloudPlans, useCloudSessions } from './src/cloud';
import { Home, TabBar } from './src/Home';
import { AccountScreen } from './src/screens/AccountScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { ClientsScreen } from './src/screens/ClientsScreen';
import { useStoredState } from './src/storage';
import { cloudEnabled, supabase } from './src/supabase';
import { Banner } from './src/Banner';
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
        name: 'Panca piana con bilanciere',
        dbId: 'panca-piana-bilanciere',
        sets: 4,
        reps: 8,
        rest: 120,
      },
      {
        id: 'e2',
        name: 'Military press con bilanciere',
        dbId: 'military-press-bilanciere',
        sets: 3,
        reps: 10,
        rest: 90,
      },
      {
        id: 'e3',
        name: 'Croci ai cavi su panca',
        dbId: 'croci-cavi-panca',
        sets: 3,
        reps: 12,
        rest: 60,
      },
    ],
  },
];


/** Senza cloud configurato: tutto sul dispositivo, senza login. */
function Page({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Banner />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

function LocalApp() {
  return (
    <Page>
      <LocalAppInner />
    </Page>
  );
}

function LocalAppInner() {
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
  return (
    <Page>
      <CloudAppInner userId={userId} />
    </Page>
  );
}

function CloudAppInner({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [client, setClient] = useState<Profile | null>(null);
  // Il PT parte dalla gestione ragazzi; può passare alla modalità allenamento
  const [ptMode, setPtMode, ptModeLoaded] = useStoredState<'manage' | 'train'>('ptmode', 'manage');
  const [ptTab, setPtTab] = useState<'clients' | 'account'>('clients');
  const reload = useCallback(() => {
    fetchProfile(userId).then(setProfile);
  }, [userId]);
  useEffect(reload, [reload]);

  const mine = useCloudPlans(userId, userId);
  const sessions = useCloudSessions(userId);

  if (!profile || !ptModeLoaded) return <Center><ActivityIndicator color={colors.accent} /></Center>;
  if (client) return <ClientView me={userId} client={client} onBack={() => setClient(null)} />;

  const isPt = profile.role === 'pt';

  if (isPt && ptMode === 'manage') {
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {ptTab === 'clients' ? (
            <ClientsScreen code={profile.invite_code} onOpen={setClient} />
          ) : (
            <AccountScreen
              profile={profile}
              onChanged={reload}
              onSwitch={{
                label: 'Passa alla modalità allenamento',
                hint: 'Per caricare e fare anche le tue schede di allenamento. La gestione dei ragazzi resta la tua schermata principale.',
                onPress: () => setPtMode('train'),
              }}
            />
          )}
        </View>
        <TabBar
          tabs={[
            { key: 'clients', label: 'Ragazzi', icon: 'clients' },
            { key: 'account', label: 'Account', icon: 'account' },
          ]}
          active={ptTab}
          onChange={(k) => setPtTab(k as 'clients' | 'account')}
        />
      </View>
    );
  }

  return (
    <Home
      plans={mine.plans}
      history={sessions.sessions}
      onSavePlan={mine.save}
      onDeletePlan={mine.remove}
      onFinishSession={sessions.add}
      canEdit={isPt}
      extraTabs={[
        {
          key: 'account',
          label: 'Account',
          icon: 'account' as const,
          render: () => (
            <AccountScreen
              profile={profile}
              onChanged={reload}
              onSwitch={
                isPt
                  ? {
                      label: 'Torna ai miei ragazzi',
                      hint: 'Torna alla gestione dei ragazzi che segui.',
                      onPress: () => {
                        setPtTab('clients');
                        setPtMode('manage');
                      },
                    }
                  : undefined
              }
            />
          ),
        },
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
      <SafeAreaView style={styles.root} edges={['top']}>
        <StatusBar style="light" />
        <View style={styles.container}>{cloudEnabled ? <CloudGate /> : <LocalApp />}</View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  // Su web limita la larghezza per un aspetto "da telefono" anche sul PC
  container: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', backgroundColor: colors.bg },
});
