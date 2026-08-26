import { type ApiUser, FarcasterApiClient } from 'farcaster-client-data';

export type ReferralCodeResult = {
  inviter: ApiUser;
  code: string | undefined;
};

export const buildReferralCodeFetcher =
  ({ apiClient, code }: { apiClient: FarcasterApiClient; code: string }) =>
  async (): Promise<ReferralCodeResult> => {
    const response = await apiClient.getReferralCodeInfo({ code: code });
    return {
      inviter: response.data.result.creator,
      code: code,
    };
  };
