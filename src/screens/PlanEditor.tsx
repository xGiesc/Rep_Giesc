import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Field, Header } from '../components';
import { colors, spacing } from '../theme';
import { Exercise, Plan, newId } from '../types';

const toInt = (s: string, fallback: number) => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export function PlanEditor({
  plan,
  onSave,
  onDelete,
  onBack,
}: {
  plan: Plan | null; // null = nuova scheda
  onSave: (plan: Plan) => void;
  onDelete?: (id: string) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState(plan?.name ?? '');
  const [exercises, setExercises] = useState<Exercise[]>(
    plan?.exercises ?? [],
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  // campi per aggiungere un esercizio
  const [exName, setExName] = useState('');
  const [exSets, setExSets] = useState('3');
  const [exReps, setExReps] = useState('10');

  const addExercise = () => {
    const trimmed = exName.trim();
    if (!trimmed) return;
    setExercises((prev) => [
      ...prev,
      {
        id: newId(),
        name: trimmed,
        sets: toInt(exSets, 3),
        reps: toInt(exReps, 10),
      },
    ]);
    setExName('');
  };

  const removeExercise = (id: string) =>
    setExercises((prev) => prev.filter((e) => e.id !== id));

  const save = () => {
    onSave({
      id: plan?.id ?? newId(),
      name: name.trim() || 'Scheda senza nome',
      exercises,
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title={plan ? 'Modifica scheda' : 'Nuova scheda'} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.body}>
        <Field
          label="Nome scheda"
          value={name}
          onChangeText={setName}
          placeholder="Es. Push, Gambe, Full body…"
        />

        <Text style={styles.section}>Esercizi</Text>
        {exercises.length === 0 ? (
          <Text style={styles.muted}>Nessun esercizio aggiunto.</Text>
        ) : null}
        {exercises.map((e, i) => (
          <Card key={e.id} style={styles.exRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.exName}>
                {i + 1}. {e.name}
              </Text>
              <Text style={styles.muted}>
                {e.sets} serie × {e.reps} ripetizioni
              </Text>
            </View>
            <Pressable onPress={() => removeExercise(e.id)} hitSlop={10}>
              <Text style={styles.remove}>Rimuovi</Text>
            </Pressable>
          </Card>
        ))}

        <Card style={{ gap: spacing.md }}>
          <Field
            label="Nuovo esercizio"
            value={exName}
            onChangeText={setExName}
            placeholder="Es. Panca piana"
          />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field
                label="Serie"
                value={exSets}
                onChangeText={setExSets}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Ripetizioni"
                value={exReps}
                onChangeText={setExReps}
                keyboardType="numeric"
              />
            </View>
          </View>
          <Button
            label="Aggiungi esercizio"
            variant="ghost"
            onPress={addExercise}
            disabled={!exName.trim()}
          />
        </Card>

        <Button label="Salva scheda" onPress={save} />
        {plan && onDelete ? (
          confirmDelete ? (
            <Button
              label="Tocca ancora per eliminare"
              variant="danger"
              onPress={() => onDelete(plan.id)}
            />
          ) : (
            <Button
              label="Elimina scheda"
              variant="ghost"
              onPress={() => setConfirmDelete(true)}
            />
          )
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.md },
  section: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  muted: { color: colors.muted, fontSize: 13 },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  exName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  remove: { color: colors.danger, fontWeight: '600' },
  row: { flexDirection: 'row', gap: spacing.sm },
});
