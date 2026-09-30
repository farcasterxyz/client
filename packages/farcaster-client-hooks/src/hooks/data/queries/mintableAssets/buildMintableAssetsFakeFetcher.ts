import { FarcasterApiClient } from 'farcaster-client-data';

const buildMintableAssetsFakeFetcher =
  ({ apiClient, url }: { apiClient: FarcasterApiClient; url: string }) =>
  async () => {
    const response = await apiClient.processCastAttachments({
      text: '',
      embeds: [url],
    });

    const result = response.data.result;

    if (typeof result.embeds !== 'undefined') {
      const openGraphEmbedForUrl = result.embeds.urls.find(
        (o) => o.openGraph.url === url,
      );
      if (
        typeof openGraphEmbedForUrl !== 'undefined' &&
        typeof openGraphEmbedForUrl.openGraph.nft !== 'undefined'
      ) {
        return { asset: openGraphEmbedForUrl.openGraph.nft };
      }
    }

    return { asset: undefined };
  };

export { buildMintableAssetsFakeFetcher };
