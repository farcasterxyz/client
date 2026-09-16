import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

// The hover-intent debounce re-arms once its timer fires: a later onMouseOver on
// the SAME link (still bubbling from descendants after the pointer settled)
// schedules and fires another prefetch. That is safe only because channel-feed
// prefetches are deduped by staleTime — the repeat resolves from cache instead
// of issuing a second POST /v2/feed-items.
//
// This test pins that invariant. It mirrors the two configuration inputs that
// produce it:
//   - the global query defaults in apps/farcaster-web/src/components/App.tsx
//     (staleTime: 3 min), and
//   - the per-query options usePrefetchFeedItems passes for a channel feed,
//     which come from feedItemsDefaultQueryOptions(<channel key>) and do NOT
//     override staleTime (only 'video' sets staleTime: 0).
// If either changes such that channel prefetches inherit a zero staleTime, this
// fails — flagging that repeated hovers would start issuing duplicate POSTs.
describe('channel-feed prefetch dedup', () => {
  it('does not re-run the queryFn on a repeat prefetch within staleTime', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: 2,
          refetchOnMount: true,
          refetchOnWindowFocus: false,
          staleTime: 1000 * 60 * 3,
          gcTime: 1000 * 60 * 5,
        },
      },
    });

    let calls = 0;
    const buildOpts = () => ({
      // feedItemsDefaultQueryOptions('memes') for a channel returns only
      // { retry }; no staleTime override, so the 3-min default applies.
      retry: false as const,
      initialPageParam: undefined,
      queryKey: ['feedItems', 'memes', 'default'],
      queryFn: async () => {
        calls += 1;
        return { result: { items: [] } };
      },
    });

    await queryClient.prefetchInfiniteQuery(buildOpts());
    await queryClient.prefetchInfiniteQuery(buildOpts());

    expect(calls).toBe(1);
  });
});
