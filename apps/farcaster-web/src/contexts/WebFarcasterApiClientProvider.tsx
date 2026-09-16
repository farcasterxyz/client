import {
  FarcasterApiClient,
  FarcasterApiClientMetaOptions,
  OnError,
  OnFetchStart,
} from 'farcaster-client-data';
import { FarcasterApiClientProvider } from 'farcaster-client-hooks';
import React, { FC, memo, ReactNode, useCallback, useMemo } from 'react';

import { baseApiUrl, wsUrl } from '~/constants/api';
import { isDev } from '~/constants/env';
import { useRecentFetch } from '~/contexts/RecentFetchProvider';
import { Analytics } from '~/utils/analyticsUtils';
import { getPersistedDeviceId } from '~/utils/deviceIdUtils';

import { authOnError401Ref } from './authOnError401Ref';

const apiDebugEnabled = false;

type WebFarcasterApiClientProviderProps = {
  children: ReactNode;
};

const apiClient = new FarcasterApiClient();

const WebFarcasterApiClientProvider: FC<WebFarcasterApiClientProviderProps> =
  memo(({ children }) => {
    const { trackFetch } = useRecentFetch();

    // deviceId → FC-DEVICE-ID header. The backend's one-token-per-device
    // dedup keys on it; without it every web mint takes the noDeviceId path
    // and accumulates in auth-tokens:{fid} (see deviceIdUtils).
    const meta = useMemo(
      (): FarcasterApiClientMetaOptions => ({
        deviceId: getPersistedDeviceId(),
      }),
      [],
    );

    const onFetchStart: OnFetchStart = useCallback(() => {
      trackFetch();
    }, [trackFetch]);

    // Single apiClient.onError owner. Delegate 401s to AuthProvider's
    // revalidation handler (registered via authOnError401Ref) so we probe
    // /v2/me before signing out, instead of tearing the session down on any
    // transient 401. Recovery/re-entry/stale-token guards live in that handler.
    const onError: OnError = useCallback(({ requestInfo, responseStatus }) => {
      if (responseStatus !== 401) {
        return;
      }
      // Don't loop on the deleteAuthToken call that sign-out makes.
      if (requestInfo.endpointName === 'deleteAuthToken') {
        return;
      }
      void authOnError401Ref.current?.({
        source: 'global_handler',
        endpointName: requestInfo.endpointName,
        responseStatus,
      });
    }, []);

    return (
      <FarcasterApiClientProvider
        apiClient={apiClient}
        address={undefined}
        baseUrl={baseApiUrl}
        wsUrl={wsUrl}
        debug={isDev && apiDebugEnabled}
        meta={meta}
        onError={onError}
        onFetchStart={onFetchStart}
        fetch={fetch}
        getDeviceId={Analytics.getDeviceId}
        getSessionId={Analytics.getSessionId}
      >
        {children}
      </FarcasterApiClientProvider>
    );
  });

WebFarcasterApiClientProvider.displayName = 'WebFarcasterApiClientProvider';

export { WebFarcasterApiClientProvider };
