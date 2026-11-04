import { brand } from './brand';

export const colors = {
  bg: '#ffffff',
  card: '#ffffff',
  cardAlt: brand.cardAlt,
  border: brand.border,
  ink: brand.ink,
  text: brand.ink,
  muted: brand.muted,
  accent: brand.accent,
  accentInk: brand.accentInk,
  accentSoft: brand.accentSoft,
  accentText: brand.accentText,
  success: brand.ink,
  danger: brand.ink,
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
