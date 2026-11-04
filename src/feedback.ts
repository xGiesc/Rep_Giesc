import { Platform, Vibration } from 'react-native';

/**
 * Segnali a fine recupero e schermo sempre acceso (solo dove supportato).
 * Tutto è "best effort": se il dispositivo non supporta una funzione, si
 * ignora in silenzio.
 */

let audioCtx: AudioContext | null = null;

/** Da chiamare dentro un tocco dell'utente: sblocca l'audio su iPhone/Safari. */
export function unlockAudio() {
  if (Platform.OS !== 'web') return;
  try {
    const Ctx =
      (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx ?? new Ctx();
    if (audioCtx && audioCtx.state === 'suspended') void audioCtx.resume();
  } catch {
    /* ignora */
  }
}

function beep(frequency: number, startAt: number, duration: number) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.35, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.05);
}

/** Tre bip + vibrazione quando il recupero è finito. */
export function restFinishedAlert() {
  try {
    Vibration.vibrate([0, 300, 150, 300, 150, 300]);
  } catch {
    /* ignora */
  }
  if (Platform.OS === 'web' && audioCtx) {
    try {
      const t = audioCtx.currentTime;
      beep(880, t, 0.18);
      beep(880, t + 0.28, 0.18);
      beep(1175, t + 0.56, 0.35);
    } catch {
      /* ignora */
    }
  }
}

/** Tiene lo schermo acceso durante l'allenamento (web). Restituisce la funzione di rilascio. */
export function keepScreenAwake(): () => void {
  if (Platform.OS !== 'web') return () => {};
  const nav: any = (globalThis as any).navigator;
  const doc: any = (globalThis as any).document;
  if (!nav?.wakeLock || !doc) return () => {};

  let lock: any = null;
  let stopped = false;

  const request = async () => {
    try {
      lock = await nav.wakeLock.request('screen');
    } catch {
      lock = null;
    }
  };
  const onVisible = () => {
    if (!stopped && doc.visibilityState === 'visible') void request();
  };

  void request();
  doc.addEventListener('visibilitychange', onVisible);
  return () => {
    stopped = true;
    doc.removeEventListener('visibilitychange', onVisible);
    try {
      void lock?.release();
    } catch {
      /* ignora */
    }
  };
}
