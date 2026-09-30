import { ApiDomainManifest } from 'farcaster-client-data';

const buildMiniappsHostedManifestFetcher =
  ({ id }: { id: string }) =>
  async () => {
    // TODO: Replace with FarcasterApiClient.miniappsHostedManifest once it supports an `id` parameter
    const response = await fetch(
      `https://api.farcaster.xyz/miniapps/hosted-manifest/${id}`,
    );

    if (!response.ok) {
      throw new Error('Failed to fetch miniapp hosted manifest');
    }

    const data = (await response.json()) as ApiDomainManifest;

    return data;
  };

export { buildMiniappsHostedManifestFetcher };
