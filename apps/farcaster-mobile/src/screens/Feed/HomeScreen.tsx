import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Device from 'expo-device';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  getNotionLinkTarget,
  isValidUrl,
  useGetSavedDeferredDeepLink,
} from 'farcaster-client-hooks';
import {
  getStoredPasskeys,
  hasRecoveryData,
  isPasskeysSupported,
} from 'farcaster-cryptography';
import { ButtonV2, Typography } from 'farcaster-expo';
import React, { FC, memo, useEffect, useMemo, useRef } from 'react';
import { Linking, Platform, Pressable, View } from 'react-native';
import { useMMKVBoolean } from 'react-native-mmkv';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BulletPoint } from '~/components/BulletPoint';
import { FloatingComposerButton } from '~/components/FloatingComposerButton';
import { FloatingSearch } from '~/components/FloatingSearch/FloatingSearch';
import { Pagers } from '~/components/HomeFeedPagers/Pagers';
import { NewVersionAvailableDirectCastsIndicator } from '~/components/NewVersionAvailableDirectCastsIndicator';
import { HomeFeaturePromotion } from '~/components/promotions/HomeFeaturePromotion';
import { RetryableErrorBoundary } from '~/components/RetryableErrorBoundary';
import { buildScreen } from '~/components/Screen';
import { LiveSpacesStrip } from '~/components/spaces/LiveSpacesStrip';
import { promptPasskeyEnrollmentAfterRecoveryKey } from '~/constants/Storage';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useOpenComposer } from '~/contexts/CreateCastComposerProvider';
import { useFarcasterCryptographyKeyStore } from '~/contexts/FarcasterCryptographyKeyStoreProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { usePush } from '~/hooks/navigation/usePush';
import { useRequestNotificationsPermission } from '~/hooks/pushNotifications/useRequestNotificationsPermission';
import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';
import {
  CastComposerIntent,
  HomeScreenParams,
  HomeStackParamList,
} from '~/types';
import { createCastParamsWithIntent } from '~/utils/CastComposerIntentUtils';
import { trackError } from '~/utils/ErrorUtils';
import { deleteSecureItem, getSecureItem } from '~/utils/SecureStorageUtils';

import {
  HomeScreenSelectedFeedContextProvider,
  HomeSearchProvider,
  ShellContextProvider,
  ShellLayoutContextProvider,
  useHomeSearch,
} from './HomeScreenScrollHandlers';

type HomeScreenProps = NativeStackScreenProps<HomeStackParamList, 'Feed'>;

const fadeInDuration = 250;

const HomeScreen = buildScreen<HomeScreenProps>(
  { name: 'Feed', insetTop: true },
  ({ route: { params } }) => {
    const { appNotAvailable } = useUserAppContext();

    const [skippedAppBlocked, setSkippedAppBlocked] = React.useState(false);

    const navigate = useNavigate();

    if (appNotAvailable && !skippedAppBlocked) {
      return (
        <AppNotAvailable
          onBackUpPress={() => {
            setSkippedAppBlocked(true);

            navigate('Advanced', { section: undefined });
          }}
          onSkipPress={() => {
            setSkippedAppBlocked(true);
          }}
        />
      );
    }

    return (
      <HomeScreenContent
        castComposerIntent={params?.castComposerIntent}
        prompt={params?.prompt}
      />
    );
  },
);

HomeScreen.displayName = 'HomeScreen';

