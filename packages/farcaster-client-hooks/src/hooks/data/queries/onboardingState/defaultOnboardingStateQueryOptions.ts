import { NetworkMode } from '@tanstack/react-query';

const onboardingStateDefaultQueryOptions = {
  gcTime: Infinity,
  staleTime: Infinity,
  networkMode: 'offlineFirst' satisfies NetworkMode,
} as const;

export { onboardingStateDefaultQueryOptions };
