import { NetworkMode } from '@tanstack/react-query';
import { isFarcasterApiError } from 'farcaster-client-data';

// Never retry a rate-limited (HTTP 429) feed-items request. React Query's
// default retry (2 on web, 3 on mobile) would turn one throttled request into
// several more — amplifying the very load the limit is trying to shed — and
// still land in an error state once the retries exhaust, so on a 429 we give up
// immediately. Transient failures (network / 5xx) still retry, capped at a
// fixed 3 across platforms to match the mobile client default and the retry
// count used by sibling query hooks (e.g. useDirectCastConversation). This is
// one extra retry vs. web's default of 2; the shared helper can't read each
// app's ambient default, so we pick a single value.
// `error` is typed `Error` (not `unknown`) on purpose: React Query infers the
// query's TError from this predicate's parameter, so `unknown` here would widen
// `query.error` to `unknown` for every feed consumer (e.g. VideoScreen's
// useState<Error | null>). Error is React Query v5's default and what the fetch
// layer actually throws (HandledFetchError / UnhandledFetchError).
const retryFeedItemsUnlessRateLimited = (
  failureCount: number,
  error: Error,
): boolean => {
  if (isFarcasterApiError(error) && error.status === 429) {
    return false;
  }
  return failureCount < 3;
};

const feedItemsDefaultQueryOptions = (feedKey: string) => {
  if (feedKey === 'home' || feedKey === 'following') {
    return {
      retry: retryFeedItemsUnlessRateLimited,
      networkMode: 'offlineFirst' as NetworkMode,
    };
  }

  // Refresh the video feed every time the user opens it.
  if (feedKey === 'video') {
    return {
      retry: retryFeedItemsUnlessRateLimited,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      staleTime: 0,
      gcTime: 0,
      networkMode: 'offlineFirst' as NetworkMode,
    };
  }

  return {
    retry: retryFeedItemsUnlessRateLimited,
  };
};

export { feedItemsDefaultQueryOptions, retryFeedItemsUnlessRateLimited };
