import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Header } from '../components';
import { Profile, fetchClients } from '../cloud';
import { colors, spacing } from '../theme';

export function ClientsScreen({
  code,
  onOpen,
}: {
  code: string;
  onOpen: (c: Profile) => void;
}) {
  const [clients, setClients] = useState<Profile[] | null>(null);
  useEffect(() => {
    fetchClients().then(setClients);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Header title="I miei ragazzi" />
      <ScrollView contentContainerStyle={styles.list}>
        {clients === null ? <Text style={styles.muted}>Caricamento…</Text> : null}
        {clients?.length === 0 ? (
          <Text style={styles.empty}>
            Nessun ragazzo collegato. Dai loro il tuo codice {code}: lo inseriscono in
            registrazione o da Account.
          </Text>
        ) : null}
        {clients?.map((c) => (
          <Pressable key={c.id} onPress={() => onOpen(c)}>
            <Card style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{c.name || c.email}</Text>
                <Text style={styles.muted}>{c.email}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { color: colors.text, fontSize: 18, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 13 },
  arrow: { color: colors.accent, fontSize: 24, fontWeight: '700' },
  empty: { color: colors.muted, textAlign: 'center', marginTop: spacing.xl },
});
