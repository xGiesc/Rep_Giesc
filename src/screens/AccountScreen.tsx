import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Field, Header } from '../components';
import { Logo } from '../Logo';
import { Profile, fetchProfile, joinPt, leavePt, updateName } from '../cloud';
import { supabase } from '../supabase';
import { colors, spacing } from '../theme';

export function AccountScreen({
  profile,
  onChanged,
  onSwitch,
}: {
  profile: Profile;
  onChanged: () => void;
  /** Solo PT: passa tra gestione ragazzi e allenamento personale. */
  onSwitch?: { label: string; hint: string; onPress: () => void };
}) {
  const [name, setName] = useState(profile.name);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [ptName, setPtName] = useState<string | null>(null);

  useEffect(() => {
    if (!profile.pt_id || profile.role === 'pt') return setPtName(null);
    fetchProfile(profile.pt_id).then((p) => setPtName(p?.name || p?.email || 'il tuo PT'));
  }, [profile.pt_id, profile.role]);

  return (
    <View style={{ flex: 1 }}>
      <Header title="Account" />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Logo width="100%" height={90} />
        <Card style={{ gap: spacing.md }}>
          <Text style={styles.muted}>
            {profile.email} · {profile.role === 'pt' ? 'Personal trainer' : 'Atleta'}
          </Text>
          <Field label="Nome" value={name} onChangeText={setName} />
          <Button
            label="Salva nome"
            variant="ghost"
            disabled={!name.trim() || name.trim() === profile.name}
            onPress={async () => {
              await updateName(profile.id, name.trim());
              onChanged();
            }}
          />
        </Card>

        {profile.role === 'pt' ? (
          <Card style={{ gap: spacing.sm }}>
            <Text style={styles.section}>Il tuo codice PT</Text>
            <Text style={styles.code}>{profile.invite_code}</Text>
            <Text style={styles.muted}>
              Dallo ai tuoi ragazzi: lo inseriscono quando si registrano (o da Account) e
              compaiono nella tua lista Clienti.
            </Text>
          </Card>
        ) : (
          <Card style={{ gap: spacing.md }}>
            <Text style={styles.section}>Il tuo personal trainer</Text>
            {profile.pt_id ? (
              <>
                <Text style={styles.muted}>Collegato a: {ptName ?? '…'}. Le schede che ti assegna compaiono in Schede.</Text>
                <Button
                  label="Scollega"
                  variant="ghost"
                  onPress={async () => {
                    await leavePt();
                    onChanged();
                  }}
                />
              </>
            ) : (
              <>
                <Field
                  label="Inserisci il codice che ti ha dato il PT"
                  value={code}
                  onChangeText={(t) => setCode(t.toUpperCase())}
                  autoCapitalize="characters"
                />
                {msg ? <Text style={{ color: colors.danger, fontSize: 13 }}>{msg}</Text> : null}
                <Button
                  label="Collegati"
                  disabled={code.trim().length < 4}
                  onPress={async () => {
                    const ok = await joinPt(code);
                    setMsg(ok ? null : 'Codice non valido.');
                    if (ok) onChanged();
                  }}
                />
              </>
            )}
          </Card>
        )}

        {onSwitch ? (
          <Card style={{ gap: spacing.sm }}>
            <Text style={styles.section}>Modalità</Text>
            <Text style={styles.muted}>{onSwitch.hint}</Text>
            <Button label={onSwitch.label} onPress={onSwitch.onPress} />
          </Card>
        ) : null}

        <Button label="Esci" variant="danger" onPress={() => supabase?.auth.signOut()} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.md },
  section: { color: colors.text, fontSize: 16, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 13 },
  code: { color: colors.accent, fontSize: 34, fontWeight: '800', letterSpacing: 4 },
});
