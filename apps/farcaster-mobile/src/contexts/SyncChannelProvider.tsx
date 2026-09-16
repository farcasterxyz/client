import {
  useCachedOnboardingState,
  useFarcasterApiClient,
} from 'farcaster-client-hooks';
import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { SyncChannelType } from '~/types';

import { useAuthToken } from './AuthTokenProvider';
import { useDebugCryptography } from './DebugCryptographyProvider';
import { useFarcasterAsyncDataStore } from './FarcasterAsyncDataStore';
import { useFarcasterCryptographyKeyStore } from './FarcasterCryptographyKeyStoreProvider';

type SyncChannelContextValue = {
  setChannelId: (type: SyncChannelType, channelId: string) => void;
  getChannelId: (type: SyncChannelType) => string;
  clearChannelIds: () => void;
};

const SyncChannelContext = createContext<SyncChannelContextValue>({
  setChannelId: () => undefined,
  getChannelId: () => '',
  clearChannelIds: () => undefined,
});

type SyncChannelProviderProps = {
  children: ReactNode;
};

const SyncChannelProvider: FC<SyncChannelProviderProps> = memo(
  ({ children }) => {
    const [syncChannelIds, setSyncChannelIds] = useState<
      Record<string, string | undefined>
    >({});

    const { addSignOutListener } = useAuthToken();
    const { addCryptographyLog } = useDebugCryptography();

    const { dataStore } = useFarcasterAsyncDataStore();
    const { keyStore } = useFarcasterCryptographyKeyStore();
    const { apiClient } = useFarcasterApiClient();
    const cachedOnboardingState = useCachedOnboardingState();

    const setChannelId = useCallback(
      (type: SyncChannelType, channelId: string) =>
        setSyncChannelIds((prevSyncChannelIds) => ({
          ...prevSyncChannelIds,
          [type]: channelId,
        })),
      [],
    );

    const getChannelId = useCallback(
      (type: SyncChannelType) => syncChannelIds[type] || '',
      [syncChannelIds],
    );

    const clearChannelIds = useCallback(() => {
      addCryptographyLog('Clearing sync channel ids');
      setSyncChannelIds({});
    }, [addCryptographyLog]);

    useEffect(() => {
      const removeListener = addSignOutListener(async () => {
        if (cachedOnboardingState.result.state.user) {
          clearChannelIds();
        }
      });

      return () => removeListener();
    }, [
      addSignOutListener,
      apiClient,
      cachedOnboardingState.result.state.user,
      clearChannelIds,
      dataStore,
      keyStore,
    ]);

    const value = useMemo(
      () => ({ setChannelId, getChannelId, clearChannelIds }),
      [setChannelId, getChannelId, clearChannelIds],
    );

    return (
      <SyncChannelContext.Provider value={value}>
        {children}
      </SyncChannelContext.Provider>
    );
  },
);

SyncChannelProvider.displayName = 'SyncChannelProvider';

const useSyncChannel = () => useContext(SyncChannelContext);

export { SyncChannelProvider, useSyncChannel };
