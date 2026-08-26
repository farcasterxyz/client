import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { compareVersions } from 'compare-versions';
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
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

import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { versionStorageKey } from '~/constants/Storage';
import { trackError } from '~/utils/ErrorUtils';
import { getItem, setItem } from '~/utils/StorageUtils';

type VersionContextValue = {
  nativeApplicationVersion: string | null;
  nativeBuildVersion: string | null;
  releaseChannel: string | null;
  updateId: string | null;
  hasVersionChanged: boolean;
  isCurrentVersionGreaterThan: (
    nativeApplicationVersion: string,
    nativeBuildVersion: string,
  ) => boolean;
};

type Version = {
  nativeApplicationVersion: string | null;
  nativeBuildVersion: string | null;
  releaseChannel: string | null;
  updateId: string | null;
};

const VersionContext = createContext<VersionContextValue>({
  nativeApplicationVersion: null,
  nativeBuildVersion: null,
  releaseChannel: null,
  updateId: null,
  hasVersionChanged: false,
  isCurrentVersionGreaterThan: () => false,
});

const { updateId } = Updates;

export const EXPO_UPDATE_URL_PREFIX =
  'https://expo.dev/accounts/farcaster/projects/farcaster/updates/';

type VersionProviderProps = {
  children: ReactNode;
};

const VersionProvider: FC<VersionProviderProps> = memo(({ children }) => {
  DdRum.startAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'VersionProvider',
  });

  const queryClient = useQueryClient();

  const { nativeBuildVersion, nativeApplicationVersion } = Application;
  const [hasVersionChanged, setHasVersionChanged] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const persistedVersion = await getItem<Version | null>({
          key: versionStorageKey,
          fallback: null,
        });

        const versionChanged =
          !persistedVersion ||
          persistedVersion.nativeApplicationVersion !==
            nativeApplicationVersion ||
          persistedVersion.nativeBuildVersion !== nativeBuildVersion ||
          persistedVersion.releaseChannel !== Updates.channel ||
          persistedVersion.updateId !== updateId;

        setHasVersionChanged(versionChanged);

        if (versionChanged) {
          queryClient.clear();
        }

        await setItem({
          key: versionStorageKey,
          value: {
            nativeBuildVersion,
            nativeApplicationVersion,
            releaseChannel: Updates.channel,
            updateId,
          },
        });
      } catch (err) {
        trackError(err);
      } finally {
        setIsInitialized(true);
      }
    };

    run();
  }, [nativeApplicationVersion, nativeBuildVersion, queryClient]);

  const isCurrentVersionGreaterThan = useCallback(
    (
      otherNativeApplicationVersion: string,
      otherNativeBuildVersion: string,
    ) => {
      if (nativeApplicationVersion === null) {
        return false;
      }

      const appComparisonResult = compareVersions(
        nativeApplicationVersion,
        otherNativeApplicationVersion,
      );

      if (appComparisonResult === 1) {
        return true;
      } else if (appComparisonResult === -1) {
        return false;
      }

      if (nativeBuildVersion === null) {
        return false;
      }

      return parseInt(nativeBuildVersion) > parseInt(otherNativeBuildVersion);
    },
    [nativeApplicationVersion, nativeBuildVersion],
  );

  if (!isInitialized) {
    return <FullScreenLoadingIndicator debugName="VersionProvider" />;
  }

  DdRum.stopAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'VersionProvider',
  });

  return (
    <VersionContext.Provider
      value={{
        nativeApplicationVersion,
        nativeBuildVersion,
        releaseChannel: Updates.channel,
        updateId,
        hasVersionChanged,
        isCurrentVersionGreaterThan,
      }}
    >
      {children}
    </VersionContext.Provider>
  );
});

const useVersion = () => useContext(VersionContext);

export { useVersion, VersionProvider };
