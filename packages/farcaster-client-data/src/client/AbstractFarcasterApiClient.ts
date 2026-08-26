/* eslint-disable no-console */
import assign from 'lodash/assign';
import isError from 'lodash/isError';
import qs from 'qs';

import {
  DeleteOptions,
  FarcasterApiClientMetaOptions,
  FarcasterApiClientOptions,
  Fetcher,
  FetchOptions,
  FetchResponse,
  GetOptions,
  HandledFetchError,
  isHandledFetchError,
  MutateFetchOptions,
  PatchOptions,
  PostOptions,
  PutOptions,
  RequestHeaders,
  RequestInfo,
  RequestMethod,
  RequestParams,
  RequestRelativeUrl,
  UndefinedFetchFunctionError,
  UnhandledFetchError,
} from '../types';
import { ApiErrorResponse } from '../types/api';
import { FetchErrorOptions, isFarcasterApiError } from '../types/errors';
import { mergeIntoDefaultOptions, stringifyError } from '../utils';

const defaultBaseUrl = 'https://client.farcaster.xyz';
const defaultWsUrl = 'wss://ws.farcaster.xyz/stream';
const defaultBaseWalletUrl = `http://localhost:9277`;
const defaultReadTimeout = 20 * 1000;
const defaultMutateTimeout = 22 * 1000;
const defaultRetryLimit = 2;
const retryDelay = 1000;

const getGlobalFetch = () =>
  globalThis.fetch ? globalThis.fetch.bind(globalThis) : undefined;

const getDefaultOptions = () => ({
  baseUrl: defaultBaseUrl,
  wsUrl: defaultWsUrl,
  baseWalletUrl: defaultBaseWalletUrl,
  getFetch: getGlobalFetch,
  readTimeout: defaultReadTimeout,
  mutateTimeout: defaultMutateTimeout,
  meta: {},
});

const generateIdempotencyKey = () => crypto.randomUUID();

// This class helps reduce a request's timeout by a decay factor on retries.
// This can help reduce excessive load times on flaky networks.
// Currently only designed for GET requests since it tracks calls by URL and params only.
class TimeoutRetryDecayManager {
  private callCounts: Map<string, number> = new Map();
  private lastResetTimes: Map<string, number> = new Map();
  private RESET_INTERVAL_MS = 60000;

  private decayFactor: number;

  constructor(decayFactor: number = 0.3) {
    this.decayFactor = decayFactor;
  }

  getDecayFactor(url: string, params?: RequestParams): number {
    const now = Date.now();
    const key = params ? `${url}?${JSON.stringify(params)}` : url;
    if (!this.lastResetTimes.has(key)) {
      this.lastResetTimes.set(key, now);
    }
    const lastResetTime = this.lastResetTimes.get(key) || now;

    if (now - lastResetTime > this.RESET_INTERVAL_MS) {
      this.callCounts.delete(key);
      this.lastResetTimes.delete(key);
    }

    const currentCount = this.callCounts.get(key) || 0;
    this.callCounts.set(key, currentCount + 1);

    return Math.max(1 - currentCount * this.decayFactor, this.decayFactor);
  }
}

abstract class AbstractFarcasterApiClient {
  options: FarcasterApiClientOptions;
  private defaultHeaders: RequestHeaders;
  private timeoutRetryDecayManager: TimeoutRetryDecayManager | undefined;
  private fetcher: Fetcher | undefined;

  constructor(options: FarcasterApiClientOptions = {}) {
    this.options = mergeIntoDefaultOptions<FarcasterApiClientOptions>({
      defaults: getDefaultOptions(),
      options,
    });

    this.fetcher = this.options.getFetch?.() || getGlobalFetch();

    this.timeoutRetryDecayManager = options.timeoutRetryDecayFactor
      ? new TimeoutRetryDecayManager(options.timeoutRetryDecayFactor)
      : undefined;

    this.defaultHeaders = this.buildDefaultHeaders(options.meta);
  }

  // Builds the meta-derived default headers (FC-ADDRESS, FC-DEVICE-ID, etc.).
  // Kept separate from the constructor so updateOptions can refresh them when
  // meta changes; otherwise headers set after construction (e.g. deviceId
  // supplied by the provider) would never make it onto requests.
  private buildDefaultHeaders(
    meta: FarcasterApiClientMetaOptions = {},
  ): RequestHeaders {
    const headers: RequestHeaders = {
      'Content-Type': 'application/json; charset=utf-8',
      'FC-ADDRESS': meta.address || '',
      'FC-DEVICE-OS': meta.deviceOs || '', // e.g. ios
      'FC-FID': meta.fid ? String(meta.fid) : '',
      'FC-DEVICE-ID': meta.deviceId || '', // e.g. 125425b3-aaff-445f-82cd-25dd1e619a62
      'FC-DEVICE-MODEL': meta.deviceModel || '', // e.g. iPhone 12 Pro Max
      'FC-NATIVE-BUILD-VERSION': meta.nativeBuildVersion || '', // e.g. 90
      'FC-NATIVE-APPLICATION-VERSION': meta.nativeApplicationVersion || '', // e.g. 0.0.22
    };

    for (const key in headers) {
      if (headers[key] === '') {
        delete headers[key];
      }
    }

    return headers;
  }

