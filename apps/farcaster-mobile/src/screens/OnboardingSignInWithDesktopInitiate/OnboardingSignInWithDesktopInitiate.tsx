import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  useFarcasterApiClient,
  useMarkSyncChannelMessageRead,
} from 'farcaster-client-hooks';
import {
  confirmKeyAgreement,
  createSyncChannel,
  getKeyTransport,
} from 'farcaster-cryptography';
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button } from '~/components/Button';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useDebugCryptography } from '~/contexts/DebugCryptographyProvider';
import { useFarcasterAsyncDataStore } from '~/contexts/FarcasterAsyncDataStore';
import { useFarcasterCryptographyKeyStore } from '~/contexts/FarcasterCryptographyKeyStoreProvider';
import { useSyncChannel } from '~/contexts/SyncChannelProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import {
  useDecryptMnemonic,
  usePollForLatestSyncChannelMessage,
} from '~/hooks/data/syncChannel';
import { useImportWalletFromMnemonic } from '~/hooks/data/useImportWalletFromMnemonic';
import { usePop } from '~/hooks/navigation/usePop';
import { usePush } from '~/hooks/navigation/usePush';
import { useCancelOnUnmountRef } from '~/hooks/useCancelOnUnmountRef';
import {
  SyncChannelType,
  UnauthedStackParamList,
  UserDoesNotExistQRCodeSignInError,
} from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import { AnalyticsEventUsernameFallback } from '~/utils/UserUtils';

const syncChannelType: SyncChannelType = 'authAsSender';
const isSyncChannelSender = false;

type OnboardingSignInWithDesktopInitiateScreenProps = NativeStackScreenProps<
  UnauthedStackParamList,
  'OnboardingSignInWithDesktopInitiate'
>;

