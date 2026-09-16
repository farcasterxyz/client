import { NetworkMode } from '@tanstack/react-query';

const authenticatedUserDefaultQueryOptions = {
  staleTime: 1000 * 60 * 5,
  gcTime: Infinity,
  networkMode: 'offlineFirst' satisfies NetworkMode,
} as const;

export { authenticatedUserDefaultQueryOptions };
