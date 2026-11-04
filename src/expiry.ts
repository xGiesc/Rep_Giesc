/** Scadenza delle schede: finestra temporale decisa dal PT (data di fine). */

const DAY = 86400000;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const fromIsoDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Data di scadenza tra `weeks` settimane da oggi. */
export const inWeeks = (weeks: number) => {
  const t = startOfDay(new Date());
  return toIsoDate(new Date(t.getFullYear(), t.getMonth(), t.getDate() + weeks * 7));
};

/** Giorni mancanti (negativo = scaduta da n giorni). */
export const daysLeft = (iso: string) =>
  Math.round((fromIsoDate(iso).getTime() - startOfDay(new Date()).getTime()) / DAY);

export const fmtDate = (iso: string) =>
  fromIsoDate(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });

export type Tone = 'ok' | 'soon' | 'expired';

export function expiryInfo(iso?: string): { text: string; tone: Tone } | null {
  if (!iso) return null;
  const d = daysLeft(iso);
  if (d < 0) return { text: `Scaduta il ${fmtDate(iso)}`, tone: 'expired' };
  if (d === 0) return { text: 'Scade oggi', tone: 'soon' };
  if (d === 1) return { text: 'Scade domani', tone: 'soon' };
  return { text: `Scade il ${fmtDate(iso)} · tra ${d} giorni`, tone: d <= 7 ? 'soon' : 'ok' };
}

/** "3 giorni fa", "oggi"… */
export function ago(iso: string) {
  const d = Math.round((startOfDay(new Date()).getTime() - startOfDay(new Date(iso)).getTime()) / DAY);
  if (d <= 0) return 'oggi';
  if (d === 1) return 'ieri';
  return `${d} giorni fa`;
}
