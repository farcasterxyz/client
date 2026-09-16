import {
  ApiAccountSubscriptionType,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildSubscriptionsGetActiveSubscriptionFetcher =
  ({
    apiClient,
    type,
    fid,
  }: {
    apiClient: FarcasterApiClient;
    type: ApiAccountSubscriptionType;
    fid?: number;
  }) =>
  async () => {
    const response = await apiClient.getActiveSubscription({
      subscriptionType: type,
      fid,
    });
    return response.data.result.subscription ?? null;
  };

export { buildSubscriptionsGetActiveSubscriptionFetcher };
