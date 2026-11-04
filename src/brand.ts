/** Marchio: ciano (predefinito) o rosso. Si sceglie con EXPO_PUBLIC_BRAND=red in fase di build. */
export type BrandName = 'red' | 'cyan';

export const BRAND: BrandName = process.env.EXPO_PUBLIC_BRAND === 'red' ? 'red' : 'cyan';

const BRANDS = {
  red: { accent: '#e30613', accentInk: '#e30613', accentSoft: '#fde8ea', accentText: '#ffffff', word: 'rosso' },
  cyan: { accent: '#00c2ee', accentInk: '#0089ab', accentSoft: '#e0f7fd', accentText: '#04222b', word: 'azzurro' },
} as const;

export const brand = BRANDS[BRAND];
