import { FarcasterApiClient } from 'farcaster-client-data';

import { MergeIntoGloballyCachedFrame } from './framesGlobalCache';

export const buildFrameDetailsFetcher =
  ({
    domain,
    id,
    apiClient,
    mergeIntoGlobalCache,
  }: {
    domain?: string;
    id?: string;
    apiClient: FarcasterApiClient;
    mergeIntoGlobalCache: MergeIntoGloballyCachedFrame;
  }) =>
  async () => {
    const response = await apiClient.getFrameDetails({ domain, id });

    // We get undefined when a frame has no manifest, but React Query doesn't like
    // it as it overlaps with result being undefined while query is loading, so we
    // remap to null
    const frame = response.data.result.frame ?? null;
    if (frame) {
      mergeIntoGlobalCache(frame);
    }

    return frame;
  };
