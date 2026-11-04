import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Stato persistente su dispositivo (AsyncStorage: su web usa il localStorage
 * del browser). Restituisce anche `loaded` per evitare di sovrascrivere i dati
 * salvati con il valore iniziale prima del caricamento.
 */
export function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  const initialRef = useRef(initial);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (!active) return;
        if (raw !== null) {
          try {
            setValue(JSON.parse(raw) as T);
          } catch {
            setValue(initialRef.current);
          }
        }
      })
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        AsyncStorage.setItem(key, JSON.stringify(resolved)).catch(() => {});
        return resolved;
      });
    },
    [key],
  );

  return [value, update, loaded] as const;
}
