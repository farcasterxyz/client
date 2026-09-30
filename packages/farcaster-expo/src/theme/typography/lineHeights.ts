export const lineHeights = {
  $14: 14,
  $16: 16,
  $22: 22,
  $25: 25,
  $28: 28,
  $32: 32,
  $40: 40,
  $56: 56,
  // Old
  XS: 16,
  S: 20,
  B: 24,
  '4XL': 40,
  // OLD
  '2xs': 16,
  xs: 16,
  sm: 18,
  base: 20,
  lg: 24,
  xl: 26,
  '2xl': 32,
  '3xl': 36,
  '4xl': 40,
  '5xl': 42,
  '6xl': 48,
  '8xl': 64,
} as const;

export type LineHeight = keyof typeof lineHeights;
