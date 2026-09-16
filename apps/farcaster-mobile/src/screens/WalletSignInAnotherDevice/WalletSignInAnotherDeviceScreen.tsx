import { Ionicons } from '@expo/vector-icons';
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
import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';

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
import { useUploadWalletAuth } from '~/hooks/data/syncChannel';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { usePop } from '~/hooks/navigation/usePop';
import { usePopToTop } from '~/hooks/navigation/usePoptoTop';
import { useCancelOnUnmountRef } from '~/hooks/useCancelOnUnmountRef';
import {
  FetchSyncChannelError,
  SyncChannelType,
  UnauthedStackParamList,
} from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import {
  markSyncChannelIdConsumed,
  wasSyncChannelIdConsumed,
} from '~/utils/SyncChannelConsumedUtils';

type WalletSignInAnotherDeviceScreenProps = NativeStackScreenProps<
  UnauthedStackParamList,
  'WalletSignInAnotherDevice'
>;

const syncChannelType: SyncChannelType = 'authAsSender';
const isSyncChannelSender = true;

const syncChannelErrorMessage = 'We were unable to sync your devices';

const WalletSignInAnotherDeviceScreen =
  buildScreen<WalletSignInAnotherDeviceScreenProps>(
    { name: 'WalletSignInAnotherDevice' },
    ({
      route: {
        params: { channelId, nonce, expiresAt },
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

      if (!channelId || !nonce || !expiresAt) {
        return (
          <View style={[t.hFull, t.p4, t.justifyCenter, t.itemsCenter]}>
            <Text style={[t.texts.primary, t.textCenter]}>
              We couldn't connect your wallet to the device.{'\n'}Please try
              scanning again.
            </Text>
          </View>
        );
      }

      if (!isInitialized) {
        return (
          <FullScreenLoadingIndicator debugName="WalletSignInAnotherDeviceScreen" />
        );
      }

      return (
        <WalletSignInAnotherDeviceScreenWithSyncChannel
          channelId={channelId}
          nonce={nonce}
          expiresAt={expiresAt}
        />
      );
    },
  );

WalletSignInAnotherDeviceScreen.displayName = 'WalletSignInAnotherDeviceScreen';

type WalletSignInAnotherDeviceScreenWithSyncChannelProps = {
  channelId: string;
  nonce: string;
  expiresAt: string;
};

const WalletSignInAnotherDeviceScreenWithSyncChannel: FC<WalletSignInAnotherDeviceScreenWithSyncChannelProps> =
  memo(({ channelId, nonce, expiresAt }) => {
    const t = useTheme();
    const pop = usePop();
    const popToTop = usePopToTop();
    const { trackEvent } = useAnalytics();
    const [syncing, setSyncing] = useState<boolean>(true);

    // See `SyncChannelConsumedUtils` — this screen is registered in both the
    // authed and unauthed navigators, so React Navigation can preserve it
    // across an auth ↔ unauth transition. Once a channelId has been used we
    // pop instead of re-rendering with stale state, and we skip telemetry so
    // stale remounts don't pollute the `WalletSignInAttempt` count.
    useFocusEffect(
      useCallback(() => {
        if (wasSyncChannelIdConsumed(channelId)) {
          popToTop();
          return;
        }

        trackEvent(AnalyticsEvent.WalletSignInAttempt, undefined);
      }, [channelId, popToTop, trackEvent]),
    );

    const isSignedIn = useIsSignedIn();

    const { keyStore } = useFarcasterCryptographyKeyStore();
    const { dataStore } = useFarcasterAsyncDataStore();
    const { apiClient } = useFarcasterApiClient();

    const uploadWalletAuth = useUploadWalletAuth();

    const [syncError, setSyncError] = useState<string>();
    const cancelControllerRef = useCancelOnUnmountRef();

    const hasUnmountedRef = useRef(false);
    const { addLog } = useDebugLogs();

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
            loginType: 'wallet',
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
        <View style={[t.hFull, t.justifyBetween, t.pX2, t.pY6]}>
          <View style={[t.justifyCenter, t.flexGrow]}>
            <Text style={[t.texts.primary, t.textBase, t.textCenter]}>
              You need to sign in with this device before you can connect your
              wallet to another device.
            </Text>
          </View>
          <AtomsButton
            size="l"
            hierarchy="primary"
            style={[t.mB2]}
            onPress={() => {
              pop();
            }}
          >
            Go back
          </AtomsButton>
        </View>
      );
    }

    // Handle sync error
    if (syncError) {
      return (
        <View style={[t.hFull, t.p4, t.justifyBetween]}>
          <View style={[t.flexGrow, t.justifyCenter]}>
            <Text style={[t.texts.primary, t.textBase, t.textCenter]}>
              {syncError}
            </Text>
          </View>
          <AtomsButton
            size="l"
            hierarchy="primary"
            onPress={() => {
              setSyncError(undefined);
              setSyncing(true);
            }}
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
        <View style={[t.flexGrow, t.justifyCenter, t.itemsCenter]}>
          <View>
            <Text
              style={[
                t.texts.primary,
                t.textLg,
                t.fontBold,
                t.textCenter,
                t.mB8,
              ]}
            >
              Did you attempt to connect your wallet from a new device?
            </Text>
            <Text style={[t.texts.secondary, t.textBase, t.textLeft, t.mB8]}>
              Hold yes to let the device:
            </Text>
            <View>
              <View style={[t.mB6, t.flex, t.flexRow, t.itemsCenter]}>
                <Ionicons
                  name="wallet-outline"
                  size={18}
                  color={t.colors.text.secondary}
                  style={[t.mR4]}
                />
                <Text style={[t.texts.secondary, t.textBase]}>
                  Use your wallet
                </Text>
              </View>
            </View>
          </View>
        </View>
        <AtomsButton
          size="l"
          hierarchy="primary"
          onPress={async () => {
            trackEvent(AnalyticsEvent.AuthClickYesThisMe, undefined);

            try {
              const start = Date.now();

              await uploadWalletAuth({ channelId, nonce, expiresAt });

              const end = Date.now();
              addLog(
                `Took ${
                  end - start
                }ms to complete WalletSignInAnotherDevice hand-off`,
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
          hierarchy="secondary"
          size="l"
          onPress={() => {
            trackEvent(AnalyticsEvent.AuthClickNoThisNotMe, undefined);
            pop();
          }}
        >
          No, this was not me
        </AtomsButton>
      </View>
    );
  });

WalletSignInAnotherDeviceScreenWithSyncChannel.displayName =
  'WalletSignInAnotherDeviceScreenWithSyncChannel';

export { WalletSignInAnotherDeviceScreen };
