import { DARK, brand } from './brand';

export const colors = {
  bg: DARK ? '#262624' : '#ffffff',
  card: DARK ? '#30302e' : '#ffffff',
  cardAlt: DARK ? '#3a3a37' : brand.cardAlt,
  border: DARK ? '#4a4a47' : brand.border,
  ink: DARK ? '#f3f2ee' : brand.ink,
  text: DARK ? '#f3f2ee' : brand.ink,
  muted: DARK ? '#a8a79f' : brand.muted,
  accent: brand.accent,
  accentInk: DARK ? brand.accent : brand.accentInk,
  accentSoft: DARK ? '#4a3a1c' : brand.accentSoft,
  accentText: brand.accentText,
  success: DARK ? '#f3f2ee' : brand.ink,
  danger: DARK ? '#ff8a78' : brand.ink,
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = { sm: 10, md: 14, lg: 22, pill: 999 };

/** Ombra morbida per card (su web e native). */
export const shadow = {
  shadowColor: '#14141a',
  shadowOpacity: 0.09,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 5 },
  elevation: 4,
} as const;
