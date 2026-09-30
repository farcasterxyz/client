import { type ApiUser, FarcasterApiClient } from 'farcaster-client-data';

export type ReferralCodeJoinResult = {
  inviter: ApiUser;
  currentlyJoinedCreator?: ApiUser;
  code: string | undefined;
};

export const buildReferralCodeJoinFetcher =
  ({ apiClient, code }: { apiClient: FarcasterApiClient; code: string }) =>
  async (): Promise<ReferralCodeJoinResult> => {
    const response = await apiClient.getReferralCodeJoinInfo({ code: code });
    return {
      inviter: response.data.result.creator,
      currentlyJoinedCreator: response.data.result.currentlyJoinedCreator,
      code: code,
    };
  };
