import type { ReactNode } from 'react';

export type CachedLinkifyResult = {
  linkifiedText: ReactNode;
  hasOnlyImages: boolean;
  imageUrls: string[];
};

const MAX_ENTRIES = 2000;
const cache = new Map<string, CachedLinkifyResult>();

export function getCachedResult(key: string): CachedLinkifyResult | undefined {
  return cache.get(key);
}

export function setCachedResult(key: string, value: CachedLinkifyResult): void {
  if (!cache.has(key) && cache.size >= MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }
  cache.set(key, value);
}

export function clearLinkifyResultCache(): void {
  cache.clear();
}