  public updateOptions(options: Partial<FarcasterApiClientOptions>) {
    const hasMeta = Object.prototype.hasOwnProperty.call(options, 'meta');
    // `meta` is a partial update: MERGE it into the existing meta rather than
    // letting the shallow `assign` below replace it wholesale, so a caller
    // updating one identity field — e.g. `{ meta: { fid } }` after onboarding
    // loads, or mobile's `{ meta: { address, fid } }` at login — doesn't wipe
    // the others (deviceId, deviceOs, versions) from the derived headers.
    // Dropping FC-DEVICE-ID would silently break the backend's
    // one-token-per-device dedup. Clear an individual field by passing it
    // explicitly as undefined.
    const mergedMeta = hasMeta
      ? { ...this.options.meta, ...options.meta }
      : undefined;

    this.options = assign(
      {},
      this.options,
      options,
      hasMeta ? { meta: mergedMeta } : undefined,
    );

    if (Object.prototype.hasOwnProperty.call(options, 'getFetch')) {
      this.fetcher = options.getFetch?.() || getGlobalFetch();
    }

    // Refresh the meta-derived default headers so identity headers like
    // FC-DEVICE-ID (used for one-token-per-device dedup) are actually sent on
    // requests made after construction, not just the ones built from the
    // initial constructor meta.
    if (hasMeta) {
      this.defaultHeaders = this.buildDefaultHeaders(this.options.meta);
    }
  }

