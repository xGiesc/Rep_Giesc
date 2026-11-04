import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Chip, Field, Header } from '../components';
import { fmtRest } from '../format';
import { colors, spacing } from '../theme';
import { DEFAULT_REST, Exercise, Plan, newId, restOf } from '../types';
import { EXERCISES } from '../exerciseDb';
import { ExercisePicker } from './ExercisePicker';

const toInt = (s: string, fallback: number, min = 1) => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n >= min ? n : fallback;
};

const REST_PRESETS = [30, 60, 90, 120, 180];

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

  // modulo "esercizio" (nuovo oppure in modifica)
  const [picking, setPicking] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [exName, setExName] = useState('');
  const [exDbId, setExDbId] = useState<string | undefined>(undefined);
  const [exSets, setExSets] = useState('3');
  const [exReps, setExReps] = useState('10');
  const [exRest, setExRest] = useState(String(DEFAULT_REST));

  const resetForm = () => {
    setEditingId(null);
    setExName('');
    setExDbId(undefined);
    setExSets('3');
    setExReps('10');
    setExRest(String(DEFAULT_REST));
  };

  const loadForEdit = (e: Exercise) => {
    setEditingId(e.id);
    setExName(e.name);
    setExDbId(e.dbId);
    setExSets(String(e.sets));
    setExReps(String(e.reps));
    setExRest(String(restOf(e)));
  };

  const submitExercise = () => {
    const trimmed = exName.trim();
    if (!trimmed) return;
    const data = {
      name: trimmed,
      dbId: exDbId,
      sets: toInt(exSets, 3),
      reps: toInt(exReps, 10),
      rest: toInt(exRest, DEFAULT_REST, 0),
    };
    setExercises((prev) =>
      editingId
        ? prev.map((e) => (e.id === editingId ? { ...e, ...data } : e))
        : [...prev, { id: newId(), ...data }],
    );
    resetForm();
  };

  const removeExercise = (id: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== id));
    if (editingId === id) resetForm();
  };

  const save = () => {
    onSave({
      id: plan?.id ?? newId(),
      name: name.trim() || 'Scheda senza nome',
      exercises,
    });
  };

  if (picking) {
    return (
      <ExercisePicker
        onClose={() => setPicking(false)}
        onPick={(pickedName, dbId) => {
          setExName(pickedName);
          setExDbId(dbId);
          setPicking(false);
        }}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Header title={plan ? 'Modifica scheda' : 'Nuova scheda'} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
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
          <Card
            key={e.id}
            style={[
              styles.exRow,
              editingId === e.id && { borderColor: colors.accent },
            ]}
          >
            <Pressable style={{ flex: 1 }} onPress={() => loadForEdit(e)}>
              <Text style={styles.exName}>
                {i + 1}. {e.name}
              </Text>
              <Text style={styles.muted}>
                {e.sets} serie × {e.reps} rip. · recupero {fmtRest(restOf(e))}
              </Text>
              <Text style={styles.edit}>Tocca per modificare</Text>
            </Pressable>
            <Pressable onPress={() => removeExercise(e.id)} hitSlop={10}>
              <Text style={styles.remove}>Rimuovi</Text>
            </Pressable>
          </Card>
        ))}

        <Card style={{ gap: spacing.md }}>
          <Text style={styles.formTitle}>
            {editingId ? 'Modifica esercizio' : 'Nuovo esercizio'}
          </Text>

          <Pressable onPress={() => setPicking(true)} style={styles.pick}>
            <Text style={exName ? styles.pickValue : styles.pickPlaceholder}>
              {exName || `Scegli dall’elenco (${EXERCISES.length} esercizi)…`}
            </Text>
            <Text style={styles.pickArrow}>›</Text>
          </Pressable>
          {exName && exDbId ? (
            <Text style={styles.muted}>
              Con animazione e istruzioni nella scheda dell’esercizio.
            </Text>
          ) : null}
          {exName && !exDbId ? (
            <Text style={styles.muted}>
              Nome personalizzato: l’animazione compare solo se il nome è riconosciuto.
            </Text>
          ) : null}

          <View style={styles.row}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Field
                label="Serie"
                value={exSets}
                onChangeText={setExSets}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Field
                label="Ripetizioni"
                value={exReps}
                onChangeText={setExReps}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Field
            label="Recupero tra le serie (secondi, 0 = nessun timer)"
            value={exRest}
            onChangeText={setExRest}
            keyboardType="numeric"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.presets}>
              {REST_PRESETS.map((s) => (
                <Chip
                  key={s}
                  label={fmtRest(s)}
                  active={exRest.trim() === String(s)}
                  onPress={() => setExRest(String(s))}
                />
              ))}
            </View>
          </ScrollView>

          <Button
            label={editingId ? 'Aggiorna esercizio' : 'Aggiungi alla scheda'}
            variant={editingId ? 'primary' : 'ghost'}
            onPress={submitExercise}
            disabled={!exName.trim()}
          />
          {editingId ? (
            <Button label="Annulla modifica" variant="ghost" onPress={resetForm} />
          ) : null}
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
  formTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 13 },
  edit: { color: colors.accent, fontSize: 12, marginTop: 2 },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  exName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  remove: { color: colors.danger, fontWeight: '600' },
  row: { flexDirection: 'row', gap: spacing.sm },
  presets: { flexDirection: 'row', gap: spacing.sm },
  pick: {
    backgroundColor: colors.cardAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickPlaceholder: { color: colors.muted, fontSize: 16, flex: 1 },
  pickValue: { color: colors.text, fontSize: 16, fontWeight: '600', flex: 1 },
  pickArrow: { color: colors.accent, fontSize: 22, fontWeight: '700' },
});
