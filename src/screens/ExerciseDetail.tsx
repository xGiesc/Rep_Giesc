import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { brand } from '../brand';
import { Card, Chip, Header } from '../components';
import { fmtRest } from '../format';
import { LEVEL_IT, equipmentLabel, findExercise, muscleLabel } from '../exerciseDb';
import { colors, radius, shadow, spacing } from '../theme';
import { ExerciseAnimation } from '../anim/ExerciseAnimation';
import { animationFor, animationForName } from '../anim/mapping';

/** Scheda dell'esercizio: animazione, muscoli e istruzioni. */
export function ExerciseDetail({
  name,
  dbId,
  sets,
  reps,
  rest,
  onClose,
}: {
  name: string;
  dbId?: string;
  sets: number;
  reps: number;
  rest: number;
  onClose: () => void;
}) {
  const ex = findExercise(dbId, name);
  const custom = !ex ? animationForName(name) : null;
  const anim = ex ? animationFor(ex) : custom;
  const primary = ex ? ex.primaryMuscles : custom?.primary ?? [];
  const secondary = ex ? ex.secondaryMuscles : custom?.secondary ?? [];

  return (
    <View style={{ flex: 1 }}>
      <Header title={ex?.name ?? name} onBack={onClose} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.planPill}>
          <Text style={styles.planPillText}>
            {sets} serie × {reps} rip. · recupero {fmtRest(rest)}
          </Text>
        </View>

        {anim ? (
          <View style={styles.media}>
            <ExerciseAnimation
              pattern={anim.pattern}
              impl={anim.impl}
              primary={primary}
              secondary={secondary}
            />
            <Text style={styles.mediaHint}>
              Animazione schematica · in rosso i muscoli che lavorano
            </Text>
          </View>
        ) : (
          <View style={[styles.media, styles.noMedia]}>
            <Text style={styles.muted}>
              Esercizio personalizzato: nessuna animazione disponibile.
            </Text>
          </View>
        )}

        {ex ? (
          <>
            <Card style={{ gap: spacing.sm }}>
              <Text style={styles.section}>Muscoli</Text>
              <View style={styles.chips}>
                {ex.primaryMuscles.map((m) => (
                  <Chip key={m} label={muscleLabel(m)} active onPress={() => {}} />
                ))}
                {ex.secondaryMuscles.map((m) => (
                  <Chip key={m} label={muscleLabel(m)} onPress={() => {}} />
                ))}
              </View>
              <Text style={styles.muted}>
                In {brand.word} i muscoli principali, in grigio i secondari.
              </Text>
              <Text style={styles.muted}>
                Attrezzo: {equipmentLabel(ex.equipment)} · Livello: {LEVEL_IT[ex.level] ?? ex.level}
              </Text>
            </Card>

            <Card style={{ gap: spacing.md }}>
              <Text style={styles.section}>Come si esegue</Text>
              {ex.instructions.map((step, i) => (
                <View key={i} style={styles.step}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepNum}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </Card>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.md },
  planPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  planPillText: { color: colors.accentText, fontSize: 13, fontWeight: '700' },
  media: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow,
  },
  noMedia: { padding: spacing.xl },
  mediaHint: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  section: { color: colors.text, fontSize: 18, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  muted: { color: colors.muted, fontSize: 12 },
  step: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNum: { color: colors.accentText, fontWeight: '800', fontSize: 12 },
  stepText: { color: colors.text, fontSize: 15, lineHeight: 21, flex: 1 },
});
