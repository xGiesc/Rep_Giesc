/** Marchio: ciano (predefinito) o rosso. Si sceglie con EXPO_PUBLIC_BRAND=red in fase di build. */
export type BrandName = 'red' | 'cyan' | 'amber';

export const BRAND: BrandName =
  process.env.EXPO_PUBLIC_BRAND === 'red' ? 'red' : process.env.EXPO_PUBLIC_BRAND === 'amber' ? 'amber' : 'cyan';

const BRANDS = {
  red: { accent: '#e30613', accentInk: '#e30613', accentSoft: '#fde8ea', accentText: '#ffffff', word: 'rosso', ink: '#14141a', cardAlt: '#f4f4f7', border: '#e4e4ea', muted: '#6b6b76' },
  cyan: { accent: '#00c2ee', accentInk: '#0089ab', accentSoft: '#e0f7fd', accentText: '#04222b', word: 'azzurro', ink: '#14141a', cardAlt: '#f4f4f7', border: '#e4e4ea', muted: '#6b6b76' },
  amber: { accent: '#ffa400', accentInk: '#b86a00', accentSoft: '#fff1d1', accentText: '#1b1d21', word: 'arancio', ink: '#1f2227', cardAlt: '#f0f1f3', border: '#dcdee2', muted: '#656a73' },
} as const;

export const brand = BRANDS[BRAND];
