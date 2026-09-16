import { FarcasterApiClient } from 'farcaster-client-data';

const buildInviteFetcher =
  ({
    inviteId,
    inviteCode,
    apiClient,
  }: {
    inviteId?: string;
    inviteCode?: string;
    apiClient: FarcasterApiClient;
  }) =>
  async () => {
    const response = await apiClient.getInvite({
      inviteId,
      inviteCode,
    });

    return response.data.result;
  };

export { buildInviteFetcher };
