import React, { useEffect, useState } from 'react';
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, Card, Chip, Header } from '../components';
import { fmtRest } from '../format';
import {
  LEVEL_IT,
  equipmentLabel,
  findExercise,
  imageUrl,
  muscleLabel,
  videoSearchUrl,
} from '../exerciseDb';
import { colors, spacing } from '../theme';

/**
 * Scheda dell'esercizio: immagini che si alternano (posizione di partenza e di
 * arrivo), muscoli, istruzioni e link per cercare il video su YouTube.
 */
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
  const [frame, setFrame] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);

  const frames = ex?.images ?? 0;
  useEffect(() => {
    if (frames < 2) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % frames), 900);
    return () => clearInterval(id);
  }, [frames]);

  return (
    <View style={{ flex: 1 }}>
      <Header title={ex?.name ?? name} onBack={onClose} />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.plan}>
          In scheda: {sets} serie × {reps} ripetizioni · recupero {fmtRest(rest)}
        </Text>

        {ex && frames > 0 && !imgFailed ? (
          <View style={styles.media}>
            <Image
              source={{ uri: imageUrl(ex.id, frame) }}
              style={styles.image}
              resizeMode="contain"
              onError={() => setImgFailed(true)}
            />
            <Text style={styles.mediaHint}>
              Posizione {frame + 1} di {frames}
            </Text>
          </View>
        ) : (
          <View style={[styles.media, styles.noMedia]}>
            <Text style={styles.muted}>
              {ex
                ? 'Immagini non disponibili (serve la connessione).'
                : 'Esercizio personalizzato: nessuna immagine disponibile.'}
            </Text>
          </View>
        )}

        <Button
          label="▶ Guarda video su YouTube"
          onPress={() => Linking.openURL(videoSearchUrl(ex?.name ?? name))}
        />

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
                In arancione i muscoli principali, in grigio i secondari.
              </Text>
              <Text style={styles.muted}>
                Attrezzo: {equipmentLabel(ex.equipment)}
                {ex.level ? ` · Livello: ${LEVEL_IT[ex.level] ?? ex.level}` : ''}
              </Text>
            </Card>

            {ex.instructions.length > 0 ? (
              <Card style={{ gap: spacing.sm }}>
                <Text style={styles.section}>Come si esegue</Text>
                {ex.instructions.map((step, i) => (
                  <View key={i} style={styles.step}>
                    <Text style={styles.stepNum}>{i + 1}</Text>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
                <Text style={styles.muted}>Istruzioni in inglese.</Text>
              </Card>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.md },
  plan: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  media: {
    backgroundColor: colors.cardAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  noMedia: { padding: spacing.xl, paddingBottom: spacing.xl },
  image: { width: '100%', height: 260 },
  mediaHint: { color: colors.muted, fontSize: 12, marginTop: spacing.xs },
  section: { color: colors.text, fontSize: 18, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  muted: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  step: { flexDirection: 'row', gap: spacing.md },
  stepNum: {
    color: colors.accent,
    fontWeight: '800',
    width: 18,
    fontSize: 14,
  },
  stepText: { color: colors.text, fontSize: 14, lineHeight: 20, flex: 1 },
});
