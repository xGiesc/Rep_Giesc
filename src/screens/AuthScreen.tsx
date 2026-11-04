import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Field } from '../components';
import { Banner } from '../Banner';
import { PrivacyScreen } from './PrivacyScreen';
import { supabase } from '../supabase';
import { colors, spacing } from '../theme';

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);
  const [privacy, setPrivacy] = useState(false);

  const submit = async () => {
    if (!supabase) return;
    setBusy(true);
    setMsg(null);
    const mail = email.trim();
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
      if (error) setMsg('Email o password non corrette.');
    } else {
      if (password.length < 8) {
        setBusy(false);
        setMsg('La password deve avere almeno 8 caratteri.');
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email: mail,
        password,
        options: { data: { name: name.trim(), invite_code: code.trim() } },
      });
      if (error) {
        setMsg(
          /registered|already/i.test(error.message)
            ? 'Questa email è già registrata: usa "Accedi".'
            : /password/i.test(error.message)
              ? 'La password deve avere almeno 8 caratteri.'
              : 'Registrazione non riuscita: ' + error.message,
        );
      } else if (!data.session) {
        setMsg('Registrazione inviata: controlla la tua email per confermare, poi accedi.');
      }
    }
    setBusy(false);
  };

  const ok = email.includes('@') && password.length >= (mode === 'login' ? 1 : 8) && (mode === 'login' || (name.trim() && agree));

  if (privacy) return <PrivacyScreen onBack={() => setPrivacy(false)} />;

  return (
    <View style={{ flex: 1 }}>
      <Banner large />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <View style={styles.switch}>
        <Button
          label="Accedi"
          variant={mode === 'login' ? 'primary' : 'ghost'}
          onPress={() => setMode('login')}
          style={{ flex: 1 }}
        />
        <Button
          label="Registrati"
          variant={mode === 'register' ? 'primary' : 'ghost'}
          onPress={() => setMode('register')}
          style={{ flex: 1 }}
        />
      </View>
      {mode === 'register' ? (
        <Field label="Nome" value={name} onChangeText={setName} placeholder="Come ti chiami" />
      ) : null}
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Field
        label="Password (minimo 8 caratteri)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />
      {mode === 'register' ? (
        <Field
          label="Codice del tuo personal trainer (se ce l’hai)"
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          autoCapitalize="characters"
          placeholder="Es. A1B2C3D4"
        />
      ) : null}
      {mode === 'register' ? (
        <Pressable testID="agree" onPress={() => setAgree(!agree)} style={styles.agree}>
          <View style={[styles.box, agree && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
            {agree ? <Text style={{ color: colors.accentText, fontWeight: '900', fontSize: 12 }}>✓</Text> : null}
          </View>
          <Text style={styles.agreeText}>
            Ho letto l’
            <Text style={{ color: colors.accentInk, fontWeight: '800' }} onPress={() => setPrivacy(true)}>
              informativa privacy
            </Text>
          </Text>
        </Pressable>
      ) : (
        <Text style={styles.link} onPress={() => setPrivacy(true)}>Informativa privacy</Text>
      )}
      {msg ? <Text style={styles.msg}>{msg}</Text> : null}
      <Button
        label={busy ? '…' : mode === 'login' ? 'Accedi' : 'Crea account'}
        onPress={submit}
        disabled={busy || !ok}
      />
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.md },
  switch: { flexDirection: 'row', gap: spacing.sm },
  agree: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  agreeText: { color: colors.text, fontSize: 14, flex: 1 },
  link: { color: colors.muted, fontSize: 13, textAlign: 'center', textDecorationLine: 'underline' },
  msg: { color: colors.danger, fontSize: 14, textAlign: 'center' },
});
