import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components';
import { colors, spacing } from '../theme';

/** La scansione usa la fotocamera del browser: serve la versione web (HTTPS) e un dispositivo con fotocamera. */
export const scannerSupported = () =>
  Platform.OS === 'web' && typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

/**
 * Schermata a tutto schermo con la fotocamera posteriore: legge i codici a barre dei prodotti (EAN/UPC)
 * e restituisce il numero. Il video resta sul dispositivo, non viene inviato né salvato.
 */
export function BarcodeScanner({ onCode, onClose }: { onCode: (code: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const done = useRef(false);

  useEffect(() => {
    let stop: (() => void) | null = null;
    let cancelled = false;
    (async () => {
      try {
        const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
          import('@zxing/browser'),
          import('@zxing/library'),
        ]);
        const hints = new Map<any, any>();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);
        const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 });
        // il primo fotogramma può essere letto prima che `controls` sia assegnato
        let controls: { stop: () => void } | null = null;
        controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' } }, audio: false },
          video.current!,
          (result) => {
            if (result && !done.current) {
              done.current = true;
              controls?.stop();
              onCode(result.getText());
            }
          },
        );
        const c = controls;
        stop = () => c.stop();
        if (cancelled || done.current) c.stop();
      } catch (e: any) {
        const name = String(e?.name ?? '');
        setError(
          name === 'NotAllowedError' || name === 'SecurityError'
            ? 'Accesso alla fotocamera negato. Consentilo dalle impostazioni del browser e riprova.'
            : name === 'NotFoundError'
              ? 'Nessuna fotocamera trovata su questo dispositivo.'
              : 'Impossibile avviare la fotocamera.',
        );
      }
    })();
    return () => {
      cancelled = true;
      stop?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.root} testID="scanner">
      <View style={styles.stage}>
        {React.createElement('video', {
          ref: video, muted: true, playsInline: true, autoPlay: true,
          style: { width: '100%', height: '100%', objectFit: 'cover', background: '#000' },
        })}
        <View style={styles.frame} pointerEvents="none" />
      </View>
      <View style={styles.bottom}>
        <Text style={styles.hint}>{error ?? 'Inquadra il codice a barre del prodotto'}</Text>
        <Button label="Annulla" variant="ghost" onPress={onClose} testID="scanner-close" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: {
    position: 'absolute', width: '78%', height: 150, borderWidth: 3, borderColor: colors.accent, borderRadius: 14,
  },
  bottom: { padding: spacing.lg, gap: spacing.md, backgroundColor: colors.bg },
  hint: { color: colors.text, textAlign: 'center', fontSize: 15, fontWeight: '600' },
});
