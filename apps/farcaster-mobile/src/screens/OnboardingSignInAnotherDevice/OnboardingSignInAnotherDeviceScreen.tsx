import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  buildSyncChannelLoginFailureAnalytics,
  classifySyncChannelLoginError,
  SYNC_CHANNEL_HANDSHAKE_MAX_MS,
  SYNC_CHANNEL_HANDSHAKE_TIMEOUT_MESSAGE,
  SyncChannelLoginCheckpoint,
  useFarcasterApiClient,
  withSyncChannelTimeout,
} from 'farcaster-client-hooks';
import { confirmKeyAgreement, createSyncChannel } from 'farcaster-cryptography';
import { AtomsButton } from 'farcaster-expo';
import { AtSignIcon, EyeIcon, MessageSquareIcon } from 'lucide-react-native';
import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useDebugLogs } from '~/contexts/DebugLogsProvider';
import { useFarcasterAsyncDataStore } from '~/contexts/FarcasterAsyncDataStore';
import { useFarcasterCryptographyKeyStore } from '~/contexts/FarcasterCryptographyKeyStoreProvider';
import { useSyncChannel } from '~/contexts/SyncChannelProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import {
  useUploadAuthToken,
  useUploadMnemonic,
} from '~/hooks/data/syncChannel';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { usePop } from '~/hooks/navigation/usePop';
import { usePopToTop } from '~/hooks/navigation/usePoptoTop';
import { useCancelOnUnmountRef } from '~/hooks/useCancelOnUnmountRef';
import { useOnboardingScreen } from '~/hooks/useOnboardingScreen';
import {
  FetchSyncChannelError,
  OnboardingSignInAnotherDeviceType,
  SyncChannelType,
  UnauthedStackParamList,
} from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import {
  markSyncChannelIdConsumed,
  wasSyncChannelIdConsumed,
} from '~/utils/SyncChannelConsumedUtils';
type OnboardingSignInAnotherDeviceScreenProps = NativeStackScreenProps<
  UnauthedStackParamList,
  'OnboardingSignInAnotherDevice'
>;

const syncChannelType: SyncChannelType = 'authAsSender';
const isSyncChannelSender = true;

const syncChannelErrorMessage = 'We were unable to sync your devices';

const OnboardingSignInAnotherDeviceScreen =
  buildScreen<OnboardingSignInAnotherDeviceScreenProps>(
    { name: 'OnboardingSignInAnotherDevice' },
    ({
      route: {
        params: { channelId, type },
      },
    }) => {
      const t = useTheme();
      const { keyStore } = useFarcasterCryptographyKeyStore();
      const { dataStore } = useFarcasterAsyncDataStore();
      const { setChannelId } = useSyncChannel();

      const [isInitialized, setIsInitialized] = useState(false);

      useEffect(() => {
        const init = async () => {
          if (channelId) {
            setChannelId(syncChannelType, channelId);
          }

          setIsInitialized(true);
        };

        init();
      }, [channelId, dataStore, keyStore, setChannelId]);

      if (!channelId) {
        return (
          <View style={[t.hFull, t.p4, t.justifyCenter, t.itemsCenter]}>
            <Text style={[t.texts.primary, t.textCenter]}>
              We couldn't synchronize the devices.{'\n'}Please try scanning
              again.
            </Text>
          </View>
        );
      }

      if (!isInitialized) {
        return (
          <FullScreenLoadingIndicator debugName="OnboardingSignInAnotherDeviceScreen" />
        );
      }

      return (
        <OnboardingSignInAnotherDeviceScreenWithSyncChannel
          channelId={channelId}
          type={type}
        />
      );
    },
  );

OnboardingSignInAnotherDeviceScreen.displayName =
  'OnboardingSignInAnotherDeviceScreen';

type OnboardingSignInAnotherDeviceScreenWithSyncChannelProps = {
  channelId: string;
  type: OnboardingSignInAnotherDeviceType;
};

