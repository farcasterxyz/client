import { fetch as expoFetch } from 'expo/fetch';
import * as Device from 'expo-device';
import {
  FarcasterApiClientMetaOptions,
  Fetcher,
  OnTimeout,
} from 'farcaster-client-data';
import { FarcasterApiClientProvider } from 'farcaster-client-hooks';
import React, {
  FC,
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { InteractionManager, Platform } from 'react-native';

import { analyticsClient } from '~/analyticsClient';
import { apiClient } from '~/apiClient';
import { wsUrl } from '~/constants/Api';
import { isDev } from '~/constants/Env';
import { MobileClientIntegrityService } from '~/services/MobileClientIntegrityService';

import { useConnectionStatus } from './ConnectionStatusProvider';
import { useDeviceId } from './DeviceProvider';
import { useTimeoutHistory } from './TimeoutHistoryProvider';
import { useVersion } from './VersionProvider';
import { useWallet } from './WalletProvider';

const apiDebugEnabled = false;

const platformFetch = (expoFetch ?? fetch) as Fetcher;

function mergeHeaders(
  headers: HeadersInit | undefined,
  additionalHeaders: Record<string, string>,
): HeadersInit {
  const mergedHeaders: Record<string, string> = {};

  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      mergedHeaders[key] = value;
    });
  } else if (Array.isArray(headers)) {
    for (const [key, value] of headers) {
      mergedHeaders[key] = value;
    }
  } else if (headers) {
    Object.assign(mergedHeaders, headers);
  }

  return {
    ...mergedHeaders,
    ...additionalHeaders,
  };
}

type MobileFarcasterApiClientProviderProps = {
  children: ReactNode;
};

const MobileFarcasterApiClientProvider: FC<MobileFarcasterApiClientProviderProps> =
  memo(({ children }) => {
    const { address } = useWallet();
    const {
      device: { deviceId },
    } = useDeviceId();
    const { isOnline } = useConnectionStatus();

    const { nativeApplicationVersion, nativeBuildVersion } = useVersion();
    const { addTimeout } = useTimeoutHistory();

    const meta = useMemo(
      (): FarcasterApiClientMetaOptions => ({
        address,
        deviceId,
        deviceModel: Device.modelName || undefined,
        // The backend's metric tagging only allows 'ios' | 'android'. Using
        // Device.osName.toLowerCase() would leak values like 'ipados' or
        // 'mac os x' that fail the allowlist. Platform.OS already maps
        // iPadOS → 'ios' for React Native apps, so it satisfies the contract
        // directly; anything else (e.g. web/windows/macos, if this code ever
        // runs there) is sent as undefined rather than a bogus string.
        deviceOs:
          Platform.OS === 'ios' || Platform.OS === 'android'
            ? Platform.OS
            : undefined,
        nativeApplicationVersion: nativeApplicationVersion || undefined,
        nativeBuildVersion: nativeBuildVersion || undefined,
      }),
      [address, deviceId, nativeApplicationVersion, nativeBuildVersion],
    );

    // const onError: OnError = useCallback(
    //   ({ responseStatus }) => {
    //     if (responseStatus === 401) {
    //       signOut();
    //     }
    //   },
    //   [signOut],
    // );

    const onTimeout: OnTimeout = useCallback(
      ({ requestInfo, timeSinceRequestStart }) => {
        addTimeout({
          requestInfo,
          timeSinceRequestStart,
          timedOutAt: Date.now(),
        });
      },
      [addTimeout],
    );

    const debug = useMemo(() => {
      return isDev && apiDebugEnabled;
    }, []);

    const getDeviceIdCb = React.useCallback(() => {
      return analyticsClient.getAnonymousId();
    }, []);

    const getSessionIdCb = React.useCallback(() => {
      return analyticsClient.getSessionId();
    }, []);

    const fetchWithMobileIntegrity = React.useCallback<Fetcher>(
      async (input, init) => {
        const additionalHeaders =
          await MobileClientIntegrityService.getRequestHeaders();

        if (!additionalHeaders) {
          return platformFetch(input, init);
        }

        return platformFetch(input, {
          ...init,
          headers: mergeHeaders(init?.headers, additionalHeaders),
        });
      },
      [],
    );

    // Pre-warm App Check after interactions settle + a short delay, off the
    // cold-start critical path. The guard mirrors `getRequestHeaders` itself
    // (mobile only; no-op on web) — we deliberately do NOT split behavior by
    // OS, because the integrity token is attached to every request on both
    // iOS (App Attest) and Android (Play Integrity), so warming it early helps
    // both. The acute motivation is Android, where PlayCore IntegrityService
    // callbacks run on the main UI thread and can stall it ~1.5s, producing
    // the cold-start "Choreographer skipped 89 frames" hitch we measured;
    // deferring keeps that native work out of the boot scroll window. iOS
    // App Attest benefits from the same off-critical-path warming.
    useEffect(() => {
      if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
        return;
      }
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const handle = InteractionManager.runAfterInteractions(() => {
        timeoutId = setTimeout(() => {
          MobileClientIntegrityService.getRequestHeaders().catch(
            () => undefined,
          );
        }, 4000);
      });
      return () => {
        handle.cancel();
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }
      };
    }, []);

    return (
      <FarcasterApiClientProvider
        apiClient={apiClient}
        address={address}
        debug={debug}
        meta={meta}
        wsUrl={wsUrl}
        // onError={onError}
        onTimeout={onTimeout}
        getDeviceId={getDeviceIdCb}
        getSessionId={getSessionIdCb}
        isOffline={!isOnline}
        fetch={fetchWithMobileIntegrity}
      >
        {children}
      </FarcasterApiClientProvider>
    );
  });

MobileFarcasterApiClientProvider.displayName =
  'MobileFarcasterApiClientProvider';

export { MobileFarcasterApiClientProvider };
