/** Marchio: arancio (predefinito), ciano o rosso. Si sceglie con EXPO_PUBLIC_BRAND=cyan|red in fase di build. */
export type BrandName = 'red' | 'cyan' | 'amber';

export const BRAND: BrandName =
  process.env.EXPO_PUBLIC_BRAND === 'red' ? 'red' : process.env.EXPO_PUBLIC_BRAND === 'cyan' ? 'cyan' : 'amber';

const BRANDS = {
  red: { accent: '#e30613', accentInk: '#e30613', accentSoft: '#fde8ea', accentText: '#ffffff', word: 'rosso', ink: '#14141a', cardAlt: '#f4f4f7', border: '#e4e4ea', muted: '#6b6b76' },
  cyan: { accent: '#00c2ee', accentInk: '#0089ab', accentSoft: '#e0f7fd', accentText: '#04222b', word: 'azzurro', ink: '#14141a', cardAlt: '#f4f4f7', border: '#e4e4ea', muted: '#6b6b76' },
  amber: { accent: '#ffa400', accentInk: '#b86a00', accentSoft: '#fff1d1', accentText: '#1b1d21', word: 'arancio', ink: '#1f2227', cardAlt: '#f0f1f3', border: '#dcdee2', muted: '#656a73' },
} as const;

export const brand = BRANDS[BRAND];

/** Tema scuro: scelto dall'utente (Account → Aspetto) e ricordato sul dispositivo; in build EXPO_PUBLIC_THEME=dark lo rende predefinito. */
export const THEME_KEY = 'theme';
function readTheme(): boolean {
  try {
    const v = typeof window !== 'undefined' ? window.localStorage.getItem(THEME_KEY) : null;
    if (v === 'dark') return true;
    if (v === 'light') return false;
  } catch {
    /* niente */
  }
  return process.env.EXPO_PUBLIC_THEME === 'dark';
}
export const DARK = readTheme();

/** Cambia tema: i colori sono letti all'avvio, quindi la pagina si ricarica. */
export function setTheme(dark: boolean) {
  try {
    window.localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
    window.location.reload();
  } catch {
    /* niente */
  }
}