const OnboardingSignInAnotherDeviceScreenWithSyncChannel: FC<OnboardingSignInAnotherDeviceScreenWithSyncChannelProps> =
  memo(({ channelId, type }) => {
    const t = useTheme();
    const pop = usePop();
    const popToTop = usePopToTop();
    const { trackEvent } = useAnalytics();
    const [syncing, setSyncing] = useState<boolean>(true);

    useOnboardingScreen({
      title: 'Sign in another device',
      noBackWarning: true,
    });

    const isSignedIn = useIsSignedIn();

    // The screen is registered in both the authed and unauthed navigators so
    // React Navigation can preserve it across an auth ↔ unauth transition.
    // After a successful hand-off the screen records its channelId as
    // consumed; if it ever re-focuses with that same id (e.g. user logs out
    // then back in after completing a web QR login) we pop instead of either
    // showing the misleading "you need to sign in" message or re-running a
    // doomed handshake against a now-stale channel.
    useFocusEffect(
      useCallback(() => {
        if (wasSyncChannelIdConsumed(channelId)) {
          popToTop();
        }
      }, [channelId, popToTop]),
    );

    const { keyStore } = useFarcasterCryptographyKeyStore();
    const { dataStore } = useFarcasterAsyncDataStore();
    const { apiClient } = useFarcasterApiClient();

    const uploadMnemonic = useUploadMnemonic();
    const uploadAuthToken = useUploadAuthToken();

    const [syncError, setSyncError] = useState<string>();
    const cancelControllerRef = useCancelOnUnmountRef();

    const hasUnmountedRef = useRef(false);
    const { addLog } = useDebugLogs();
    const { bottom } = useSafeAreaInsets();

    useEffect(() => {
      return () => {
        hasUnmountedRef.current = true;
      };
    }, []);

    const sync = useCallback(async () => {
      setSyncError(undefined);

      const startedAtMs = Date.now();
      let lastCheckpoint: SyncChannelLoginCheckpoint | undefined;

      try {
        await withSyncChannelTimeout(
          (async () => {
            lastCheckpoint = 'create_sync_channel_started';
            const unconfirmedAgreement = await createSyncChannel({
              cancelController: cancelControllerRef.current,
              dataStore,
              farcasterApiClient: apiClient,
              keyStore,
              sender: isSyncChannelSender,
              syncChannelIdentifier: channelId,
            });

            lastCheckpoint = 'confirm_key_agreement_started';
            await confirmKeyAgreement({
              agreement: unconfirmedAgreement,
              cancelController: cancelControllerRef.current,
              dataStore,
              farcasterApiClient: apiClient,
              keyStore,
              sender: isSyncChannelSender,
              syncChannelIdentifier: channelId,
            });
          })(),
          SYNC_CHANNEL_HANDSHAKE_MAX_MS,
          SYNC_CHANNEL_HANDSHAKE_TIMEOUT_MESSAGE,
          cancelControllerRef.current,
        );
      } catch (error) {
        const { kind } = classifySyncChannelLoginError(error);

        if (kind === 'cancelled') {
          return;
        }

        trackEvent(
          AnalyticsEvent.LoginWithMobileSyncChannelFailed,
          buildSyncChannelLoginFailureAnalytics({
            channelId,
            error,
            phase: 'handshake',
            platform: 'mobile',
            loginType: type,
            isSyncChannelSender,
            startedAtMs,
            lastCheckpoint,
          }),
        );

        trackError(new FetchSyncChannelError({ channelId, error }));
        setSyncError(syncChannelErrorMessage);
        return;
      }
    }, [
      cancelControllerRef,
      dataStore,
      apiClient,
      keyStore,
      channelId,
      trackEvent,
      type,
    ]);

    useEffect(() => {
      if (syncing) {
        sync().then(() => {
          setSyncing(false);
        });
      }
    }, [sync, syncing]);

    // Handle unauthenticated
    if (!isSignedIn) {
      return (
        <View
          style={[
            t.hFull,
            t.justifyBetween,
            t.pX2,
            t.pY6,
            { paddingBottom: bottom },
          ]}
        >
          <View style={[t.justifyCenter, t.flexGrow]}>
            <Text style={[t.texts.primary, t.textBase, t.textCenter]}>
              You need to sign in with this device before you can use it to
              authenticate another device.
            </Text>
          </View>
          <AtomsButton
            onPress={() => {
              pop();
            }}
            style={[t.mB2]}
            size="l"
            hierarchy="primary"
          >
            Go back
          </AtomsButton>
        </View>
      );
    }

    // Handle sync error
    if (syncError) {
      return (
        <View style={[t.hFull, t.p4, t.justifyCenter, t.itemsCenter]}>
          <Text style={[t.texts.primary, t.textBase, t.textCenter]}>
            {syncError}
          </Text>
          <AtomsButton
            onPress={() => {
              setSyncError(undefined);
              setSyncing(true);
            }}
            size="s"
            hierarchy="secondary"
          >
            Retry
          </AtomsButton>
        </View>
      );
    }

    if (syncing) {
      return (
        <View style={[t.hFull, t.p4, t.justifyBetween]}>
          <View style={[t.flexGrow, t.justifyCenter]}>
            <LoadingIndicator />
          </View>
        </View>
      );
    }

    return (
      <View style={[t.hFull, t.p4, t.justifyBetween]}>
        <View style={[t.flexGrow]}>
          <View>
            <Text style={[t.texts.primary, t.textLg, t.fontBold, t.mB8]}>
              Did you login from a new device?
            </Text>
            <View style={[t.gap6]}>
              <Text
                style={[t.texts.secondary, t.textBase, t.fontBold, t.textLeft]}
              >
                Hold yes to let the device:
              </Text>
              <View style={[t.flex, t.flexRow, t.itemsCenter]}>
                <MessageSquareIcon
                  size={18}
                  color={t.colors.text.secondary}
                  style={[t.mR4]}
                />
                <Text style={[t.texts.secondary, t.textBase]}>Cast as you</Text>
              </View>
              <View style={[t.flex, t.flexRow, t.itemsCenter]}>
                <EyeIcon
                  size={18}
                  color={t.colors.text.secondary}
                  style={[t.mR4]}
                />
                <Text style={[t.texts.secondary, t.textBase]}>
                  Read your messages
                </Text>
              </View>
              <View style={[t.flex, t.flexRow, t.itemsCenter]}>
                <AtSignIcon
                  size={18}
                  color={t.colors.text.secondary}
                  style={[t.mR4]}
                />
                <Text style={[t.texts.secondary, t.textBase]}>
                  Transfer your username
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View style={[t.gap2, { paddingBottom: bottom }]}>
          <AtomsButton
            size="l"
            hierarchy="primary"
            onPress={async () => {
              trackEvent(AnalyticsEvent.AuthClickYesThisMe, undefined);

              try {
                const start = Date.now();

                if (type === 'mobile') {
                  await uploadMnemonic({ channelId });
                } else {
                  await uploadAuthToken({ channelId });
                }

                const end = Date.now();
                addLog(
                  `Took ${
                    end - start
                  }ms to complete OnboardingSignInAnotherDevice hand-off`,
                );

                markSyncChannelIdConsumed(channelId);
                pop();
              } catch (error) {
                trackError(error);
                addLog(`Error signing in another device: ${error}`);
              }
            }}
          >
            Yes, this was me
          </AtomsButton>
          <AtomsButton
            hierarchy="overlay"
            size="l"
            onPress={() => {
              trackEvent(AnalyticsEvent.AuthClickNoThisNotMe, undefined);
              pop();
            }}
          >
            No, this was not me
          </AtomsButton>
        </View>
      </View>
    );
  });

OnboardingSignInAnotherDeviceScreenWithSyncChannel.displayName =
  'OnboardingSignInAnotherDeviceScreenWithSyncChannel';

export { OnboardingSignInAnotherDeviceScreen };
