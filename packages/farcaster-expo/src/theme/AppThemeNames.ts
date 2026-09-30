export type AppThemeName = 'light' | 'dark' | 'holiday-light' | 'holiday-dark';

export type SavedThemeName = AppThemeName | 'system';

export const SUPPORTED_THEME_NAMES: Set<SavedThemeName> = new Set([
  'light',
  'dark',
  'system',
  'holiday-light',
  'holiday-dark',
]);

export const DEFAULT_SAVED_THEME: SavedThemeName = 'dark';

export const systemSavedThemeNamesSet: Set<SavedThemeName> = new Set([
  'system',
]);

export const lightSavedThemeNamesSet: Set<SavedThemeName> = new Set([
  'light',
  'holiday-light',
]);

export const darkSavedThemeNamesSet: Set<SavedThemeName> = new Set([
  'dark',
  'holiday-dark',
]);

export const festiveSavedThemeNamesSet: Set<SavedThemeName> = new Set([
  'holiday-light',
  'holiday-dark',
]);
