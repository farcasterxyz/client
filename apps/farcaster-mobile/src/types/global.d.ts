declare module '*.jpg';
declare module '*.webp';
declare module '*.png';
declare module '*.svg';

/** Same as packages/farcaster-expo/src/types/global.d.ts — app tsc checks linked farcaster-expo sources. */
declare module 'expo-asset/build/resolveAssetSource' {
  function resolveAssetSource(source: unknown): unknown;
  export = resolveAssetSource;
}
