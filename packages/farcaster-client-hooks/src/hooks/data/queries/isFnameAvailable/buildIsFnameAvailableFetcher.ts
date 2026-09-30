import { FarcasterApiClient, isFarcasterApiError } from 'farcaster-client-data';

const buildIsFnameAvailableFetcher =
  ({ apiClient, fname }: { apiClient: FarcasterApiClient; fname: string }) =>
  async () => {
    try {
      await apiClient.getFname({ fname });
      return { isAvailable: false };
    } catch (error) {
      if (isFarcasterApiError(error) && error.status === 400) {
        return { isAvailable: true };
      }

      // This is an unexpected error. Let's default to assuming the username is available.
      return { isAvailable: true };
    }
  };

export { buildIsFnameAvailableFetcher };
