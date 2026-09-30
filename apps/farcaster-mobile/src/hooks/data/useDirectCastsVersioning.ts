import { compareVersions } from 'compare-versions';
import * as Application from 'expo-application';
import { useClientConfig } from 'farcaster-client-hooks';
import { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';

import { useCheckForOverTheAirUpdate } from '~/contexts/CheckForOverTheAirUpdateProvider';

const useDirectCastsVersioning = () => {
  const { hasDownloadedUpdate } = useCheckForOverTheAirUpdate();
  const { data } = useClientConfig();
  const { nativeBuildVersion, nativeApplicationVersion } = Application;

  const {
    minNativeAppVersionForDirectCasts,
    minNativeBuildVersionForDirectCasts,
  } = useMemo(() => {
    return Platform.select({
      ios: {
        minNativeAppVersionForDirectCasts:
          data?.result.ios.minNativeAppVersionForDirectCasts,
        minNativeBuildVersionForDirectCasts:
          data?.result.ios.minNativeBuildVersionForDirectCasts,
      },
      android: {
        minNativeAppVersionForDirectCasts:
          data?.result.android.minNativeAppVersionForDirectCasts,
        minNativeBuildVersionForDirectCasts:
          data?.result.android.minNativeBuildVersionForDirectCasts,
      },
      default: {
        minNativeAppVersionForDirectCasts: '',
        minNativeBuildVersionForDirectCasts: '',
      },
    });
  }, [
    data?.result.android.minNativeAppVersionForDirectCasts,
    data?.result.android.minNativeBuildVersionForDirectCasts,
    data?.result.ios.minNativeAppVersionForDirectCasts,
    data?.result.ios.minNativeBuildVersionForDirectCasts,
  ]);

  const isPastVersion = useCallback(
    ({
      versionToCheck,
      versionTarget,
    }: {
      versionTarget: string;
      versionToCheck: string;
    }) => {
      return compareVersions(versionToCheck, versionTarget) === -1;
    },
    [],
  );

  const shouldRestart = useMemo(() => {
    return hasDownloadedUpdate;
  }, [hasDownloadedUpdate]);

  const shouldUpdate = useMemo(() => {
    return (
      nativeApplicationVersion !== null &&
      typeof minNativeAppVersionForDirectCasts !== 'undefined' &&
      nativeBuildVersion !== null &&
      typeof minNativeBuildVersionForDirectCasts !== 'undefined' &&
      (isPastVersion({
        versionToCheck: nativeApplicationVersion,
        versionTarget: minNativeAppVersionForDirectCasts,
      }) ||
        isPastVersion({
          versionToCheck: nativeBuildVersion,
          versionTarget: minNativeBuildVersionForDirectCasts,
        }))
    );
  }, [
    isPastVersion,
    minNativeAppVersionForDirectCasts,
    minNativeBuildVersionForDirectCasts,
    nativeApplicationVersion,
    nativeBuildVersion,
  ]);

  return { shouldRestart, shouldUpdate };
};

export { useDirectCastsVersioning };
