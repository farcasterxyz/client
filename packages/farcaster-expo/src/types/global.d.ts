declare module '*.jpg';
declare module '*.webp';
declare module '*.png';
declare module '*.svg';

/** Deep import; `expo-asset` package exports omit this path (Metro still resolves it). */
declare module 'expo-asset/build/resolveAssetSource' {
  function resolveAssetSource(source: unknown): unknown;
  export = resolveAssetSource;
}
