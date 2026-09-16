import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  getNotionLinkTarget,
  useRefreshOnboardingState,
} from 'farcaster-client-hooks';
import {
  completePasskeyRegistration,
  deleteStoredPasskey,
  getStoredPasskeys,
  initiatePasskeyRegistration,
  isPasskeyCancellation,
  isPasskeyNotSupported,
} from 'farcaster-cryptography';
import { AtomsButton } from 'farcaster-expo';
import React, { useEffect, useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Link } from '~/components/Link';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useFarcasterCryptographyKeyStore } from '~/contexts/FarcasterCryptographyKeyStoreProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { usePop } from '~/hooks/navigation/usePop';
import { CommonStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import { setSecureItem } from '~/utils/SecureStorageUtils';

type PasskeysBackupExistingUserScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'PasskeysBackupExistingUser'
>;
export const passkeysLearnMoreUrl = getNotionLinkTarget({ to: 'passkeys' });

function PasskeysBackupExistingUserStartScreen() {
  const t = useTheme();
  const { address, account } = useWallet();
  const pop = usePop();
  const { trackEvent } = useAnalytics();
  const route =
    useRoute<RouteProp<CommonStackParamList, 'PasskeysBackupExistingUser'>>();
  const migrateCredentialId = route.params?.migrateCredentialId;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { keyStore } = useFarcasterCryptographyKeyStore();
  const [isRegistered, setIsRegistered] = useState<boolean>();
  const [failedOut, setFailedOut] = useState(false);
  const [notSupported, setNotSupported] = useState(false);

  const learnMore = () => {
    Linking.openURL(passkeysLearnMoreUrl);
  };

  const refreshOnboardingState = useRefreshOnboardingState();

  const dismiss = async () => {
    if (!migrateCredentialId) {
      setSecureItem({ key: 'user-dismissed-passkeys', value: true });
    }
    trackEvent(AnalyticsEvent.PasskeysEnrollPromptDismissed, {});
    pop();
  };

  useEffect(() => {
    getStoredPasskeys({ keyStore })
      .then((passkeys) => {
        setIsRegistered(
          passkeys.filter((k) => k.address === address).length > 0,
        );
      })
      .catch(trackError);
  }, [address, keyStore]);

  const migrateRecoveryData = async () => {
    if (!account?.mnemonic || !migrateCredentialId) {
      setFailedOut(true);
      return;
    }
    setFailedOut(false);
    setIsSubmitting(true);
    try {
      await completePasskeyRegistration({
        keyStore,
        credentialId: migrateCredentialId,
        mnemonic: account.mnemonic,
      });
      setIsSubmitting(false);
      pop();
    } catch (e) {
      if (isPasskeyCancellation(e)) {
        setIsSubmitting(false);
        return;
      }
      trackError(e instanceof Error ? e : new Error(String(e)));
      if (isPasskeyNotSupported(e)) {
        setNotSupported(true);
      }
      setFailedOut(true);
      setIsSubmitting(false);
    }
  };

  const backup = async () => {
    setFailedOut(false);
    setNotSupported(false);
    setIsSubmitting(true);
    const nextOnboardingState = await refreshOnboardingState();

    try {
      trackEvent(AnalyticsEvent.PasskeysEnrollInitiated, {});
      const displayName = nextOnboardingState.result.state.user!.displayName;
      const isDefaultName =
        displayName ===
        '!' + nextOnboardingState.result.state.user!.fid.toString();
      const credentialId = await initiatePasskeyRegistration({
        keyStore,
        address: address!,
        username: nextOnboardingState.result.state.user!.username!,
        displayName: isDefaultName ? null! : displayName,
        fid: nextOnboardingState.result.state.user!.fid,
        pfpUrl: nextOnboardingState.result.state.user!.pfp?.url || '',
      });
      await completePasskeyRegistration({
        keyStore,
        credentialId,
        mnemonic: account!.mnemonic,
      });

      // Remove stale passkey entries for this FID that belong to a PREVIOUS
      // custody address — e.g. left over after account recovery, which moves the
      // FID to a new custody and enrolls a fresh passkey here. These otherwise
      // display as duplicate passkeys for the same account. Use the RAW keystore
      // list (not the address-de-duplicated `getStoredPasskeys` wrapper) so we
      // delete EVERY stale entry when the old custody has more than one.
      // Scope: same FID AND a different address than the current custody — so
      // valid passkeys for this account on other devices (same custody address)
      // and passkeys for other accounts (different FID) are never touched.
      // Best-effort: a successful enrollment must not be blocked by cleanup.
      try {
        const fid = nextOnboardingState.result.state.user!.fid;
        const currentAddress = address!.toLowerCase();
        const storedPasskeys = await keyStore.getStoredPasskeys();
        for (const passkey of storedPasskeys) {
          if (
            passkey.fid === fid &&
            passkey.address.toLowerCase() !== currentAddress
          ) {
            await deleteStoredPasskey({
              keyStore,
              credentialId: passkey.credentialId,
            });
          }
        }
      } catch (e) {
        trackError(e instanceof Error ? e : new Error(String(e)));
      }

      setIsSubmitting(false);
      trackEvent(AnalyticsEvent.PasskeysEnrollCompleted, {});
      pop();
    } catch (e) {
      if (isPasskeyCancellation(e)) {
        setIsSubmitting(false);
        return;
      }
      if (isPasskeyNotSupported(e)) {
        setNotSupported(true);
      }
      setFailedOut(true);
      trackEvent(AnalyticsEvent.PasskeysEnrollRejected, {});
      setIsSubmitting(false);
    }
  };
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <View style={[t.hFull, t.pX4, t.pB8, { paddingBottom: bottomInset }]}>
      <View style={[t.flexGrow, t.justifyAround]}>
        <View style={[t.flexGrow, t.pY2, t.pX12, t.flexGrow0]}>
          <View style={[t.flexRow, t.textCenter, t.pT4, t.justifyCenter]}>
            <View style={[t.relative]}>
              <View style={[t.bgFaintOld, t.p6, t.roundedFull]}>
                <Ionicons style={[t.texts.primary]} name="key" size={36} />
              </View>
              <View
                style={[
                  t.bgDefaultDark,
                  t.p2,
                  t.roundedFull,
                  { right: -6, bottom: -6 },
                  t.absolute,
                ]}
              >
                <Ionicons name="cloud" color={'#007AFF'} size={16} />
              </View>
            </View>
          </View>
          <View style={[t.flexRow, t.textCenter, t.pT5]}>
            <Text
              style={[
                t.text2xl,
                t.fontSemibold,
                t.textCenter,
                t.texts.primary,
                t.flexGrow,
              ]}
            >
              {migrateCredentialId ? 'Update Passkey' : 'Secure with Passkey'}
            </Text>
          </View>
          <View style={[t.flexRow, t.pT4]}>
            {!failedOut ? (
              <Text style={[t.texts.secondary, t.textCenter, t.flexGrow]}>
                {migrateCredentialId
                  ? 'Your passkey needs a quick update to enable sign-in recovery.'
                  : !isRegistered
                    ? 'Encrypt your account with a passkey and never lose access to it again.'
                    : 'Your recovery phrase has been backed up.'}
              </Text>
            ) : (
              <Text style={[t.texts.danger, t.textCenter, t.flexGrow]}>
                {Platform.OS === 'android'
                  ? notSupported
                    ? 'Passkey backup is not supported on this device.'
                    : 'Something went wrong. Please try again.'
                  : 'Something went wrong. Please verify iCloud Keychain is enabled and the Passwords application is selected as your default password manager.'}
              </Text>
            )}
          </View>
          <View style={[t.justifyCenter, t.flexRow, t.pT4]}>
            <Link size={'sm'} onPress={learnMore} title="Learn More" />
          </View>
        </View>
      </View>
      {migrateCredentialId ? (
        <View style={[t.gap1]}>
          <AtomsButton
            disabled={isSubmitting}
            onPress={migrateRecoveryData}
            size="l"
            hierarchy="primary"
          >
            Update
          </AtomsButton>
          <AtomsButton onPress={dismiss} size="l" hierarchy="overlay">
            Later
          </AtomsButton>
        </View>
      ) : !isRegistered ? (
        <View style={[t.gap1]}>
          <AtomsButton
            disabled={isSubmitting}
            onPress={backup}
            size="l"
            hierarchy="primary"
          >
            Continue
          </AtomsButton>
          <AtomsButton onPress={dismiss} size="l" hierarchy="overlay">
            Don't ask me again
          </AtomsButton>
        </View>
      ) : null}
    </View>
  );
}

export const PasskeysBackupExistingUserScreen =
  buildScreen<PasskeysBackupExistingUserScreenProps>(
    {
      name: 'PasskeysBackupExistingUser',
    },
    PasskeysBackupExistingUserStartScreen,
  );
