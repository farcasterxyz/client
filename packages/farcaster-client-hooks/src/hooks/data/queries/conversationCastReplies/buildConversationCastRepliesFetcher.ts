import { FarcasterApiClient } from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedCasts } from '../../../../types';

const PAGE_SIZE = 15;

export interface FetchState {
  excludeReplyHashes?: string[];
  maxPageIndex: number;
  cursor?: string;
  noMoreReplies: boolean;
}

export type PrefixesFetchStates = Record<string, Record<string, FetchState>>;

export const buildConversationCastRepliesFetcher =
  ({
    apiClient,
    focusedCastHash,
    parentCastHash,
    page,
    fetchStates,
    batchMergeIntoGloballyCachedCasts,
  }: {
    apiClient: FarcasterApiClient;
    // Should be present as we should have already loaded replies for
    // a user to click 'Show more'. We don't allow the focused cast to be deleted.
    focusedCastHash: string;
    parentCastHash: string;
    page: number;
    fetchStates: React.MutableRefObject<PrefixesFetchStates>;
    batchMergeIntoGloballyCachedCasts: BatchMergeIntoGloballyCachedCasts;
  }) =>
  async () => {
    const thisFetchStates = fetchStates.current[focusedCastHash];
    const fetchState = thisFetchStates[parentCastHash];
    const excludeReplyHashes = fetchState.excludeReplyHashes;

    const result = await apiClient.getConversationCastReplies({
      focusedCastHash,
      parentCastHash,
      excludeReplyHashes:
        excludeReplyHashes && excludeReplyHashes.length > 0
          ? excludeReplyHashes.join(',')
          : undefined,
      limit: PAGE_SIZE,
      cursor: fetchState.cursor,
    });

    if (result.data.next?.cursor) {
      fetchState.cursor = result.data.next.cursor;
    } else {
      fetchState.noMoreReplies = true;
    }

    const casts = result.data.result.casts;
    batchMergeIntoGloballyCachedCasts({
      batchUpdates: casts,
    });

    return {
      parentCastHash,
      page,
      casts,
    };
  };