const OnboardingSignInWithDesktopInitiateScreen =
  buildScreen<OnboardingSignInWithDesktopInitiateScreenProps>(
    { name: 'OnboardingSignInWithDesktopInitiate' },
    ({
      route: {
        params: { channelId },
      },
    }) => {
      const t = useTheme();
      const pop = usePop();

      const { addCryptographyLog } = useDebugCryptography();
      const { trackEvent } = useAnalytics();

      const hasRequiredParams = !!channelId;
      const [error, setError] = useState(
        channelId ? undefined : 'We could not find a channel id',
      );

      const { apiClient } = useFarcasterApiClient();
      const { keyStore } = useFarcasterCryptographyKeyStore();
      const { dataStore } = useFarcasterAsyncDataStore();
      const cancelControllerRef = useCancelOnUnmountRef();
      const { setChannelId } = useSyncChannel();

      const markSyncChannelMessageRead = useMarkSyncChannelMessageRead();
      const pollForLatestSyncChannelMessage =
        usePollForLatestSyncChannelMessage();
      const decryptMnemonic = useDecryptMnemonic();
      const importWalletFromMnemonic = useImportWalletFromMnemonic();
      const push = usePush();

      useEffect(() => {
        if (channelId) {
          setChannelId(syncChannelType, channelId);
        }
      }, [channelId, setChannelId]);

      const createSyncChannelAndUploadMnemonic = useCallback(async () => {
        if (!channelId) {
          return;
        }

        try {
          setError(undefined);
          const transport = await getKeyTransport({ keyStore, dataStore });
          await transport.resetKeyTransport();

          const agreement = await createSyncChannel({
            cancelController: cancelControllerRef.current,
            farcasterApiClient: apiClient,
            keyStore,
            dataStore,
            // We have to flip this one because desktop created the QR
            sender: !isSyncChannelSender,
            syncChannelIdentifier: channelId,
          });

          if (!agreement) {
            setError('We were unable to establish a sync channel');
            return;
          }

          addCryptographyLog(`Confirming agreement`);
          await confirmKeyAgreement({
            agreement: agreement,
            farcasterApiClient: apiClient,
            keyStore,
            dataStore,
            cancelController: cancelControllerRef.current,
            syncChannelIdentifier: channelId,
            sender: isSyncChannelSender,
          });

          addCryptographyLog(`Receiving mnemonic`);

          // Wait for the mnemonic message
          const message = await pollForLatestSyncChannelMessage({
            cancelControllerRef,
            channelId,
          });

          if (!message) {
            setError('We were unable to sync your devices');
            return;
          }

          addCryptographyLog(
            `Marking latest message as read: ${message.messageHash}`,
          );

          await markSyncChannelMessageRead(
            await transport.generateSetMessageReadParams(
              channelId,
              message.messageHash,
            ),
          );

          addCryptographyLog(`Decrypting mnemonic`);
          // Decrypt the mnemonic message
          const mnemonic = await decryptMnemonic({
            channelId,
            message,
            transport: transport!,
          });

          addCryptographyLog(`Importing wallet`);
          importWalletFromMnemonic({
            mnemonic: mnemonic,
            onSuccess: ({ username }) => {
              trackEvent(AnalyticsEvent.AuthCompletedSignInFromMobileToMobile, {
                usernameFromWallet: username || AnalyticsEventUsernameFallback,
              });
            },
            onExternalUserNeedsOnboarding: () => {
              // An external FID (created outside Warpcast) just had a free signer
              // minted and is now authenticated but not yet onboarded. Route into
              // the existing onboarding flow to finish setup.
              push('Onboarding', { error: undefined });
            },
            onExternalUserSignerFailed: () => {
              setError(
                "We couldn't finish setting up your account. Please try again.",
              );
            },
            onUserDoesNotExist: () => {
              // We should never reach this code path
              setError(
                'You need to finish setting up your account before you can sign in on another device',
              );
              trackError(new UserDoesNotExistQRCodeSignInError({}));
            },
          });
        } catch (error) {
          setError('We were unable to create the sync channel');
        }
      }, [
        channelId,
        keyStore,
        dataStore,
        cancelControllerRef,
        apiClient,
        addCryptographyLog,
        pollForLatestSyncChannelMessage,
        markSyncChannelMessageRead,
        decryptMnemonic,
        importWalletFromMnemonic,
        push,
        trackEvent,
      ]);

      useEffect(() => {
        createSyncChannelAndUploadMnemonic();
      }, [createSyncChannelAndUploadMnemonic]);

      // Handle missing params
      if (!hasRequiredParams) {
        return (
          <View style={[t.hFull, t.p4, t.justifyCenter, t.itemsCenter]}>
            <Text style={[t.texts.primary, t.textCenter]}>
              We couldn't synchronize the devices.{'\n'}Please try scanning
              again.
            </Text>
          </View>
        );
      }

      // Handle error
      if (error) {
        return (
          <View style={[t.hFull, t.p4, t.justifyBetween]}>
            <View style={[t.flexGrow, t.justifyCenter]}>
              <Text style={[t.texts.primary, t.textBase, t.textCenter]}>
                {error}
              </Text>
            </View>
            <Button
              title="Retry"
              onPress={() => {
                createSyncChannelAndUploadMnemonic();
              }}
            />
          </View>
        );
      }

      return (
        <View style={[t.hFull, t.p4, t.justifyBetween, t.itemsCenter]}>
          <View style={[t.justifyCenter, t.itemsCenter, t.flexGrow]}>
            <View>
              <Text style={[t.texts.primary, t.textBase, t.textCenter, t.mB2]}>
                Connecting to device...
              </Text>
              <LoadingIndicator />
            </View>
          </View>
          <Button
            title="Cancel"
            variant="muted"
            fullWidth
            style={[t.mB2]}
            onPress={() => {
              pop();
            }}
          />
        </View>
      );
    },
  );

OnboardingSignInWithDesktopInitiateScreen.displayName =
  'OnboardingSignInWithDesktopInitiateScreen';

export { OnboardingSignInWithDesktopInitiateScreen };
