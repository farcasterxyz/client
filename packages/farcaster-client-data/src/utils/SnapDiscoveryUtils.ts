import { FarcasterApiClient } from '../client/FarcasterApiClient';

/**
 * Uses the server-side OG metadata refresh endpoint to check whether the
 * Farcaster crawler recognises this URL as a snap. The refresh endpoint
 * busts the cache so we always get a fresh scrape.
 */
async function getSnapDiscoveryWarning(
  url: string,
  apiClient: FarcasterApiClient,
): Promise<string | null> {
  try {
    const res = await apiClient.devToolsRefreshOpenGraphMetadata({ url });
    const { openGraph } = res.data.result;

    if (openGraph.snap) {
      return null;
    }

    return 'The Farcaster crawler does not detect this URL as a snap. If your server returns HTML when the client doesn\'t request snap content, include a Link header with rel="alternate" and type="application/vnd.farcaster.snap+json" so crawlers can discover the snap. See https://docs.farcaster.xyz/snap/http-headers';
  } catch {
    return null;
  }
}

export { getSnapDiscoveryWarning };
