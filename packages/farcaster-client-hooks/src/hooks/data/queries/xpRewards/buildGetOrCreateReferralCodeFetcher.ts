import { FarcasterApiClient } from 'farcaster-client-data';

export type GetOrCreateReferralCodeResult = {
  code: string;
  id: string;
};

export const buildGetOrCreateReferralCodeFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async (): Promise<GetOrCreateReferralCodeResult> => {
    const response = await apiClient.getOrCreateReferralCode();
    return response.data.result;
  };
