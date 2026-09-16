import { FarcasterApiClient } from 'farcaster-client-data';

const buildMutedKeywordFetcher =
  ({
    apiClient,
    keyword,
  }: {
    apiClient: FarcasterApiClient;
    keyword: string;
  }) =>
  async () => {
    const response = await apiClient.getMutedKeyword({ keyword });
    return response.data.result;
  };

export { buildMutedKeywordFetcher };
