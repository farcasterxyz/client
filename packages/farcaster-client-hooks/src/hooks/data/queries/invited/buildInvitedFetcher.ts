import { FarcasterApiClient } from 'farcaster-client-data';

const buildInvitedFetcher =
  ({ apiClient, email }: { apiClient: FarcasterApiClient; email: string }) =>
  async () => {
    return await apiClient.getIsUserInvited({ email });
  };

export { buildInvitedFetcher };
