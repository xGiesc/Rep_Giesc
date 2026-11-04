import { brand } from './brand';

export const colors = {
  bg: '#ffffff',
  card: '#ffffff',
  cardAlt: '#f4f4f7',
  border: '#e4e4ea',
  ink: '#14141a',
  text: '#14141a',
  muted: '#6b6b76',
  accent: brand.accent,
  accentInk: brand.accentInk,
  accentSoft: brand.accentSoft,
  accentText: brand.accentText,
  success: '#14141a',
  danger: '#14141a',
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
