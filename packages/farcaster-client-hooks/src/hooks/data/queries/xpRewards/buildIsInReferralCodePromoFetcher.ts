import { type FarcasterApiClient } from 'farcaster-client-data';

export type IsInReferralCodePromoResult = {
  isInReferralCodePromo: boolean;
};

export const buildIsInReferralCodePromoFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async (): Promise<IsInReferralCodePromoResult> => {
    const response = await apiClient.isInReferralCodePromo();
    return {
      isInReferralCodePromo: response.data.result.isInReferralCodePromo,
    };
  };
