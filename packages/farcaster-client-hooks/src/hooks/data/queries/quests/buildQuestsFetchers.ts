import { FarcasterApiClient } from 'farcaster-client-data';

const buildQuestsFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getQuests();
    return response.data;
  };

const buildQuestFetcher =
  ({
    apiClient,
    questId,
  }: {
    apiClient: FarcasterApiClient;
    questId: string;
  }) =>
  async () => {
    const response = await apiClient.getQuest({ questId });
    return response.data;
  };

export { buildQuestFetcher, buildQuestsFetcher };
