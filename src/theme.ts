export const colors = {
  bg: '#f1f1f3',
  card: '#ffffff',
  cardAlt: '#f1f1f3',
  border: '#e3e3e7',
  text: '#0b0b0c',
  muted: '#6f6f78',
  accent: '#0b0b0c',
  accentText: '#ffffff',
  success: '#0b0b0c',
  danger: '#4a4a52',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = { sm: 10, md: 14, lg: 22, pill: 999 };

/** Ombra morbida per card (su web e native). */
export const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.07,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;
