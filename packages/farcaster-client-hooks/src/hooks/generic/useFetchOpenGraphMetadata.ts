import { useCallback, useMemo } from 'react';

import { HtmlMetadata } from '../../utils/HtmlMetadata';

const BLOCKED_EXTENSIONS = ['.pdf', '.jpeg', '.png', '.xml'];
const DEFAULT_TIMEOUT_MS = 3_500;
const MAX_HTML_BYTES = 60_000;

const MAX_TITLE_LENGTH = 256;
const MAX_DESCRIPTION_LENGTH = 512;
const MAX_URL_LENGTH = 2048;

// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS_REGEX = /[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]+/g;
const COLLAPSE_WHITESPACE_REGEX = /\s+/g;

const metadataCache = new Map<string, FetchOpenGraphMetadataResult>();

type FetchOpenGraphMetadataStatus =
  | 'card_found'
  | 'card_not_found'
  | 'invalid_target'
  | 'request_failed';

type InvalidTargetReason =
  | 'empty_url'
  | 'invalid_url'
  | 'non_https'
  | 'unsupported_extension';

type RequestFailedReason = 'timeout' | 'network_error' | 'http_error';

type FetchOpenGraphMetadataResult =
  | {
      status: 'invalid_target';
      requestedUrl: string;
      reason: InvalidTargetReason;
    }
  | {
      status: 'request_failed';
      requestedUrl: string;
      reason: RequestFailedReason;
    }
  | {
      status: 'card_not_found';
      requestedUrl: string;
      finalUrl?: string;
      metadata: HtmlMetadata;
    }
  | {
      status: 'card_found';
      requestedUrl: string;
      finalUrl?: string;
      metadata: HtmlMetadata;
    };

type FetchOpenGraphMetadataCardFoundResult = Extract<
  FetchOpenGraphMetadataResult,
  { status: 'card_found' }
>;

type FetchOpenGraphMetadataOptions = {
  timeoutMs?: number;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

const cacheResult = (
  key: string,
  result: FetchOpenGraphMetadataResult,
): FetchOpenGraphMetadataResult => {
  if (result.status !== 'request_failed') {
    metadataCache.set(key, result);
  }
  return result;
};

const getCachedResult = (
  key: string,
): FetchOpenGraphMetadataResult | undefined => {
  return metadataCache.get(key);
};

const getCacheSnapshot = () => new Map(metadataCache);

const isUnsupportedExtension = (parsedUrl: URL): boolean => {
  const pathname = parsedUrl.pathname.toLowerCase();
  return BLOCKED_EXTENSIONS.some((extension) => pathname.endsWith(extension));
};

const hasCardWorthyContent = (metadata: HtmlMetadata): boolean => {
  return [
    metadata.ogTitle,
    metadata.titleTag,
    metadata.ogDescription,
    metadata.description,
    metadata.ogImageUrlString,
    metadata.faviconUrlString,
  ].some(Boolean);
};

const readLimitedHtml = async (
  response: Response,
  maxBytes: number,
): Promise<string> => {
  if (response.body && typeof response.body.getReader === 'function') {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let accumulated = '';
    let bytesRead = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      if (value) {
        bytesRead += value.byteLength;
        accumulated += decoder.decode(value, { stream: true });
      }

      if (bytesRead >= maxBytes) {
        await reader.cancel();
        break;
      }
    }

    accumulated += decoder.decode();
    return accumulated.slice(0, maxBytes);
  }

  const text = await response.text();
  return text.slice(0, maxBytes);
};

const createInvalidTargetResult = (
  requestedUrl: string,
  reason: InvalidTargetReason,
): FetchOpenGraphMetadataResult => ({
  status: 'invalid_target',
  requestedUrl,
  reason,
});

const createRequestFailedResult = (
  requestedUrl: string,
  reason: RequestFailedReason,
): FetchOpenGraphMetadataResult => ({
  status: 'request_failed',
  requestedUrl,
  reason,
});

const createMetadataResult = (
  status: Extract<
    FetchOpenGraphMetadataStatus,
    'card_found' | 'card_not_found'
  >,
  requestedUrl: string,
  metadata: HtmlMetadata,
  finalUrl?: string,
): FetchOpenGraphMetadataResult => ({
  status,
  requestedUrl,
  finalUrl,
  metadata,
});

const determineFinalUrl = (response: Response, requestedUrl: string) => {
  return response.url?.length ? response.url : requestedUrl;
};

const sanitizeTextField = (
  value: string | undefined,
  maxLength: number,
): string | undefined => {
  if (!value) {
    return undefined;
  }

  const normalizedEscapes = value.replace(/\\[nrvtf]/gi, ' ');

  const cleaned = normalizedEscapes
    .replace(CONTROL_CHARACTERS_REGEX, '')
    .replace(COLLAPSE_WHITESPACE_REGEX, ' ')
    .trim();

  if (!cleaned) {
    return undefined;
  }

  return cleaned.slice(0, maxLength);
};

const sanitizeUrlField = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  const normalizedEscapes = value.replace(/\[nrvtf]/gi, '');

  const cleaned = normalizedEscapes
    .replace(CONTROL_CHARACTERS_REGEX, '')
    .replace(COLLAPSE_WHITESPACE_REGEX, '')
    .trim();
  if (!cleaned) {
    return undefined;
  }

  return cleaned.slice(0, MAX_URL_LENGTH);
};

