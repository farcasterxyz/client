import { FarcasterApiClient } from 'farcaster-client-data';

const buildLookupOnboardingStateFetcher =
  ({ apiClient, email }: { apiClient: FarcasterApiClient; email: string }) =>
  async () => {
    return await apiClient.lookupOnboardingState({ email });
  };

export { buildLookupOnboardingStateFetcher };
