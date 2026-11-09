import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Chip, Field, Header } from '../components';
import {
  ACTIVITY, AIMS, Goals, NutritionProfile, num, suggestGoals, validProfile,
} from '../nutrition';
import { colors, spacing } from '../theme';

const txt = (n: number | undefined) => (n ? String(n) : '');

/** Obiettivi di calorie e macro: calcolo dai dati personali oppure valori a mano. */
export function GoalsScreen({
  goals, by, who, onSave, onClear, onBack,
}: {
  goals: Goals | null;
  /** chi sta salvando: l'atleta o il suo personal trainer */
  by: 'self' | 'pt';
  /** nome dell'atleta (solo vista PT) */
  who?: string;
  onSave: (g: Goals) => void;
  onClear?: () => void;
  onBack: () => void;
}) {
  const pr = goals?.profile;
  const [sex, setSex] = useState<'m' | 'f'>(pr?.sex ?? 'm');
  const [age, setAge] = useState(txt(pr?.age));
  const [weight, setWeight] = useState(txt(pr?.weight));
  const [height, setHeight] = useState(txt(pr?.height));
  const [activity, setActivity] = useState<NutritionProfile['activity']>(pr?.activity ?? 'moderate');
  const [aim, setAim] = useState<NutritionProfile['aim']>(pr?.aim ?? 'maintain');
  const [kcal, setKcal] = useState(txt(goals?.kcal));
  const [p, setP] = useState(txt(goals?.p));
  const [c, setC] = useState(txt(goals?.c));
  const [f, setF] = useState(txt(goals?.f));

  const profile: Partial<NutritionProfile> = {
    sex, age: num(age), weight: num(weight), height: num(height), activity, aim,
  };
  const canCalc = validProfile(profile);
  const calc = () => {
    if (!validProfile(profile)) return;
    const s = suggestGoals(profile);
    setKcal(String(s.kcal)); setP(String(s.p)); setC(String(s.c)); setF(String(s.f));
  };
  const fromMacros = Math.round(num(p) * 4 + num(c) * 4 + num(f) * 9);
  const k = Math.round(num(kcal));
  const valid = k >= 800 && k <= 8000 && num(p) >= 0 && num(c) >= 0 && num(f) >= 0;

  return (
    <View style={{ flex: 1 }}>
      <Header title={who ? `Obiettivi di ${who}` : 'Obiettivi'} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: spacing.md }}>
          <Text style={styles.h}>Calcolo automatico</Text>
          <Text style={styles.muted}>Inserisci i dati e premi «Calcola»: poi puoi modificare i valori a mano.</Text>
          <View style={styles.row}>
            <Chip label="Uomo" active={sex === 'm'} onPress={() => setSex('m')} />
            <Chip label="Donna" active={sex === 'f'} onPress={() => setSex('f')} />
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1 }}><Field label="Età" value={age} onChangeText={setAge} keyboardType="number-pad" placeholder="30" testID="goal-age" /></View>
            <View style={{ flex: 1 }}><Field label="Peso (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="75" testID="goal-weight" /></View>
            <View style={{ flex: 1 }}><Field label="Altezza (cm)" value={height} onChangeText={setHeight} keyboardType="number-pad" placeholder="175" testID="goal-height" /></View>
          </View>
          <Text style={styles.label}>Attività</Text>
          <View style={styles.wrap}>
            {ACTIVITY.map((a) => <Chip key={a.key} label={a.label} active={activity === a.key} onPress={() => setActivity(a.key)} />)}
          </View>
          <Text style={styles.label}>Obiettivo</Text>
          <View style={styles.wrap}>
            {AIMS.map((a) => <Chip key={a.key} label={a.label} active={aim === a.key} onPress={() => setAim(a.key)} />)}
          </View>
          <Button label="Calcola" variant="ghost" onPress={calc} disabled={!canCalc} />
        </Card>

        <Card style={{ gap: spacing.md }}>
          <Text style={styles.h}>Obiettivo giornaliero</Text>
          <Field label="Calorie (kcal)" value={kcal} onChangeText={setKcal} keyboardType="number-pad" placeholder="2200" testID="goal-kcal" />
          <View style={styles.row}>
            <View style={{ flex: 1 }}><Field label="Proteine (g)" value={p} onChangeText={setP} keyboardType="number-pad" testID="goal-p" /></View>
            <View style={{ flex: 1 }}><Field label="Carbo (g)" value={c} onChangeText={setC} keyboardType="number-pad" testID="goal-c" /></View>
            <View style={{ flex: 1 }}><Field label="Grassi (g)" value={f} onChangeText={setF} keyboardType="number-pad" testID="goal-f" /></View>
          </View>
          {fromMacros > 0 ? <Text style={styles.muted}>I macro inseriti valgono circa {fromMacros} kcal.</Text> : null}
        </Card>

        <Button
          label="Salva obiettivo"
          disabled={!valid}
          onPress={() => {
            onSave({
              kcal: k, p: Math.round(num(p)), c: Math.round(num(c)), f: Math.round(num(f)), by,
              profile: validProfile(profile) ? profile : undefined,
            });
            onBack();
          }}
        />
        {onClear && goals ? (
          <Button label="Rimuovi obiettivo" variant="ghost" onPress={() => { onClear(); onBack(); }} />
        ) : null}
        <Text style={styles.note}>Valori indicativi: non sostituiscono il parere di un medico o di un nutrizionista.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  h: { color: colors.text, fontSize: 17, fontWeight: '800' },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  row: { flexDirection: 'row', gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  note: { color: colors.muted, fontSize: 12, textAlign: 'center' },
});
