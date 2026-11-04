import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Header } from '../components';
import { Profile, fetchClientsOverview } from '../cloud';
import { ago, daysLeft, fmtDate } from '../expiry';
import { colors, spacing } from '../theme';

type Row = Awaited<ReturnType<typeof fetchClientsOverview>>[number];

/** Home del PT: tutti i ragazzi, con scadenze e ultimo allenamento per i controlli. */
export function ClientsScreen({ code, onOpen }: { code: string; onOpen: (c: Profile) => void }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    fetchClientsOverview().then(setRows);
  }, []);

  const needCheck = rows?.filter((r) => r.status === 'expired' || r.status === 'soon').length ?? 0;

  return (
    <View style={{ flex: 1 }}>
      <Header title="I miei ragazzi" />
      <ScrollView contentContainerStyle={styles.list}>
        {rows === null ? <Text style={styles.muted}>Caricamento…</Text> : null}
        {rows && rows.length > 0 ? (
          <Text style={styles.summary}>
            {rows.length} {rows.length === 1 ? 'ragazzo' : 'ragazzi'}
            {needCheck > 0 ? ` · ${needCheck} da controllare` : ' · tutto in regola'}
          </Text>
        ) : null}
        {rows?.length === 0 ? (
          <Card style={{ gap: spacing.sm }}>
            <Text style={styles.name}>Nessun ragazzo collegato</Text>
            <Text style={styles.muted}>
              Dai loro il tuo codice: lo inseriscono in registrazione o da Account.
            </Text>
            <Text style={styles.code}>{code}</Text>
          </Card>
        ) : null}
        {rows?.map((r) => (
          <Pressable key={r.client.id} onPress={() => onOpen(r.client)}>
            <Card style={{ gap: spacing.sm }}>
              <View style={styles.top}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(r.client.name || r.client.email || '?').slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{r.client.name || r.client.email}</Text>
                  <Text style={styles.muted}>
                    {r.plans} {r.plans === 1 ? 'scheda' : 'schede'} ·{' '}
                    {r.lastWorkout ? `ultimo allenamento ${ago(r.lastWorkout)}` : 'nessun allenamento ancora'}
                  </Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </View>
              <View style={styles.pills}>
                <View
                  style={[
                    styles.pill,
                    r.status === 'expired' && { backgroundColor: colors.accent },
                    r.status === 'soon' && { backgroundColor: colors.accentSoft },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      r.status === 'expired' && { color: colors.accentText },
                      r.status === 'soon' && { color: colors.accentInk },
                    ]}
                  >
                    {r.status === 'none' && r.plans === 0
                      ? 'Nessuna scheda assegnata'
                      : r.status === 'none'
                        ? 'Schede senza scadenza'
                        : r.status === 'expired'
                          ? `Scheda scaduta il ${fmtDate(r.nextExpiry!)}`
                          : `Prossima scadenza: ${fmtDate(r.nextExpiry!)} (${
                              daysLeft(r.nextExpiry!) === 0 ? 'oggi' : `tra ${daysLeft(r.nextExpiry!)} g`
                            })`}
                  </Text>
                </View>
                {r.workouts > 0 ? (
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>{r.workouts} allenamenti registrati</Text>
                  </View>
                ) : null}
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md },
  summary: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  name: { color: colors.text, fontSize: 18, fontWeight: '800' },
  muted: { color: colors.muted, fontSize: 13 },
  arrow: { color: colors.accentInk, fontSize: 26, fontWeight: '700' },
  code: { color: colors.accentInk, fontSize: 34, fontWeight: '900', letterSpacing: 4 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: { backgroundColor: colors.cardAlt, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { color: colors.text, fontSize: 12, fontWeight: '700' },
});