  // HACK: This is here until we move mutations in react-query to useMutation.
  private async fetchWithRetry<T>(
    count: number = 0,
    relativeUrl: RequestRelativeUrl,
    options: FetchOptions,
  ): Promise<FetchResponse<T>> {
    const retryLimit =
      (options as MutateFetchOptions).retryLimit ?? defaultRetryLimit;

    return await this.fetch<T>(relativeUrl, options).catch(async (error) => {
      const isHandledError =
        isFarcasterApiError(error) && error.status?.toString().startsWith('4');

      if (this.options.isOffline) {
        throw new UnhandledFetchError('Offline', {
          absoluteUrl: relativeUrl,
          body: options.body,
          endpointName: options.endpointName,
          hasTimedOut: false,
          isHandled: false,
          message: 'Offline',
          isNetworkError: true,
          method: options.method,
          relativeUrl,
          resolvedTimeout: options.timeout || defaultReadTimeout,
          response: undefined,
          responseData: undefined,
          status: undefined,
          timeout: options.timeout,
          isOffline: this.options.isOffline,
        });
      }

      if (count < retryLimit && !isHandledError) {
        return await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * (count + 1)),
        )
          .then(async () => {
            return await this.fetchWithRetry<T>(
              count + 1,
              relativeUrl,
              options,
            );
          })
          .catch((e) => {
            throw e;
          });
      } else {
        throw error;
      }
    });
  }

  private async fetch<T>(
    relativeUrl: RequestRelativeUrl,
    {
      baseUrl,
      body: rawBody,
      endpointName,
      headers: partialHeaders,
      method,
      params,
      timeout,
    }: FetchOptions,
  ): Promise<FetchResponse<T>> {
    let response: Response | undefined;
    let responseData: T | undefined;

    const stringifiedParams = qs.stringify(params, {
      arrayFormat: 'repeat',
      skipNulls: true,
    });
    const url = `${baseUrl || this.options.baseUrl}${relativeUrl}${
      stringifiedParams ? `?${stringifiedParams}` : ''
    }`;

    const identityHeaders: Record<string, string> = {};
    if (this.options.getDeviceId) {
      const deviceId = this.options.getDeviceId();
      if (deviceId) {
        identityHeaders['FC-AMPLITUDE-DEVICE-ID'] = deviceId;
      }
    }
    if (this.options.getSessionId) {
      const sessionId = this.options.getSessionId();
      if (sessionId) {
        identityHeaders['FC-AMPLITUDE-SESSION-ID'] = sessionId;
      }
    }

    const body = rawBody === undefined ? rawBody : JSON.stringify(rawBody);
    const defaultHeaders = { ...this.defaultHeaders };
    if (
      rawBody === undefined &&
      partialHeaders?.['Content-Type'] === undefined &&
      partialHeaders?.['content-type'] === undefined
    ) {
      delete defaultHeaders['Content-Type'];
    }

    const headers = {
      ...defaultHeaders,
      ...partialHeaders,
      ...identityHeaders,
    };
    let hasTimedOut = false;

    const timeoutDecayFactor = this.timeoutRetryDecayManager
      ? this.timeoutRetryDecayManager.getDecayFactor(url, params)
      : 1;

    const resolvedTimeout =
      (() => {
        if (timeout !== undefined) {
          return timeout;
        }

        if (method === 'GET') {
          return this.options.readTimeout === undefined
            ? defaultReadTimeout
            : this.options.readTimeout;
        }

        return this.options.mutateTimeout === undefined
          ? defaultMutateTimeout
          : this.options.mutateTimeout;
      })() * timeoutDecayFactor;

    function buildErrorParams({
      originalError,
      isHandled,
      isOffline = false,
    }: {
      originalError: unknown;
      isHandled: boolean;
      isOffline?: boolean;
    }): FetchErrorOptions {
      return {
        absoluteUrl: url,
        body: body,
        endpointName,
        error: originalError,
        hasTimedOut,
        isHandled,
        message: isError(originalError)
          ? originalError.message
          : originalError
            ? String(originalError)
            : 'Farcaster API Client experienced an unexpected error.',
        isNetworkError: isNetworkError(originalError),
        method,
        relativeUrl,
        resolvedTimeout,
        response,
        responseData,
        status: response?.status,
        timeout,
        isOffline,
      };
    }

    function getRequestInfo(): RequestInfo {
      return {
        absoluteUrl: url,
        body,
        endpointName,
        method,
        relativeUrl,
      };
    }

    if (this.options.isOffline) {
      throw new UnhandledFetchError(
        'Offline',
        buildErrorParams({
          originalError: 'Offline',
          isHandled: false,
          isOffline: this.options.isOffline,
        }),
      );
    }

    if (this.options.debug) {
      logFetching({ method, url, headers, body, timeout: resolvedTimeout });
    }
    const controller = new AbortController();
    const requestStartedAt = Date.now();

    const timeoutId = resolvedTimeout
      ? setTimeout(() => {
          if (this.options.onTimeout) {
            this.options.onTimeout({
              requestInfo: getRequestInfo(),
              timeSinceRequestStart: Date.now() - requestStartedAt,
            });
          }
          hasTimedOut = true;
          controller.abort();
        }, resolvedTimeout)
      : undefined;

    try {
      if (!this.fetcher) {
        throw new UndefinedFetchFunctionError();
      }

      if (this.options.onFetchStart) {
        this.options.onFetchStart({
          requestInfo: getRequestInfo(),
        });
      }

      response = await this.fetcher(url, {
        body,
        headers,
        method,
        signal: controller.signal,
      });

      const contentType = (
        response.headers.get('content-type') ||
        'application/json; charset=utf-8'
      ).toLowerCase();
      const isJson = contentType.includes('json');
      const responseData: T = isJson
        ? await response.json()
        : await response.text();

      // TODO: Remove once we've determined the cause of the null result
      try {
        if (isJson && responseData === null) {
          console.warn(
            `Farcaster API Client received a null result for : ${JSON.stringify(
              getRequestInfo(),
            )}`,
          );
        }
      } catch (e) {
        // If for some reason this breaks things, we don't want to change existing behavior,
        // so log it and move on.
        console.error('Error attempting to check API result', e);
      }

      if (response.status >= 400) {
        const body = responseData as unknown as ApiErrorResponse;
        const message = `${endpointName} ${response.status} - ${body.errors
          .map((e) => e.message)
          .join(',')}`;
        const handledError = new HandledFetchError(message, {
          ...buildErrorParams({ originalError: message, isHandled: true }),
          responseData: body,
          status: response.status,
        });

        if (this.options.debug) {
          logError({
            error: handledError,
            method,
            status: response.status,
            url,
          });
        }

        throw handledError;
      }

      if (this.options.debug) {
        logSuccess({ method, status: response.status, url });
      }

      if (this.options.onSuccess) {
        this.options.onSuccess({
          requestInfo: getRequestInfo(),
          responseData,
          responseStatus: response.status,
        });
      }

      return { data: responseData, status: response.status };
    } catch (e) {
      const unhandledError = isHandledFetchError(e)
        ? e
        : new UnhandledFetchError(
            'Unhandled fetch error',
            buildErrorParams({ originalError: e, isHandled: false }),
          );

      if (this.options.debug) {
        logError({
          error: unhandledError,
          method,
          status: response?.status,
          url,
        });
      }

      if (this.options.onError) {
        this.options.onError({
          error: unhandledError,
          requestInfo: getRequestInfo(),
          responseStatus: response?.status,
        });
      }

      throw unhandledError;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public get baseUrl() {
    return this.options.baseUrl;
  }

  public get webSocketUrl() {
    return this.options.wsUrl;
  }

  protected async authedGet<T>(
    url: RequestRelativeUrl,
    { headers, ...options }: GetOptions,
  ) {
    return this.fetch<T>(url, {
      ...options,
      method: 'GET',
      headers: this.authorize(headers),
    });
  }

  protected async get<T>(url: RequestRelativeUrl, options: GetOptions) {
    return this.fetch<T>(url, { ...options, method: 'GET' });
  }

  protected async patch<T>(
    url: RequestRelativeUrl,
    { headers, ...options }: PatchOptions,
  ) {
    return this.fetchWithRetry<T>(0, url, {
      ...options,
      method: 'PATCH',
      headers: this.authorize(headers, true),
    });
  }

  protected async post<T>(
    url: RequestRelativeUrl,
    { headers, ...options }: PostOptions,
  ) {
    return this.fetchWithRetry<T>(0, url, {
      ...options,
      method: 'POST',
      headers: this.authorize(headers, true),
    });
  }

  protected async put<T>(
    url: RequestRelativeUrl,
    { headers, ...options }: PutOptions,
  ) {
    return this.fetchWithRetry<T>(0, url, {
      ...options,
      method: 'PUT',
      headers: this.authorize(headers, true),
    });
  }

  protected async delete<T>(
    url: RequestRelativeUrl,
    { headers, ...options }: DeleteOptions,
  ) {
    return this.fetchWithRetry<T>(0, url, {
      ...options,
      method: 'DELETE',
      headers: this.authorize(headers, true),
    });
  }

  protected authorize(
    originalHeaders: RequestHeaders = {},
    idempotent = false,
  ) {
    const headers: RequestHeaders = { ...originalHeaders };

    if (!headers.Authorization && this.options.authToken) {
      const token = this.options.authToken;

      if (token) {
        headers.Authorization = `Bearer ${token.secret}`;
      }
    }

    if (idempotent && !headers['Idempotency-Key']) {
      headers['Idempotency-Key'] = generateIdempotencyKey();
    }

    return headers;
  }
}

const logPrefix = 'FarcasterApiClient:';

function logFetching({
  body,
  headers,
  method,
  url,
  timeout,
}: {
  body: unknown;
  method: RequestMethod;
  headers: Record<string, unknown>;
  url: string;
  timeout: number;
}) {
  console.log(logPrefix, 'Fetching');
  console.log('...method:', method);
  console.log('...url:', url);
  if (body) {
    console.log('...body:', body);
  }
  console.log(
    '...headers:',
    Object.entries(headers).reduce(
      (memo, [key, value]) => {
        memo[key] = String(value) || '';
        return memo;
      },
      {} as Record<string, string>,
    ),
  );
  console.log('...timeout:', timeout);
}

function logSuccess({
  method,
  status,
  url,
}: {
  method: RequestMethod;
  status: number;
  url: string;
}) {
  console.log(logPrefix, 'Received Success Response');
  console.log('...method:', method);
  console.log('...url:', url);
  console.log('...status:', status);
}

function logError({
  error,
  method,
  status,
  url,
}: {
  error: Error;
  method: RequestMethod;
  status: number | undefined;
  url: string;
}) {
  console.error(logPrefix, 'Encountered Error');
  console.error('...method:', method);
  console.error('...url:', url);
  console.error('...status:', status);
  console.error(stringifyError(error));
}

// Adapted from https://github.com/sindresorhus/is-network-error/tree/main
const networkEerrorMessages = new Set([
  'Failed to fetch', // Chrome
  'NetworkError when attempting to fetch resource.', // Firefox
  'The Internet connection appears to be offline.', // Safari 16
  'Load failed', // Safari 17+
  'Network request failed', // `cross-fetch`
]);

function isNetworkError(error: unknown) {
  const isValid =
    error &&
    isError(error) &&
    error.name === 'TypeError' &&
    typeof error.message === 'string';

  if (!isValid) {
    return false;
  }

  // We do an extra check for Safari 17+ as it has a very generic error message.
  // Network errors in Safari have no stack.
  if (error.message === 'Load failed') {
    return error.stack === undefined;
  }

  return networkEerrorMessages.has(error.message);
}

export { AbstractFarcasterApiClient, defaultBaseUrl, defaultWsUrl };