const HomeScreenContent: FC<HomeScreenParams> = memo(
  ({ castComposerIntent }) => {
    const t = useTheme();

    const openComposer = useOpenComposer();

    const { trackEvent } = useAnalytics();

    const push = usePush();

    const { address } = useWallet();

    const { keyStore } = useFarcasterCryptographyKeyStore();

    const { checkUserAppContextGate } = useUserAppContextGate();

    const viewerCanUsePasskeys = checkUserAppContextGate('passkeys').value;

    const requestNotificationsPermission = useRequestNotificationsPermission();

    const [hasCheckedDeferredDeepLink = false, setHasCheckedDeferredDeepLink] =
      useMMKVBoolean('hasCheckedDeferredDeepLink');

    // Check for deferred deep link only once on first auth
    const { data: deferredDeepLinkData } = useGetSavedDeferredDeepLink({
      platform: Platform.OS,
      platformVersion: Platform.Version.toString(),
      deviceName: Device.modelName || 'unknown',
      enabled: !hasCheckedDeferredDeepLink,
    });

    useEffect(() => {
      if (
        !hasCheckedDeferredDeepLink &&
        deferredDeepLinkData?.result?.targetPath
      ) {
        setHasCheckedDeferredDeepLink(true);
        let path: string = deferredDeepLinkData.result.targetPath;
        const isUrl = isValidUrl(deferredDeepLinkData.result.targetPath);
        if (isUrl) {
          path = new URL(deferredDeepLinkData.result.targetPath).pathname;
        }
        if (path.startsWith('/')) {
          path = path.slice(1);
        }
        // Navigate to the deferred deep link
        trackEvent(AnalyticsEvent.DeferredDeepLink, { path });
        Linking.openURL(`farcaster://${path}`)
          .then(() => {
            trackEvent(AnalyticsEvent.DeferredDeepLinkSuccess, { path });
          })
          .catch(() => {
            trackEvent(AnalyticsEvent.DeferredDeepLinkFailed, { path });
          });
      } else if (!hasCheckedDeferredDeepLink && deferredDeepLinkData) {
        // No deep link found, mark as checked
        setHasCheckedDeferredDeepLink(true);
      }
    }, [
      deferredDeepLinkData,
      hasCheckedDeferredDeepLink,
      setHasCheckedDeferredDeepLink,
      trackEvent,
    ]);

    React.useEffect(() => {
      if (Device.isDevice && viewerCanUsePasskeys) {
        isPasskeysSupported({ keyStore })
          .then(async (supported) => {
            if (!supported) return;
            if (!address) return;

            const passkeys = await getStoredPasskeys({ keyStore });
            const userPasskey = passkeys.find((p) => p.address === address);
            const shouldPromptAfterRecovery = await getSecureItem({
              key: promptPasskeyEnrollmentAfterRecoveryKey,
              fallback: false,
            });

            if (shouldPromptAfterRecovery) {
              await deleteSecureItem(promptPasskeyEnrollmentAfterRecoveryKey);
            }

            if (!userPasskey) {
              // No passkey at all — show enrollment prompt.
              // Recovery completion bypasses previous dismissal to avoid lockout.
              const dismissed = await getSecureItem({
                key: 'user-dismissed-passkeys',
                fallback: false,
              });
              if (shouldPromptAfterRecovery || !dismissed) {
                trackEvent(AnalyticsEvent.PasskeysEnrollPromptShown, {
                  trigger: shouldPromptAfterRecovery
                    ? 'recovery_completed'
                    : 'first_prompt',
                });
                push('PasskeysBackupExistingUser', {});
              }
            } else {
              // Has passkey — check if recovery data is missing (pre-v2.0.17 enrollment).
              // We always check hasRecoveryData rather than using a dismissal flag,
              // so that transient failures or partial migrations are retried.
              const hasData = await hasRecoveryData({
                keyStore,
                credentialId: userPasskey.credentialId,
              });
              if (!hasData) {
                push('PasskeysBackupExistingUser', {
                  migrateCredentialId: userPasskey.credentialId,
                });
              }
            }
          })
          .catch(trackError);
      }
    }, [address, keyStore, push, trackEvent, viewerCanUsePasskeys]);

    useEffect(() => {
      requestNotificationsPermission({
        onAsked: () => {
          trackEvent(AnalyticsEvent.AskedForPushHomeFeed, undefined);
        },
        onGranted: () => {
          trackEvent(AnalyticsEvent.GrantedForPushHomeFeed, undefined);
        },
      });
    }, [requestNotificationsPermission, trackEvent]);

    const navigation =
      useNavigation<
        NativeStackScreenProps<HomeStackParamList, 'Feed'>['navigation']
      >();

    // Show the create-cast composer for a compose intent arriving via
    // navigation params (e.g. a `farcaster.xyz/~/compose` deep link, including
    // one a mini app opens through `openUrl`).
    //
    // The intent is a one-shot command, but `openComposer` changes identity
    // every time the composer opens or closes (its `useCallback` in
    // CreateCastComposerProvider depends on the composer visibility state), so
    // any effect that both reads the intent param and depends on `openComposer`
    // re-runs on every open/close. If the param isn't cleared, cancelling the
    // composer re-runs the effect and reopens it in an endless loop that can
    // only be escaped by force-quitting the app.
    //
    // We split this into two effects so the param is cleared *immediately* on
    // consumption (surviving an early unmount — otherwise a later remount would
    // re-consume it) without the resulting re-render cancelling the pending
    // open: the consume effect below only clears the param and stashes the
    // intent locally, and the open effect owns the delayed `openComposer` timer.
    const consumedComposerIntentRef = useRef<CastComposerIntent | undefined>(
      undefined,
    );
    const [pendingComposerIntent, setPendingComposerIntent] = React.useState<
      CastComposerIntent | undefined
    >(undefined);

    useEffect(() => {
      if (typeof castComposerIntent === 'undefined') {
        return;
      }
      if (consumedComposerIntentRef.current === castComposerIntent) {
        return;
      }
      consumedComposerIntentRef.current = castComposerIntent;
      setPendingComposerIntent(castComposerIntent);
      // Clear the one-shot intent immediately so navigating away before the
      // composer opens can't leave it set for a later remount to re-consume.
      navigation.setParams({ castComposerIntent: undefined });
    }, [castComposerIntent, navigation]);

    useEffect(() => {
      if (typeof pendingComposerIntent === 'undefined') {
        return;
      }
      const intent = pendingComposerIntent;
      const timer = setTimeout(() => {
        openComposer(createCastParamsWithIntent(intent));
        setPendingComposerIntent(undefined);
      }, fadeInDuration * 4);

      // Cancel the pending open if the screen unmounts first.
      return () => clearTimeout(timer);
    }, [pendingComposerIntent, openComposer]);

    const insets = useSafeAreaInsets();

    const scrollableBanner = useMemo(() => {
      return (
        <>
          <NewVersionAvailableDirectCastsIndicator />
          <HomeFeaturePromotion />
        </>
      );
    }, []);

    const homeFeedBanner = useMemo(() => {
      return <LiveSpacesStrip />;
    }, []);

    return (
      <HomeScreenSelectedFeedContextProvider>
        <HomeSearchProvider>
          <ShellLayoutContextProvider>
            <ShellContextProvider>
              <Animated.View style={[t.hFull]}>
                <View style={[t.hFull, t.flexCol]}>
                  <View
                    style={[
                      t.bgDefault,
                      {
                        height: insets.top,
                        marginTop: -insets.top,
                        zIndex: 2,
                      },
                    ]}
                  />
                  <RetryableErrorBoundary>
                    <Pagers
                      scrollableBanner={scrollableBanner}
                      homeFeedBanner={homeFeedBanner}
                    />
                  </RetryableErrorBoundary>
                </View>
                <UpdatedFloatingTargets />
              </Animated.View>
            </ShellContextProvider>
          </ShellLayoutContextProvider>
        </HomeSearchProvider>
      </HomeScreenSelectedFeedContextProvider>
    );
  },
);

