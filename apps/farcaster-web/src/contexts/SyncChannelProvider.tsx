import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { useAuth } from '~/contexts/AuthProvider';
import { SyncChannelType } from '~/types';

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

    const { addSignOutListener } = useAuth();

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
      setSyncChannelIds({});
    }, []);

    useEffect(() => {
      const removeListener = addSignOutListener(() => {
        clearChannelIds();
      });

      return () => removeListener();
    }, [addSignOutListener, clearChannelIds]);

    return (
      <SyncChannelContext.Provider
        value={{
          setChannelId,
          getChannelId,
          clearChannelIds,
        }}
      >
        {children}
      </SyncChannelContext.Provider>
    );
  },
);

SyncChannelProvider.displayName = 'SyncChannelProvider';

const useSyncChannel = () => useContext(SyncChannelContext);

export { SyncChannelProvider, useSyncChannel };