const sanitizeMetadata = (metadata: HtmlMetadata): HtmlMetadata => {
  return new HtmlMetadata({
    titleTag: sanitizeTextField(metadata.titleTag, MAX_TITLE_LENGTH),
    faviconUrlString: sanitizeUrlField(metadata.faviconUrlString),
    description: sanitizeTextField(
      metadata.description,
      MAX_DESCRIPTION_LENGTH,
    ),
    ogTitle: sanitizeTextField(metadata.ogTitle, MAX_TITLE_LENGTH),
    ogDescription: sanitizeTextField(
      metadata.ogDescription,
      MAX_DESCRIPTION_LENGTH,
    ),
    ogImageUrlString: sanitizeUrlField(metadata.ogImageUrlString),
    ogPublishDateString: sanitizeTextField(
      metadata.ogPublishDateString,
      MAX_TITLE_LENGTH,
    ),
    articlePublishDateString: sanitizeTextField(
      metadata.articlePublishDateString,
      MAX_TITLE_LENGTH,
    ),
    ogModifiedDateString: sanitizeTextField(
      metadata.ogModifiedDateString,
      MAX_TITLE_LENGTH,
    ),
    articleModifiedDateString: sanitizeTextField(
      metadata.articleModifiedDateString,
      MAX_TITLE_LENGTH,
    ),
  });
};

const fetchOpenGraphMetadataInternal = async (
  targetUrl: string,
  options: FetchOpenGraphMetadataOptions = {},
): Promise<FetchOpenGraphMetadataResult> => {
  const trimmedUrl = targetUrl?.trim?.() ?? '';
  if (!trimmedUrl) {
    return cacheResult(
      trimmedUrl,
      createInvalidTargetResult(trimmedUrl, 'empty_url'),
    );
  }

  const cachedResult = getCachedResult(trimmedUrl);
  if (cachedResult) {
    return cachedResult;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    return cacheResult(
      trimmedUrl,
      createInvalidTargetResult(trimmedUrl, 'invalid_url'),
    );
  }

  if (parsedUrl.protocol !== 'https:') {
    return cacheResult(
      trimmedUrl,
      createInvalidTargetResult(trimmedUrl, 'non_https'),
    );
  }

  if (isUnsupportedExtension(parsedUrl)) {
    return cacheResult(
      trimmedUrl,
      createInvalidTargetResult(trimmedUrl, 'unsupported_extension'),
    );
  }

  const controller = new AbortController();
  let abortCleanup: (() => void) | undefined;

  if (options.signal) {
    const abortSignal = options.signal;
    if (abortSignal.aborted) {
      controller.abort(abortSignal.reason);
    } else {
      const propagateAbort = () => controller.abort(abortSignal.reason);
      abortSignal.addEventListener('abort', propagateAbort);
      abortCleanup = () =>
        abortSignal.removeEventListener('abort', propagateAbort);
    }
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutId =
    timeoutMs > 0
      ? setTimeout(() => controller.abort('timeout'), timeoutMs)
      : undefined;

  try {
    const response = await fetch(parsedUrl.toString(), {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'WhatsApp/2',
      },
    });

    if (!response.ok) {
      return createRequestFailedResult(trimmedUrl, 'http_error');
    }

    const contentType = response.headers?.get?.('content-type')?.toLowerCase();
    if (!contentType || !contentType.includes('html')) {
      return cacheResult(
        trimmedUrl,
        createMetadataResult(
          'card_not_found',
          trimmedUrl,
          new HtmlMetadata(),
          determineFinalUrl(response, trimmedUrl),
        ),
      );
    }

    const rawHtml = await readLimitedHtml(response, MAX_HTML_BYTES);
    const metadata = sanitizeMetadata(HtmlMetadata.construct(rawHtml));
    const status = hasCardWorthyContent(metadata)
      ? 'card_found'
      : 'card_not_found';

    return cacheResult(
      trimmedUrl,
      createMetadataResult(
        status,
        trimmedUrl,
        metadata,
        determineFinalUrl(response, trimmedUrl),
      ),
    );
  } catch (error) {
    const isAbortError =
      (typeof DOMException !== 'undefined' &&
        error instanceof DOMException &&
        error.name === 'AbortError') ||
      (error &&
        typeof error === 'object' &&
        'name' in error &&
        (error as { name?: string }).name === 'AbortError');
    const reason =
      controller.signal.reason === 'timeout' || isAbortError
        ? 'timeout'
        : 'network_error';
    return createRequestFailedResult(trimmedUrl, reason);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    abortCleanup?.();
  }
};

const clearFetchOpenGraphMetadataCacheForTests = () => {
  metadataCache.clear();
};

const getFetchOpenGraphMetadataCacheSnapshotForTests = () => {
  return getCacheSnapshot();
};

function useFetchOpenGraphMetadata() {
  const fetchMetadata = useCallback(fetchOpenGraphMetadataInternal, []);

  const getCachedMetadata = useCallback((url: string) => {
    const trimmedUrl = url?.trim?.() ?? '';
    if (!trimmedUrl) {
      return undefined;
    }
    return getCachedResult(trimmedUrl);
  }, []);

  const getCachedMetadataSnapshot = useCallback(() => getCacheSnapshot(), []);

  return useMemo(
    () => ({
      fetchOpenGraphMetadata: fetchMetadata,
      getCachedOpenGraphMetadata: getCachedMetadata,
      getCachedOpenGraphMetadataSnapshot: getCachedMetadataSnapshot,
    }),
    [fetchMetadata, getCachedMetadata, getCachedMetadataSnapshot],
  );
}

export type {
  FetchOpenGraphMetadataCardFoundResult,
  FetchOpenGraphMetadataOptions,
  FetchOpenGraphMetadataResult,
  FetchOpenGraphMetadataStatus,
  InvalidTargetReason,
  RequestFailedReason,
};

export {
  clearFetchOpenGraphMetadataCacheForTests,
  fetchOpenGraphMetadataInternal as fetchOpenGraphMetadataForTests,
  getFetchOpenGraphMetadataCacheSnapshotForTests,
  useFetchOpenGraphMetadata,
};
