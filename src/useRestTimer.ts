import { useCallback, useEffect, useRef, useState } from 'react';
import { restFinishedAlert } from './feedback';

type Timer = {
  endsAt: number; // timestamp (ms) di fine
  total: number; // durata complessiva in secondi (per la barra di avanzamento)
  label: string;
};

/**
 * Timer di recupero basato su timestamp (non su un contatore): resta corretto
 * anche se il browser rallenta i timer quando lo schermo è spento.
 */
export function useRestTimer() {
  const [timer, setTimer] = useState<Timer | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const alerted = useRef(false);

  useEffect(() => {
    if (!timer) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [timer]);

  const remaining = timer ? Math.max(0, Math.ceil((timer.endsAt - now) / 1000)) : 0;
  const finished = !!timer && remaining === 0;

  useEffect(() => {
    if (finished && !alerted.current) {
      alerted.current = true;
      restFinishedAlert();
    }
  }, [finished]);

  // A recupero finito la barra si chiude da sola dopo qualche secondo
  useEffect(() => {
    if (!finished) return;
    const id = setTimeout(() => setTimer(null), 6000);
    return () => clearTimeout(id);
  }, [finished]);

  const start = useCallback((seconds: number, label: string) => {
    if (seconds <= 0) {
      setTimer(null);
      return;
    }
    alerted.current = false;
    setNow(Date.now());
    setTimer({ endsAt: Date.now() + seconds * 1000, total: seconds, label });
  }, []);

  const adjust = useCallback((deltaSeconds: number) => {
    setTimer((t) => {
      if (!t) return t;
      alerted.current = false;
      const endsAt = Math.max(Date.now() + 1000, t.endsAt + deltaSeconds * 1000);
      return { ...t, endsAt, total: Math.max(t.total + deltaSeconds, 1) };
    });
  }, []);

  const skip = useCallback(() => setTimer(null), []);

  return { active: !!timer, label: timer?.label ?? '', total: timer?.total ?? 0, remaining, finished, start, adjust, skip };
}
