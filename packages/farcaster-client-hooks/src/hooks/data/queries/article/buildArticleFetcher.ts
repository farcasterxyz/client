import { FarcasterApiClient } from 'farcaster-client-data';

const buildArticleFetcher =
  ({
    apiClient,
    publicId,
  }: {
    publicId: string;
    apiClient: FarcasterApiClient;
  }) =>
  async () => {
    const response = await apiClient.getArticle({
      publicId,
    });

    return response.data.result;
  };

export { buildArticleFetcher };
