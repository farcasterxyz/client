import { useInvalidateOnboardingState } from 'farcaster-client-hooks';
import React, { FC, ReactNode, useLayoutEffect, useState } from 'react';

type InvalidateAndPurgeQueryCachesOnStartupProps = {
  children: ReactNode;
};

// When the app launches, React Query will try to restore its cache state from disk.
// This is generally desirable, but there are some endpoints that we may always want
// to ensure are freshly fetched on app restart. While `PrefetchAuthedResources` is
// one way we can solve this, we may not always want to eagerly perform the fetch.
// This cache invalidation is an alternative approach that lets us ensure stale data
// isn't used without fetching data before we need it.
const InvalidateAndPurgeQueryCachesOnStartup: FC<
  InvalidateAndPurgeQueryCachesOnStartupProps
> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  const invalidateOnboardingState = useInvalidateOnboardingState();

  useLayoutEffect(() => {
    // Onboarding state is critical for the user sign-in/onboarding state, so we always want this to be fresh.
    invalidateOnboardingState();

    setIsReady(true);
  }, [invalidateOnboardingState]);

  if (!isReady) {
    return null;
  }

  return <>{children}</>;
};

export { InvalidateAndPurgeQueryCachesOnStartup };
