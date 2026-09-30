import { useBottomSheet } from '@gorhom/bottom-sheet';
import { compareVersions } from 'compare-versions';
import * as Application from 'expo-application';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useClientConfigNonSuspense } from 'farcaster-client-hooks';
import { AtomsButton } from 'farcaster-expo';
import { RocketIcon } from 'lucide-react-native';
import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AutoDisplayingBottomSheetModal } from '~/components/BottomSheet/AutoDisplayingBottomSheetModal';
import { Text } from '~/components/Text';
import { appStoreUpdatePromptKey } from '~/constants/Storage';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { getPromptInfo, setPromptInfo } from '~/utils/PromptUtils';
import { openWarpcastAppDownload } from '~/utils/UrlUtils';

// NEYN-11640: Suppress the prompt in E2E builds (Maestro/BrowserStack).
// The drawer is a @gorhom/bottom-sheet modal that Maestro's
// accessibility traversal cannot reach on Android (runs 27044901883,
// 27153236046), blocking the sign-in flow. Internal EAS builds are
// routinely behind the production app-store version, so the drawer
// surfaces reliably on real-device E2E runs. The env var is set on
// the `internal` EAS profile (eas.json); production builds (the
// `production` profile) do not set it, so end users still see the
// prompt as intended.
const isAppStoreUpdatePromptDisabled =
  process.env.EXPO_PUBLIC_DISABLE_APPSTORE_PROMPT === '1';

const AppStoreUpdatePrompt: FC = memo(() => {
  const [enabled, setEnabled] = useState(false);

  // Delay fetching to not interfere with app initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      setEnabled(true);
    }, 3_000);
    return () => clearTimeout(timer);
  }, []);

  const { data } = useClientConfigNonSuspense({ enabled });

  const [isUpgradeAvailable, setIsUpgradeAvailable] = useState(false);

  useEffect(() => {
    if (!data) return;

    const { result } = data;
    const { minNativeAppVersionToPrompt, minNativeBuildVersionToPrompt } =
      Platform.select({
        ios: {
          minNativeAppVersionToPrompt: result.ios.minNativeAppVersionToPrompt,
          minNativeBuildVersionToPrompt:
            result.ios.minNativeBuildVersionToPrompt,
        },
        android: {
          minNativeAppVersionToPrompt:
            result.android.minNativeAppVersionToPrompt,
          minNativeBuildVersionToPrompt:
            result.android.minNativeBuildVersionToPrompt,
        },
        default: {
          minNativeAppVersionToPrompt: '',
          minNativeBuildVersionToPrompt: '',
        },
      });

    const { nativeApplicationVersion, nativeBuildVersion } = Application;

    if (
      nativeApplicationVersion &&
      nativeBuildVersion &&
      minNativeAppVersionToPrompt &&
      minNativeBuildVersionToPrompt &&
      (compareVersions(
        nativeApplicationVersion,
        minNativeAppVersionToPrompt,
      ) === -1 ||
        compareVersions(nativeBuildVersion, minNativeBuildVersionToPrompt) ===
          -1)
    ) {
      getPromptInfo({ storageKey: appStoreUpdatePromptKey }).then(
        ({ lastPresentedAt }) => {
          const oneDayMs = 24 * 60 * 60 * 1000;
          const snoozedRecently =
            lastPresentedAt > 0 && Date.now() - lastPresentedAt < oneDayMs;
          setIsUpgradeAvailable(!snoozedRecently);
        },
      );
    } else {
      setIsUpgradeAvailable(false);
    }
  }, [data]);

  const handleDismiss = useCallback(() => {
    setPromptInfo({
      storageKey: appStoreUpdatePromptKey,
      info: { lastPresentedAt: Date.now() },
    });
  }, []);

  if (isAppStoreUpdatePromptDisabled || !isUpgradeAvailable) {
    return null;
  }

  return (
    <AutoDisplayingBottomSheetModal
      name="appStoreUpdate"
      enableDynamicSizing
      stackBehavior="push"
      onDismiss={handleDismiss}
    >
      <AppStoreUpdatePromptContent />
    </AutoDisplayingBottomSheetModal>
  );
});

AppStoreUpdatePrompt.displayName = 'AppStoreUpdatePrompt';

const AppStoreUpdatePromptContent: FC = () => {
  const t = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { trackEvent } = useAnalytics();
  const { forceClose } = useBottomSheet();

  useEffect(() => {
    trackEvent(AnalyticsEvent.AppStoreUpdateDrawerShown, undefined);
  }, [trackEvent]);

  const handleUpdate = useCallback(() => {
    trackEvent(AnalyticsEvent.ClickedAppStoreUpdateDrawerUpdate, undefined);
    openWarpcastAppDownload();
  }, [trackEvent]);

  const handleDismiss = useCallback(() => {
    trackEvent(AnalyticsEvent.DismissedAppStoreUpdateDrawer, undefined);
    forceClose();
  }, [forceClose, trackEvent]);

  return (
    <View>
      <View
        style={[
          t.flex,
          t.flexCol,
          t.itemsCenter,
          t.p4,
          t.pT5,
          { gap: sizes.s3, paddingBottom: Math.max(bottom, sizes.s4) },
        ]}
      >
        <RocketIcon size={48} color={t.colors.text.primary} />

        <View style={[t.flex, t.flexCol, t.itemsCenter, { gap: sizes.s2 }]}>
          <Text style={[t.texts.primary, t.text2xl, t.fontBold, t.textCenter]}>
            Update available
          </Text>
          <Text style={[t.texts.secondary, t.textBase, t.textCenter, t.mX2]}>
            A new version of Farcaster is available. Update for the best
            experience.
          </Text>
        </View>

        <View
          style={[
            t.wFull,
            t.flex,
            t.flexCol,
            { gap: sizes.s2, marginTop: sizes.s4 },
          ]}
        >
          <AtomsButton onPress={handleUpdate} size="l" hierarchy="primary">
            Update now
          </AtomsButton>
          <AtomsButton onPress={handleDismiss} size="l" hierarchy="overlay">
            Not Now
          </AtomsButton>
        </View>
      </View>
    </View>
  );
};

export { AppStoreUpdatePrompt };
