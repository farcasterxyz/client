import { compareVersions } from 'compare-versions';
import * as Application from 'expo-application';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useClientConfigNonSuspense } from 'farcaster-client-hooks';
import { ButtonV2 } from 'farcaster-expo';
import { RocketIcon } from 'lucide-react-native';
import React, {
  FC,
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { Platform, View } from 'react-native';

import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useSplash } from '~/contexts/SplashProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { openWarpcastAppDownload } from '~/utils/UrlUtils';

import { Text } from './Text';

type EnsureMinAppVersionProps = {
  children: ReactNode;
};

const EnsureMinAppVersion: FC<EnsureMinAppVersionProps> = memo(
  ({ children }) => {
    const { trackEvent } = useAnalytics();

    const [enabled, setEnabled] = useState(false);

    // Since this isn't critical to initial app renders delay fetching until
    // after app initialization
    useEffect(() => {
      setTimeout(() => {
        setEnabled(true);
      }, 3_000);
    }, []);

    const { nativeBuildVersion, nativeApplicationVersion } = Application;
    const { data } = useClientConfigNonSuspense({ enabled });

    // Hard min-versioning: block the app until user updates.
    const [isUpgradeRequired, setIsUpgradeRequired] = useState(false);

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

    useEffect(() => {
      if (data) {
        const { result } = data;
        const { minNativeAppVersion, minNativeBuildVersion } = Platform.select({
          ios: {
            minNativeAppVersion: result.ios.minNativeAppVersion,
            minNativeBuildVersion: result.ios.minNativeBuildVersion,
          },
          android: {
            minNativeAppVersion: result.android.minNativeAppVersion,
            minNativeBuildVersion: result.android.minNativeBuildVersion,
          },
          default: {
            minNativeAppVersion: '',
            minNativeBuildVersion: '',
          },
        });

        if (nativeApplicationVersion && nativeBuildVersion) {
          if (
            minNativeAppVersion &&
            minNativeBuildVersion &&
            (isPastVersion({
              versionToCheck: nativeApplicationVersion,
              versionTarget: minNativeAppVersion,
            }) ||
              isPastVersion({
                versionToCheck: nativeBuildVersion,
                versionTarget: minNativeBuildVersion,
              }))
          ) {
            trackEvent(AnalyticsEvent.MinVersionRequiredShown, undefined);

            setIsUpgradeRequired(true);
          }
        }
      }
    }, [
      isPastVersion,
      nativeApplicationVersion,
      nativeBuildVersion,
      data?.result,
      trackEvent,
      data,
    ]);

    if (isUpgradeRequired) {
      return <UpgradeAvailable />;
    }

    return <>{children}</>;
  },
);

type UpgradeAvailableProps = Record<string, never>;

const UpgradeAvailable: FC<UpgradeAvailableProps> = () => {
  const { trackEvent } = useAnalytics();

  const t = useTheme();

  const { onAppInitialized } = useSplash();

  useEffect(() => {
    // We call onAppInitialized to ensure that the faux splash screen
    // transitions out in cases where one of the top-level API requests
    // (e.g. fetching the current user profile + activity) fails
    // before we even get a chance to render the navigation container
    // and a screen that would typically trigger this behavior.
    onAppInitialized();
  }, [onAppInitialized]);

  return (
    <View style={[t.hFull, t.wFull, t.bgDefault]}>
      <View
        style={[
          t.flex,
          t.flexCol,
          t.itemsCenter,
          t.justifyStart,
          t.mT24,
          t.mX4,
        ]}
      >
        <Text
          style={[
            t.texts.primary,
            t.textBase,
            t.textCenter,
            t.text2xl,
            t.fontBold,
          ]}
        >
          New version available
        </Text>
      </View>
      <View style={[t.flex, t.itemsCenter, t.justifyCenter, t.flexGrow]}>
        <RocketIcon size={132} color={t.colors.text.primary} />
      </View>
      <View style={[t.flex, t.flexCol, t.mX4, t.mB6, { gap: 8 }]}>
        <ButtonV2
          title={'Update'}
          textSize="lg"
          onPress={() => {
            trackEvent(
              AnalyticsEvent.ClickedMinVersionAvailableUpdate,
              undefined,
            );

            openWarpcastAppDownload();
          }}
        />
      </View>
    </View>
  );
};

export { EnsureMinAppVersion };
