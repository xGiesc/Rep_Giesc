import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Banner } from '../Banner';
import { Button } from '../components';
import { unlockBiometric } from '../biometric';
import { supabase } from '../supabase';
import { colors, spacing } from '../theme';

/** Schermata di blocco: si sblocca con impronta / Face ID. */
export function LockScreen({ userId, onUnlock }: { userId: string; onUnlock: () => void }) {
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const attempt = async () => {
    setBusy(true);
    const ok = await unlockBiometric(userId);
    setBusy(false);
    if (ok) onUnlock();
    else setFailed(true);
  };
  useEffect(() => {
    attempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={{ flex: 1 }}>
      <Banner />
      <View style={styles.body}>
        <Text style={styles.title}>App bloccata</Text>
        <Text style={styles.sub}>{failed ? 'Sblocco non riuscito. Riprova.' : 'Usa impronta o Face ID per entrare.'}</Text>
        <Button label={busy ? '…' : 'Sblocca'} onPress={attempt} disabled={busy} />
        <Button label="Esci dall’account" variant="ghost" onPress={() => supabase?.auth.signOut()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.md, marginTop: spacing.xl },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', textAlign: 'center' },
  sub: { color: colors.muted, fontSize: 15, textAlign: 'center' },
});
