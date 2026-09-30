import { ApiErrorResponse, HandledFetchError } from 'farcaster-client-data';
import { describe, expect, it } from 'vitest';

import { retryFeedItemsUnlessRateLimited } from '../feedItemsDefaultQueryOptions';

// A realistic feed-items API error: getFeedItems POSTs /v2/feed-items, and any
// >=400 response is surfaced as a HandledFetchError carrying the HTTP status.
function makeApiError(status: number): HandledFetchError {
  return new HandledFetchError(`getFeedItems ${status}`, {
    absoluteUrl: undefined,
    body: undefined,
    endpointName: 'getFeedItems',
    hasTimedOut: false,
    isHandled: true,
    isNetworkError: false,
    isOffline: false,
    method: 'POST',
    relativeUrl: '/v2/feed-items',
    resolvedTimeout: 8_000,
    response: undefined,
    responseData: { errors: [{ message: 'rate limited' }] } as ApiErrorResponse,
    status,
    timeout: 8_000,
  });
}

describe('retryFeedItemsUnlessRateLimited', () => {
  it('never retries a rate-limited (429) request, even on the first failure', () => {
    expect(retryFeedItemsUnlessRateLimited(0, makeApiError(429))).toBe(false);
  });

  it('retries transient (non-429) API errors up to 3 times', () => {
    const error = makeApiError(500);
    // failureCount is React Query's pre-increment count, so 0 is the 1st failure.
    expect(retryFeedItemsUnlessRateLimited(0, error)).toBe(true);
    expect(retryFeedItemsUnlessRateLimited(1, error)).toBe(true);
    expect(retryFeedItemsUnlessRateLimited(2, error)).toBe(true);
    expect(retryFeedItemsUnlessRateLimited(3, error)).toBe(false);
  });

  it('retries non-API errors (e.g. network failures) up to 3 times', () => {
    const error = new Error('network down');
    expect(retryFeedItemsUnlessRateLimited(0, error)).toBe(true);
    expect(retryFeedItemsUnlessRateLimited(2, error)).toBe(true);
    expect(retryFeedItemsUnlessRateLimited(3, error)).toBe(false);
  });
});
