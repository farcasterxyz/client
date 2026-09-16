import { ApiCast } from 'farcaster-client-data';
import {
  ThreadItem,
  ThreadListItem,
  usePrefetchThread,
  usePrefetchUserCast,
} from 'farcaster-client-hooks';
import { useCallback } from 'react';

export function usePrefetchThreadCast() {
  const prefetchThread = usePrefetchThread();
  const prefetchUserCast = usePrefetchUserCast();

  return useCallback(
    (item: ThreadListItem<ThreadItem> | ApiCast) => {
      if (
        typeof item !== 'object' ||
        item === null ||
        ('type' in item && item.type !== 'cast') ||
        ('hash' in item && typeof item.hash !== 'string')
      ) {
        return;
      }

      let cast: ApiCast;
      if ('type' in item && item.type === 'cast') {
        cast = item.wrappedCast.cast;
      } else {
        cast = item;
      }

      prefetchThread({
        castHash: cast.hash,
        shouldAvoidUpdatingGlobalCache: true,
        shouldSkipIfRecentlyPrefetched: true,
      });

      if (
        typeof cast.embeds !== 'undefined' &&
        typeof cast.embeds.casts !== 'undefined'
      ) {
        for (const quote of cast.embeds.casts) {
          if (typeof quote.author.username !== 'undefined') {
            prefetchUserCast({
              hash: quote.hash,
              username: quote.author.username,
              shouldSkipIfRecentlyPrefetched: true,
            });
          }
        }
      }

      if (typeof cast.replies.casts !== 'undefined') {
        for (const reply of cast.replies.casts) {
          prefetchThread({
            castHash: reply.hash,
            shouldSkipIfRecentlyPrefetched: true,
          });
        }
      }
    },
    [prefetchThread, prefetchUserCast],
  );
}
