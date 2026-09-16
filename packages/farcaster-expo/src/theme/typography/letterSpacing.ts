export const letterSpacing = {
  // Body
  '-0.0375': -0.0375,
  '0.06': 0.06,
  '0.065': 0.065,
  '0.07': 0.07,

  // Heading
  '-0.07': -0.07,
  '-0.075': -0.075,
  '-0.34': -0.34,
  '−0.408': -0.408,
  '-1.44': -1.44,

  // OLD
  Normal: -0.09,
  '-0.25': -0.25,
  '2xs': -0.09,
  xs: -0.09,
  sm: -0.15,
  base: -0.15,
  lg: -0.25,
  xl: -0.25,
  '2xl': -0.25,
  '3xl': -0.25,
  '4xl': -0.25,
  '5xl': -0.09,
  '6xl': -0.09,
  '8xl': -0.09,
} as const;

export type LetterSpacing = keyof typeof letterSpacing;
