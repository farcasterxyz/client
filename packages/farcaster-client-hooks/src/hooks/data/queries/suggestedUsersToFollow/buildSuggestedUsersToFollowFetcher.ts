import { FarcasterApiClient } from 'farcaster-client-data';

const buildSuggestedUsersToFollowFetcher =
  ({
    apiClient,
    interests,
  }: {
    apiClient: FarcasterApiClient;
    interests?: string[];
  }) =>
  async () => {
    const response = await apiClient.getSuggestedUsersToFollow({
      interests: interests?.join(','),
    });

    return {
      users: response.data.result.users,
    };
  };

export { buildSuggestedUsersToFollowFetcher };
