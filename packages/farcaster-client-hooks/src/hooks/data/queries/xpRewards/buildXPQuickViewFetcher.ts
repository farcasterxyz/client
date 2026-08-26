import { FarcasterApiClient } from 'farcaster-client-data';

export type XPQuickViewResult = {
  totalUsdc: number;
  referralsCount: number;
};

export const buildXPQuickViewFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async (): Promise<XPQuickViewResult> => {
    const response = await apiClient.xpQuickView();
    return {
      totalUsdc: response.data.result.totalUsdc,
      referralsCount: response.data.result.referralsCount,
    };
  };
