import type { getTheme, TypographyLabel } from '../../../../theme';
import type { TextColor } from '../Typography';
import type { ButtonHierarchy, ButtonSize } from './types';

export const buttonSizeToTypographySize: Record<ButtonSize, TypographyLabel> = {
  xs: 'Semibold/S',
  s: 'Semibold/Base',
  m: 'Semibold/Base',
  l: 'Semibold/L',
};

export const buttonHierarchyToTypographyColor: Record<
  ButtonHierarchy,
  TextColor
> = {
  primary: 'light',
  secondary: 'primary',
  tertiary: 'primary',
  overlay: 'primary',
  translucent: 'brand',
  danger: 'light',
  dangerSecondary: 'danger',
};

export const buttonHierarchyToBackground: Record<
  ButtonHierarchy,
  keyof ReturnType<typeof getTheme>['backgrounds'] | string
> = {
  primary: 'brand',
  secondary: 'secondary',
  tertiary: 'primary',
  overlay: 'translucent',
  translucent: 'brandLight',
  danger: 'dangerLight',
  dangerSecondary: 'primary',
};

export const buttonSizeToHeight: Record<ButtonSize, number> = {
  xs: 30,
  s: 34,
  m: 40,
  l: 48,
};

export const buttonSizeToRadius: Record<ButtonSize, number> = {
  xs: 8,
  s: 8,
  m: 12,
  l: 16,
};

export const buttonHierarchyToBorderColor: Record<
  ButtonHierarchy,
  keyof ReturnType<typeof getTheme>['borders'] | undefined
> = {
  primary: undefined,
  secondary: undefined,
  tertiary: 'tertiary',
  overlay: 'primary',
  translucent: undefined,
  danger: undefined,
  dangerSecondary: 'danger',
};

export const buttonSizeToIconSize: Record<ButtonSize, number> = {
  xs: 16,
  s: 16,
  m: 20,
  l: 20,
};
