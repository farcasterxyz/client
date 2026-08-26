import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { AppError } from 'farcaster-client-data';
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { analyticsClient } from '~/analyticsClient';
import { trackError } from '~/utils/ErrorUtils';

function computeIsOnline(netInfo: NetInfoState): boolean {
  if (netInfo.isConnected === false) {
    return false;
  }

  return true;
}

onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((netInfo) => {
    setOnline(computeIsOnline(netInfo));
  });
});

export enum ConnectionType {
  WIFI = 'wifi',
  CELLULAR = 'cellular',
  UNKNOWN = 'unknown',
}

export enum ConnectionStatus {
  OFFLINE = 'OFFLINE',
  GOOD_CONNECTION = 'GOOD_CONNECTION',
  SLOW_CONNECTION = 'SLOW_CONNECTION',
}

const ONLINE_CACHE_TTL = 60 * 1000;
const OFFLINE_CACHE_TTL = 10 * 1000;

const getConnectionStatus = (netInfo: NetInfoState): ConnectionStatus => {
  if (netInfo.isConnected === false || netInfo.isInternetReachable === false) {
    return ConnectionStatus.OFFLINE;
  }

  return ConnectionStatus.GOOD_CONNECTION;
};

const getNetworkType = (netInfo: NetInfoState): ConnectionType => {
  switch (netInfo.type) {
    case 'wifi':
      return ConnectionType.WIFI;
    case 'cellular':
      return ConnectionType.CELLULAR;
    default:
      return ConnectionType.UNKNOWN;
  }
};

const fastConnectionCheck = async (): Promise<ConnectionStatus> => {
  return getConnectionStatus(await NetInfo.fetch());
};

type ConnectionStatusContextType = {
  checkConnection: () => Promise<ConnectionStatus | null>;
  connectionType: ConnectionType;
  isOnline: boolean;
};

const ConnectionStatusContext = createContext<ConnectionStatusContextType>({
  checkConnection: async () => ConnectionStatus.GOOD_CONNECTION,
  connectionType: ConnectionType.UNKNOWN,
  isOnline: true,
});

type ConnectionStatusProviderProps = {
  children: React.ReactNode;
  onlineCacheTTL?: number;
  offlineCacheTTL?: number;
};

export const ConnectionStatusProvider = ({
  children,
  onlineCacheTTL = ONLINE_CACHE_TTL,
  offlineCacheTTL = OFFLINE_CACHE_TTL,
}: ConnectionStatusProviderProps) => {
  DdRum.startAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'ConnectionStatusProvider',
  });

  const [lastChecked, setLastChecked] = useState<number>(0);
  const [lastStatus, setLastStatus] = useState<ConnectionStatus>(
    ConnectionStatus.GOOD_CONNECTION,
  );
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [connectionType, setConnectionType] = useState<ConnectionType>(
    ConnectionType.UNKNOWN,
  );

  React.useEffect(() => {
    // NetInfo invokes the listener immediately with the current state, so
    // connectionType is populated without an extra fetch.
    const unsubscribe = NetInfo.addEventListener((netInfo) => {
      const networkType = getNetworkType(netInfo);
      setIsOnline(computeIsOnline(netInfo));
      setConnectionType(networkType);
      analyticsClient.setEnvelopeContext({ networkType });
    });

    return () => unsubscribe();
  }, []);

  const pendingRef = React.useRef<Promise<ConnectionStatus | null> | null>(
    null,
  );

  const checkConnection = useCallback(async () => {
    if (!isOnline) {
      return ConnectionStatus.OFFLINE;
    }

    const now = Date.now();
    const ttl =
      lastStatus === ConnectionStatus.OFFLINE
        ? offlineCacheTTL
        : onlineCacheTTL;

    if (now - lastChecked < ttl) {
      return lastStatus;
    }

    if (pendingRef.current) {
      return pendingRef.current;
    }

    pendingRef.current = (async () => {
      try {
        const status = await fastConnectionCheck();
        setLastStatus(status);
        setLastChecked(Date.now());
        return status;
      } catch (err) {
        trackError(
          new AppError('failed to check connection statues', {
            location: 'ConnectionStatusProvider',
            name: 'CheckConnectionError',
          }),
        );

        return null;
      } finally {
        pendingRef.current = null;
      }
    })();

    return pendingRef.current;
  }, [isOnline, lastChecked, lastStatus, onlineCacheTTL, offlineCacheTTL]);

  const contextValue = useMemo(() => {
    return {
      checkConnection,
      connectionType,
      isOnline,
    };
  }, [checkConnection, connectionType, isOnline]);

  DdRum.stopAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'ConnectionStatusProvider',
  });

  return (
    <ConnectionStatusContext.Provider value={contextValue}>
      {children}
    </ConnectionStatusContext.Provider>
  );
};

export const useConnectionStatus = () => useContext(ConnectionStatusContext);
