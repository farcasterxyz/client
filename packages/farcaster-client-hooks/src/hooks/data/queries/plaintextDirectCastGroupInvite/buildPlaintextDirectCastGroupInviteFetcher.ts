import { FarcasterApiClient } from 'farcaster-client-data';

const buildPlaintextDirectCastGroupInviteFetcher =
  ({
    apiClient,
    conversationId,
    inviteCode,
  }: {
    apiClient: FarcasterApiClient;
    conversationId?: string;
    inviteCode?: string;
  }) =>
  async () => {
    const response = await apiClient.getDirectCastGroupInviteV3({
      conversationId: conversationId,
      inviteCode: inviteCode,
    });

    return response.data.result;
  };

export { buildPlaintextDirectCastGroupInviteFetcher };
