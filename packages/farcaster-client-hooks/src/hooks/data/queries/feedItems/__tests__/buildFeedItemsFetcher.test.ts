import {
  ApiGetFeedItems200Response,
  DEFAULT_TIMEOUT_FEED_ITEMS,
  FarcasterApiClient,
} from 'farcaster-client-data';
import { describe, expect, it, vi } from 'vitest';

import { InternalEventingContextValue } from '../../../../../providers/InternalEventingProvider';
import { BatchMergeIntoGloballyCachedCasts } from '../../../../../types';
import {
  buildFeedItemsFetcher,
  feedItemsDetermineNextPageParams,
  feedItemsDeterminePrevPageParams,
} from '../buildFeedItemsFetcher';

// Minimal page fixture: the page-param functions only read result.items[].id
// and result.latestMainCastTimestamp, so we don't need a full API response.
function makePage(
  ids: string[],
  latestMainCastTimestamp = 1_700_000_000,
): ApiGetFeedItems200Response {
  return {
    result: {
      items: ids.map((id) => ({ id })),
      latestMainCastTimestamp,
    },
  } as unknown as ApiGetFeedItems200Response;
}

const NULL_PAGE = null as unknown as ApiGetFeedItems200Response;

describe('feedItemsDetermineNextPageParams', () => {
  it('returns undefined when the last page has no items', () => {
    const page = makePage([]);
    expect(feedItemsDetermineNextPageParams(page, [page])).toBeUndefined();
  });

  it('returns undefined (no deref crash) when the last page is null', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const firstPage = makePage(['0xAABBCCDD11']);

    expect(
      feedItemsDetermineNextPageParams(NULL_PAGE, [firstPage]),
    ).toBeUndefined();
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });

  it('builds excludeItemIdPrefixes from 8-char lowercased id prefixes across all pages', () => {
    const page1 = makePage(['0xAABBCCDD11', '0xEEFF001122']);
    const page2 = makePage(['0x3344556677']);

    const params = feedItemsDetermineNextPageParams(page2, [page1, page2]);

    expect(params?.excludeItemIdPrefixes).toEqual([
      'aabbccdd',
      'eeff0011',
      '33445566',
    ]);
  });

  it('memoizes the prefix list on the allPages array reference', () => {
    const page = makePage(['0xAABBCCDD11']);
    const allPages = [page];

    const first = feedItemsDetermineNextPageParams(page, allPages);
    const second = feedItemsDetermineNextPageParams(page, allPages);

    // Same allPages reference -> same prefix array instance (memo hit). This is
    // the optimization's correctness contract: the list must not go stale, and
    // must not be rebuilt on every hasNextPage evaluation.
    expect(first?.excludeItemIdPrefixes).toBe(second?.excludeItemIdPrefixes);

    // A new allPages array (an appended page) invalidates the memo and includes
    // the new page's prefix — guards against a stale dedupe list.
    const page2 = makePage(['0x99AABBCCDD']);
    const rebuilt = feedItemsDetermineNextPageParams(page2, [page, page2]);

    expect(rebuilt?.excludeItemIdPrefixes).not.toBe(
      first?.excludeItemIdPrefixes,
    );
    expect(rebuilt?.excludeItemIdPrefixes).toContain('99aabbcc');
  });

  it('skips a null page within allPages without throwing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const page = makePage(['0xAABBCCDD11']);

    const params = feedItemsDetermineNextPageParams(page, [NULL_PAGE, page]);

    expect(params?.excludeItemIdPrefixes).toEqual(['aabbccdd']);

    warn.mockRestore();
  });
});

describe('feedItemsDeterminePrevPageParams', () => {
  it('builds prefixes and carries latestMainCastTimestamp from the first page', () => {
    const page1 = makePage(['0xAABBCCDD11'], 1234);
    const page2 = makePage(['0x3344556677'], 5678);

    const params = feedItemsDeterminePrevPageParams(page1, [page1, page2]);

    expect(params.latestMainCastTimestamp).toBe(1234);
    expect(params.excludeItemIdPrefixes).toEqual(['aabbccdd', '33445566']);
    expect(params.olderThan).toBeUndefined();
  });

  it('skips a null page within allPages without throwing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const page = makePage(['0xAABBCCDD11'], 1234);

    const params = feedItemsDeterminePrevPageParams(page, [page, NULL_PAGE]);

    expect(params.excludeItemIdPrefixes).toEqual(['aabbccdd']);

    warn.mockRestore();
  });
});

describe('buildFeedItemsFetcher', () => {
  it('disables client-level retries so React Query owns the retry loop (NEYN-13137)', async () => {
    const getFeedItems = vi
      .fn()
      .mockResolvedValue({ data: { result: { items: [] } }, status: 200 });

    const fetcher = buildFeedItemsFetcher({
      apiClient: { getFeedItems } as unknown as FarcasterApiClient,
      feedKey: 'home',
      feedType: 'default',
      updateState: true,
      batchUpdateGloballyCachedCast:
        vi.fn() as unknown as BatchMergeIntoGloballyCachedCasts,
      internalEventsTracker: {
        getAndRemoveCastViewEvents: vi.fn().mockReturnValue([]),
        addBackCastViewEvents: vi.fn(),
      } as unknown as InternalEventingContextValue,
      onNullFeedItemsResponse: vi.fn(),
    });

    await fetcher({ pageParam: undefined });

    // retryLimit: 0 matters: getFeedItems is a POST, so the client's
    // fetchWithRetry loop would otherwise nest inside React Query's retries
    // (up to 12 requests per failed pagination).
    expect(getFeedItems).toHaveBeenCalledWith(expect.any(Object), {
      timeout: DEFAULT_TIMEOUT_FEED_ITEMS,
      retryLimit: 0,
    });
  });
});
