import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  dataSaverModeKey,
  downloadUpdatesOnCellularKey,
} from '~/constants/Storage';
import { getItem, setItem } from '~/utils/StorageUtils';

import {
  ConnectionType,
  useConnectionStatus,
} from './ConnectionStatusProvider';

export enum DataSaverMode {
  SLOW_CONNECTION_ONLY = 'slow_connection_only',
  CELLULAR_ONLY = 'cellular_only',
  ALWAYS_ON = 'always_on',
}

type DataSaverContextType = {
  mode: DataSaverMode;
  setMode: (mode: DataSaverMode) => void;
  downloadUpdatesOnCellular: boolean;
  setDownloadUpdatesOnCellular: (value: boolean) => void;
  shouldLoadLowerQualityImages: boolean;
  shouldAutoPlayVideos: boolean;
};

export const DataSaverContext = createContext<DataSaverContextType>({
  mode: DataSaverMode.SLOW_CONNECTION_ONLY,
  setMode: () => {},
  downloadUpdatesOnCellular: false,
  setDownloadUpdatesOnCellular: () => {},
  shouldLoadLowerQualityImages: false,
  shouldAutoPlayVideos: true,
});

export const DataSaverProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  DdRum.startAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'DataSaverProvider',
  });

  const [mode, setModeState] = useState<DataSaverMode>(
    DataSaverMode.SLOW_CONNECTION_ONLY,
  );
  const [downloadUpdatesOnCellular, setDownloadUpdatesOnCellularState] =
    useState(false);
  const { connectionType } = useConnectionStatus();

  // Load persisted data savings mode on mount.
  useEffect(() => {
    const loadSavedMode = async () => {
      const savedMode = await getItem({
        key: dataSaverModeKey,
        fallback: DataSaverMode.SLOW_CONNECTION_ONLY,
      });
      setModeState(savedMode);

      const savedDownloadUpdatesOnCellular = await getItem({
        key: downloadUpdatesOnCellularKey,
        fallback: true,
      });
      setDownloadUpdatesOnCellularState(savedDownloadUpdatesOnCellular);
    };
    loadSavedMode();
  }, []);

  const setMode = useCallback((newMode: DataSaverMode) => {
    setModeState(newMode);
    setItem({ key: dataSaverModeKey, value: newMode });
  }, []);

  const setDownloadUpdatesOnCellular = useCallback((value: boolean) => {
    setDownloadUpdatesOnCellularState(value);
    setItem({ key: downloadUpdatesOnCellularKey, value });
  }, []);

  const shouldLoadLowerQualityImages =
    mode === DataSaverMode.ALWAYS_ON ||
    (mode === DataSaverMode.CELLULAR_ONLY &&
      connectionType === ConnectionType.CELLULAR);

  const shouldAutoPlayVideos = !shouldLoadLowerQualityImages;

  // Update [04/09/2025]
  // Disabling this as the race of this callback being called from other providers
  // and when the preferences read from the local storage may not be working properly here
  // and OTA's are being dropped. We are also going to bring OTA updates to pre-onboarding
  // which does not make sense to limit here.
  // const shouldDownloadOTAUpdate = useCallback(async () => {
  //   try {
  //     const connType = await connectionType();
  //     if (connType === ConnectionType.CELLULAR) {
  //       return downloadUpdatesOnCellular;
  //     }
  //   } catch (error) {
  //     // Ignore any potential errors since we don't want to block the user from
  //     // downloading updates unless they're on a cellular network and have opted in.
  //   }
  //   return true;
  // }, [downloadUpdatesOnCellular, connectionType]);

  DdRum.stopAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'DataSaverProvider',
  });

  return (
    <DataSaverContext.Provider
      value={React.useMemo(
        () => ({
          mode,
          setMode,
          downloadUpdatesOnCellular,
          setDownloadUpdatesOnCellular,
          shouldLoadLowerQualityImages,
          shouldAutoPlayVideos,
        }),
        [
          mode,
          setMode,
          downloadUpdatesOnCellular,
          setDownloadUpdatesOnCellular,
          shouldLoadLowerQualityImages,
          shouldAutoPlayVideos,
        ],
      )}
    >
      {children}
    </DataSaverContext.Provider>
  );
};

export const useDataSaver = () => useContext(DataSaverContext);
