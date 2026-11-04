import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Chip, Field, Header } from '../components';
import {
  EQUIPMENT_FILTERS,
  MUSCLE_FILTERS,
  equipmentLabel,
  muscleLabel,
  searchExercises,
} from '../exerciseDb';
import { colors, spacing } from '../theme';

/**
 * Lista di tutti gli esercizi del database, con ricerca per nome e filtri per
 * muscolo e attrezzo. Se il nome cercato non c'è, si può usare come nome
 * personalizzato.
 */
export function ExercisePicker({
  onPick,
  onClose,
}: {
  onPick: (name: string, dbId?: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);

  const results = useMemo(
    () => searchExercises(query, muscle, equipment),
    [query, muscle, equipment],
  );
  const custom = query.trim();

  return (
    <View style={{ flex: 1 }}>
      <Header title="Scegli esercizio" onBack={onClose} />
      <View style={styles.filters}>
        <Field
          value={query}
          onChangeText={setQuery}
          placeholder="Cerca (es. bench press, squat, curl…)"
          autoCorrect={false}
          autoCapitalize="none"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            <Chip
              label="Tutti i muscoli"
              active={muscle === null}
              onPress={() => setMuscle(null)}
            />
            {MUSCLE_FILTERS.map((m) => (
              <Chip
                key={m}
                label={muscleLabel(m)}
                active={muscle === m}
                onPress={() => setMuscle(muscle === m ? null : m)}
              />
            ))}
          </View>
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            <Chip
              label="Ogni attrezzo"
              active={equipment === null}
              onPress={() => setEquipment(null)}
            />
            {EQUIPMENT_FILTERS.map((q) => (
              <Chip
                key={q}
                label={equipmentLabel(q)}
                active={equipment === q}
                onPress={() => setEquipment(equipment === q ? null : q)}
              />
            ))}
          </View>
        </ScrollView>
        <Text style={styles.count}>{results.length} esercizi</Text>
      </View>

      <FlatList
        data={results}
        keyExtractor={(e) => e.id}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={20}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          custom ? (
            <Pressable
              onPress={() => onPick(custom)}
              style={[styles.row, styles.customRow]}
            >
              <Text style={styles.name}>Usa “{custom}” come nome personalizzato</Text>
              <Text style={styles.sub}>Senza immagini né istruzioni</Text>
            </Pressable>
          ) : undefined
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            Nessun esercizio trovato. Prova con un altro nome (i nomi sono in
            inglese) o togli i filtri.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPick(item.name, item.id)}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.sub}>
              {item.primaryMuscles.map(muscleLabel).join(', ') || '—'} ·{' '}
              {equipmentLabel(item.equipment)}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  filters: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  chipRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: 2 },
  count: { color: colors.muted, fontSize: 12 },
  list: { padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  row: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 2,
  },
  customRow: { borderColor: colors.accent },
  name: { color: colors.text, fontSize: 15, fontWeight: '600' },
  sub: { color: colors.muted, fontSize: 12 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: spacing.xl },
});
