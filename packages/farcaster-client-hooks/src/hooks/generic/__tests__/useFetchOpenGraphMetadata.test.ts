import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HtmlMetadata } from '../../../utils/HtmlMetadata';
import {
  clearFetchOpenGraphMetadataCacheForTests,
  fetchOpenGraphMetadataForTests,
} from '../useFetchOpenGraphMetadata';

const realFetch = globalThis.fetch;

const createHtmlResponse = (html: string, init?: ResponseInit) =>
  new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
    ...init,
  });

describe('useFetchOpenGraphMetadata', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearFetchOpenGraphMetadataCacheForTests();
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.useRealTimers();
  });

  it('returns invalid_target when url is empty', async () => {
    const result = await fetchOpenGraphMetadataForTests('');
    expect(result).toEqual({
      status: 'invalid_target',
      requestedUrl: '',
      reason: 'empty_url',
    });
  });

  it('returns invalid_target for non-https url', async () => {
    const result = await fetchOpenGraphMetadataForTests('http://example.com');
    expect(result).toEqual({
      status: 'invalid_target',
      requestedUrl: 'http://example.com',
      reason: 'non_https',
    });
  });

  it('returns invalid_target for blocked extension', async () => {
    const result = await fetchOpenGraphMetadataForTests(
      'https://example.com/file.pdf',
    );
    expect(result).toEqual({
      status: 'invalid_target',
      requestedUrl: 'https://example.com/file.pdf',
      reason: 'unsupported_extension',
    });
  });

  it('returns card_found when metadata exists', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        createHtmlResponse(
          '<meta property="og:title" content="Hello World" />',
        ),
      );

    const result = await fetchOpenGraphMetadataForTests(
      'https://example.com/article',
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, requestInit] = fetchSpy.mock.calls[0] as [
      RequestInfo,
      RequestInit,
    ];
    expect(requestInit?.headers).toMatchObject({
      'User-Agent': expect.any(String),
    });
    expect(result.status).toBe('card_found');
    if (result.status !== 'card_found') {
      throw new Error('Expected card_found status');
    }
    expect(result.requestedUrl).toBe('https://example.com/article');
    expect(result.metadata).toEqual(
      new HtmlMetadata({ ogTitle: 'Hello World' }),
    );
  });

  it('reuses cached results for repeated fetches', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        createHtmlResponse(
          '<meta property="og:title" content="Cached Title" />',
        ),
      );

    const first = await fetchOpenGraphMetadataForTests(
      'https://example.com/cached',
    );
    expect(first.status).toBe('card_found');

    fetchSpy.mockImplementation(() => {
      throw new Error('fetch should not be called when cached');
    });

    const second = await fetchOpenGraphMetadataForTests(
      'https://example.com/cached',
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  it('returns card_not_found when no metadata present', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createHtmlResponse('<html><body>No OG Tags</body></html>'),
    );

    const result = await fetchOpenGraphMetadataForTests(
      'https://example.com/empty',
    );

    expect(result.status).toBe('card_not_found');
  });

  it('returns card_not_found when content type not html', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"message":"nope"}', {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      }),
    );

    const result = await fetchOpenGraphMetadataForTests(
      'https://example.com/data',
    );

    expect(result).toEqual({
      status: 'card_not_found',
      requestedUrl: 'https://example.com/data',
      finalUrl: 'https://example.com/data',
      metadata: new HtmlMetadata(),
    });
  });

  it('returns request_failed on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('boom'));

    const result = await fetchOpenGraphMetadataForTests(
      'https://example.com/error',
    );

    expect(result).toEqual({
      status: 'request_failed',
      requestedUrl: 'https://example.com/error',
      reason: 'network_error',
    });
  });

  it('returns request_failed when response status is not ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('<html></html>', {
        status: 401,
        headers: {
          'content-type': 'text/html',
        },
      }),
    );

    const result = await fetchOpenGraphMetadataForTests(
      'https://example.com/protected',
    );

    expect(result).toEqual({
      status: 'request_failed',
      requestedUrl: 'https://example.com/protected',
      reason: 'http_error',
    });
  });

  it('sanitizes metadata before returning', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createHtmlResponse(
        `
          <meta property="og:title" content="   Hello   World   ">
          <meta property="og:description" content="Line1\\nLine2">
          <meta property="og:image" content="   https://example.com/image.jpg     ">
        `,
      ),
    );

    const result = await fetchOpenGraphMetadataForTests(
      'https://example.com/sanitize',
    );

    if (result.status !== 'card_found') {
      throw new Error('Expected sanitized result to be card_found');
    }

    expect(result.metadata.ogTitle).toBe('Hello World');
    expect(result.metadata.ogDescription).toBe('Line1 Line2');
    expect(result.metadata.ogImageUrlString).toBe(
      'https://example.com/image.jpg',
    );
  });

  it('returns request_failed timeout when request exceeds timeout', async () => {
    vi.useFakeTimers();

    vi.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    });

    const resultPromise = fetchOpenGraphMetadataForTests(
      'https://example.com/slow',
      { timeoutMs: 10 },
    );

    await vi.advanceTimersByTimeAsync(20);

    await expect(resultPromise).resolves.toEqual({
      status: 'request_failed',
      requestedUrl: 'https://example.com/slow',
      reason: 'timeout',
    });
  });
});
