import {
  defaultBaseUrl,
  FarcasterApiClient,
  FarcasterApiClientMetaOptions,
  FarcasterApiClientOptions,
  Fetcher,
  OnError,
  OnFetchStart,
  OnSuccess,
  OnTimeout,
} from 'farcaster-client-data';
import React, {
  createContext,
  memo,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
} from 'react';

import { GlobalCacheUsageProvider } from './GlobalCacheUsageProvider';
import { PurgedProvider } from './PurgedProvider';

// Strips undefined entries before the options are applied to the apiClient:
// updateOptions treats a present-but-undefined key as an intentional clear
// (its lodash assign copies undefined values). Without this, an app that does
// not supply a prop to the provider — e.g. mobile leaves `onError` to
// useRevokedTokenSignOutHandler, which installs it directly on the apiClient —
// would have that option silently wiped every time the provider effect re-runs
// (meta changes when the wallet address or deviceId resolves), disabling the
// global 401 → revalidate → sign-out handling for the rest of the session.
// Direct updateOptions callers can still clear a field by passing it
// explicitly as undefined.
const compactApiClientOptions = (
  options: Partial<FarcasterApiClientOptions>,
): Partial<FarcasterApiClientOptions> => {
  for (const key of Object.keys(
    options,
  ) as (keyof FarcasterApiClientOptions)[]) {
    if (options[key] === undefined) {
      delete options[key];
    }
  }
  return options;
};

export type FarcasterApiClientContextValue = {
  apiClient: FarcasterApiClient;
  baseUrl: string;
};

const FarcasterApiClientContext = createContext<FarcasterApiClientContextValue>(
  {
    apiClient: new FarcasterApiClient({
      baseUrl: defaultBaseUrl,
      meta: {},
      debug: false,
      timeoutRetryDecayFactor: 0.3,
    }),
    baseUrl: defaultBaseUrl,
  },
);

export type FarcasterApiClientProviderProps = {
  apiClient: FarcasterApiClient;
  address: string | undefined;
  baseUrl?: string;
  wsUrl: string | undefined;
  children: ReactNode;
  debug?: boolean;
  meta: FarcasterApiClientMetaOptions;
  fetch?: Fetcher;
  mutateTimeout?: number;
  onError?: OnError;
  onFetchStart?: OnFetchStart;
  onSuccess?: OnSuccess;
  onTimeout?: OnTimeout;
  readTimeout?: number;
  getDeviceId?: () => string | undefined;
  getSessionId?: () => string | undefined;
  timeoutRetryDecayFactor?: number;
  isOffline?: boolean;
};

const FarcasterApiClientProvider = memo(
  ({
    apiClient,
    baseUrl = defaultBaseUrl,
    wsUrl,
    children,
    debug = false,
    fetch,
    meta,
    mutateTimeout,
    onError,
    onFetchStart,
    onSuccess,
    onTimeout,
    readTimeout,
    getDeviceId,
    getSessionId,
    timeoutRetryDecayFactor,
    isOffline,
  }: FarcasterApiClientProviderProps) => {
    const options = useMemo(() => {
      const next: Partial<FarcasterApiClientOptions> = {
        baseUrl,
        wsUrl,
        debug,
        getFetch:
          typeof fetch === 'function'
            ? () => fetch.bind(globalThis)
            : undefined,
        meta,
        mutateTimeout,
        onError,
        onFetchStart,
        onSuccess,
        onTimeout,
        readTimeout,
        getDeviceId,
        getSessionId,
        timeoutRetryDecayFactor,
        isOffline,
      };
      return compactApiClientOptions(next);
    }, [
      baseUrl,
      wsUrl,
      debug,
      fetch,
      meta,
      mutateTimeout,
      onError,
      onFetchStart,
      onSuccess,
      onTimeout,
      readTimeout,
      getDeviceId,
      getSessionId,
      timeoutRetryDecayFactor,
      isOffline,
    ]);

    useEffect(() => {
      apiClient.updateOptions(options);
    }, [apiClient, options]);

    const contextValue = useMemo(
      () => ({
        apiClient,
        baseUrl,
      }),
      [apiClient, baseUrl],
    );

    return useMemo(
      () => (
        <GlobalCacheUsageProvider>
          <PurgedProvider>
            <FarcasterApiClientContext.Provider value={contextValue}>
              {children}
            </FarcasterApiClientContext.Provider>
          </PurgedProvider>
        </GlobalCacheUsageProvider>
      ),
      [children, contextValue],
    );
  },
);

FarcasterApiClientProvider.displayName = 'FarcasterApiClientProvider';

const useFarcasterApiClient = () => useContext(FarcasterApiClientContext);

export {
  compactApiClientOptions,
  FarcasterApiClientProvider,
  useFarcasterApiClient,
};
