import { FarcasterApiClient } from 'farcaster-client-data';

const buildGenerateImageUploadUrlFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.generateImageUploadUrl();

    return response.data.result;
  };

export { buildGenerateImageUploadUrlFetcher };
