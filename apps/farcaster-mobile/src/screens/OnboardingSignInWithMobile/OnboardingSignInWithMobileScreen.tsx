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
import { AtomsButton } from 'farcaster-expo';
import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { OrderedListItem } from '~/components/OrderedListItem';
import { buildScreen } from '~/components/Screen';
import { SignInQRCode } from '~/components/SignInQRCode';
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
import { usePush } from '~/hooks/navigation/usePush';
import { useCancelOnUnmountRef } from '~/hooks/useCancelOnUnmountRef';
import { useOnboardingScreen } from '~/hooks/useOnboardingScreen';
import {
  SignInWithMobileError,
  SyncChannelType,
  UnauthedStackParamList,
  UserDoesNotExistQRCodeSignInError,
} from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import { logErrorInDevOnly } from '~/utils/LogUtils';
import { AnalyticsEventUsernameFallback } from '~/utils/UserUtils';
import { createUUID } from '~/utils/UUIDUtils';

type OnboardingSignInWithMobileScreenProps = NativeStackScreenProps<
  UnauthedStackParamList,
  'OnboardingSignInWithMobile'
>;

const syncChannelType: SyncChannelType = 'sendDirectCastsAsReceiver';
const isSyncChannelSender = false;

const title = 'Log in with mobile';

const OnboardingSignInWithMobileScreen =
  buildScreen<OnboardingSignInWithMobileScreenProps>(
    { name: 'OnboardingSignInWithMobile' },
    () => {
      const { setChannelId } = useSyncChannel();
      const [hasCreatedNewSyncChannel, setHasCreatedNewSyncChannel] =
        useState(false);

      useEffect(() => {
        setChannelId(syncChannelType, createUUID());
        setHasCreatedNewSyncChannel(true);
      }, [setChannelId]);

      if (!hasCreatedNewSyncChannel) {
        return (
          <FullScreenLoadingIndicator debugName="OnboardingSignInWithMobileScreen" />
        );
      }

      return <OnboardingSignInWithMobileWithNewSyncChannel />;
    },
  );

OnboardingSignInWithMobileScreen.displayName =
  'OnboardingSignInWithMobileScreen';

const OnboardingSignInWithMobileWithNewSyncChannel: FC = memo(() => {
  const t = useTheme();
  const { trackEvent } = useAnalytics();
  const { keyStore } = useFarcasterCryptographyKeyStore();
  const { dataStore } = useFarcasterAsyncDataStore();
  const { apiClient } = useFarcasterApiClient();
  const cancelControllerRef = useCancelOnUnmountRef();

  const markSyncChannelMessageRead = useMarkSyncChannelMessageRead();
  const pollForLatestSyncChannelMessage = usePollForLatestSyncChannelMessage();
  const decryptMnemonic = useDecryptMnemonic();
  const importWalletFromMnemonic = useImportWalletFromMnemonic();
  const push = usePush();

  const { addCryptographyLog } = useDebugCryptography();

  useOnboardingScreen({ title, noBackWarning: true });

  const { getChannelId } = useSyncChannel();

  const channelId = getChannelId(syncChannelType);

  const [error, setError] = useState<string>();

  const createChannelAndPollForMnemonic = useCallback(async () => {
    try {
      setError(undefined);

      const transport = await getKeyTransport({ dataStore, keyStore });
      await transport.resetKeyTransport();

      addCryptographyLog(
        `Creating sync channel from OnboardingSignInWithMobile: ${JSON.stringify(
          {
            isSyncChannelSender,
            channelId,
          },
        )}`,
      );

      const agreement = await createSyncChannel({
        cancelController: cancelControllerRef.current,
        farcasterApiClient: apiClient,
        keyStore,
        dataStore,
        sender: isSyncChannelSender,
        syncChannelIdentifier: channelId,
      });

      addCryptographyLog(`Received agreement: ${JSON.stringify(agreement)}`);

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

      addCryptographyLog(`Polling for latest message: ${channelId}`);

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
      logErrorInDevOnly(error);
      trackError(new SignInWithMobileError({ error }));
      setError('We were unable to establish a sync channel');
    }
  }, [
    addCryptographyLog,
    apiClient,
    cancelControllerRef,
    channelId,
    dataStore,
    decryptMnemonic,
    importWalletFromMnemonic,
    keyStore,
    markSyncChannelMessageRead,
    pollForLatestSyncChannelMessage,
    push,
    trackEvent,
  ]);

  useEffect(() => {
    createChannelAndPollForMnemonic();
  }, [createChannelAndPollForMnemonic]);

  if (error) {
    return (
      <View style={[t.hFull, t.p4, t.justifyBetween]}>
        <View style={[t.flexGrow, t.justifyCenter]}>
          <Text style={[t.texts.primary, t.textBase, t.textCenter]}>
            {error}
          </Text>
        </View>
        <AtomsButton
          onPress={createChannelAndPollForMnemonic}
          size="l"
          hierarchy="primary"
        >
          Retry
        </AtomsButton>
      </View>
    );
  }

  return (
    <ScrollView style={[t.hFull, t.p4]}>
      <SignInQRCode channelId={channelId} />

      <View style={[t.mT10]}>
        <OrderedListItem
          index={0}
          text="Open the Camera app on your other device"
        />
        <OrderedListItem index={1} text="Scan the QR code above" />
      </View>
    </ScrollView>
  );
});

export { OnboardingSignInWithMobileScreen };
