import { FarcasterApiClient } from 'farcaster-client-data';

const buildMiniAppHomeEmbedFetcher =
  ({ domain, apiClient }: { domain: string; apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getMiniAppHomeEmbed({ domain });

    return response.data.result.embed;
  };

export { buildMiniAppHomeEmbedFetcher };