HomeScreenContent.displayName = 'HomeScreenContent';

const AppNotAvailable: FC<{
  onBackUpPress: () => void;
  onSkipPress: () => void;
}> = ({ onBackUpPress, onSkipPress }) => {
  const { trackEvent } = useAnalytics();

  const t = useTheme();

  const push = usePush();

  useFocusEffect(
    React.useCallback(() => {
      trackEvent(AnalyticsEvent.ViewAppNotAvailable, {});
    }, [trackEvent]),
  );

  return (
    <View style={[t.hFull, t.wFull, t.bgDefault]}>
      <View style={[t.flex1, t.mT12, t.pX4]}>
        <View>
          <Typography label="Semibold/2XL" color="primary">
            The Farcaster app is no longer available in your region
          </Typography>
        </View>
        <View style={[t.pY6, t.gap4, t.flex1, t.justifyStart, t.itemsStart]}>
          <View style={[t.flexRow, t.gap3]}>
            <BulletPoint />
            <View style={[t.gap1, t.flex1]}>
              <Typography label="Regular/Base" color="primary">
                Your current app will remain unaffected.
              </Typography>
            </View>
          </View>
          <View style={[t.flexRow, t.gap3]}>
            <BulletPoint />
            <View style={[t.gap1, t.flex1]}>
              <Typography label="Regular/Base" color="primary">
                If you remove the app you will no longer be able to download it
                again.
              </Typography>
            </View>
          </View>
          <View style={[t.flexRow, t.gap3]}>
            <BulletPoint />
            <View style={[t.gap1, t.flex1]}>
              <Typography label="Regular/Base" color="primary">
                Please back up both your recovery phrases.
              </Typography>
            </View>
          </View>
          <View style={[t.flexRow, t.gap3]}>
            <BulletPoint />
            <View style={[t.gap1, t.flex1, t.flexRow]}>
              <Typography label="Regular/Base" color="primary">
                Learn more
              </Typography>
              <Pressable
                onPress={() => {
                  trackEvent(
                    AnalyticsEvent.ClickedAppBlockedLearnMore,
                    undefined,
                  );

                  push('Cast', {
                    castHash: '0xd5a0e5edf7d113595d2fd9d3fe929d41adf2bbb8',
                  });
                }}
              >
                <Typography label="Regular/Base" color="brand">
                  here
                </Typography>
              </Pressable>
            </View>
          </View>
          <View style={[t.flexRow, t.gap3]}>
            <BulletPoint />
            <View style={[t.gap1, t.flex1, t.flexRow]}>
              <Typography label="Regular/Base" color="primary">
                Alternative Farcaster clients
              </Typography>
              <Pressable
                onPress={() => {
                  trackEvent(
                    AnalyticsEvent.ClickedAppBlockedAltClients,
                    undefined,
                  );

                  Linking.openURL(
                    getNotionLinkTarget({
                      to: 'alternative-farcaster-clients',
                    }),
                  );
                }}
              >
                <Typography label="Regular/Base" color="brand">
                  here
                </Typography>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
      <View style={[t.flex, t.flexCol, t.mX4, t.mB4, { gap: 8 }]}>
        <ButtonV2
          title={'Back up'}
          textSize="lg"
          onPress={() => {
            trackEvent(AnalyticsEvent.ClickedAppBlockedBackUp, undefined);

            onBackUpPress();
          }}
        />
        <ButtonV2
          title={'Skip for now'}
          onPress={() => {
            trackEvent(AnalyticsEvent.ClickedAppBlockedSkip, undefined);

            onSkipPress();
          }}
          variant="tertiary"
        />
      </View>
    </View>
  );
};

function UpdatedFloatingTargets() {
  const { searchAutoOpen, setSearchAutoOpen } = useHomeSearch();

  return (
    <>
      <FloatingComposerButton />
      <FloatingSearch
        source="home"
        showPressable={false}
        autoOpen={searchAutoOpen}
        onAutoOpenHandled={() => setSearchAutoOpen(false)}
      />
    </>
  );
}

export { HomeScreen };
