import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Field } from '../components';
import { Banner } from '../Banner';
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

  const ok = email.includes('@') && password.length >= 6 && (mode === 'login' || name.trim());

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
        label="Password (minimo 6 caratteri)"
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
          placeholder="Es. A1B2C3"
        />
      ) : null}
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
  msg: { color: colors.danger, fontSize: 14, textAlign: 'center' },
});
