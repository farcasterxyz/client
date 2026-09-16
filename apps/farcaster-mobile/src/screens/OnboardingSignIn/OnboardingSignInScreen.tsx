import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  authenticatePasskey,
  isPasskeyCancellation,
  isPasskeyNoCredential,
  isPasskeysSupported,
} from 'farcaster-cryptography';
import { KeyRoundIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import { BookKeyIcon } from '~/components/images/BookKeyIcon';
import { MailIcon } from '~/components/images/MailIcon';
import { PhoneIcon } from '~/components/images/PhoneIcon';
import { buildScreen } from '~/components/Screen';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useFarcasterCryptographyKeyStore } from '~/contexts/FarcasterCryptographyKeyStoreProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useImportWalletFromMnemonic } from '~/hooks/data/useImportWalletFromMnemonic';
import { usePush } from '~/hooks/navigation/usePush';
import { useOnboardingScreen } from '~/hooks/useOnboardingScreen';
import { MenuItem } from '~/screens/Debug/MenuItem';
import { UnauthedStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import { AnalyticsEventUsernameFallback } from '~/utils/UserUtils';

type OnboardingSignInScreenProps = NativeStackScreenProps<
  UnauthedStackParamList,
  'OnboardingSignIn'
>;

const title = 'Log in';

const OnboardingSignInScreen = buildScreen<OnboardingSignInScreenProps>(
  { name: 'OnboardingSignIn' },
  () => {
    const t = useTheme();
    const push = usePush();
    const { trackEvent } = useAnalytics();
    const { keyStore } = useFarcasterCryptographyKeyStore();
    const importWalletFromMnemonic = useImportWalletFromMnemonic();
    const [passkeysSupported, setPasskeysSupported] = useState(false);

    useOnboardingScreen({ title, noBackWarning: true });

    useEffect(() => {
      isPasskeysSupported({ keyStore })
        .then(setPasskeysSupported)
        .catch(trackError);
    }, [keyStore]);

    const onPasskeyDiscovery = useCallback(async () => {
      try {
        const { mnemonic, credentialId, domain } = await authenticatePasskey({
          keyStore,
        });

        trackEvent(AnalyticsEvent.AuthClickLogInWithPasskeys, undefined);

        const normalizedMnemonic = mnemonic.trim().toLowerCase();
        await importWalletFromMnemonic({
          mnemonic: normalizedMnemonic,
          passkeyDiscovery: { credentialId, domain },
          onSuccess: ({ username }) => {
            trackEvent(AnalyticsEvent.AuthCompletedSignInWithPasskeys, {
              usernameFromWallet: username || AnalyticsEventUsernameFallback,
            });
          },
          onExternalUserNeedsOnboarding: () => {
            push('Onboarding', { error: undefined });
          },
          onExternalUserSignerFailed: () => {
            Alert.alert(
              'Sign in failed',
              "We couldn't finish setting up your account. Please try again.",
              [{ text: 'OK', style: 'default' }],
            );
          },
          onUserDoesNotExist: () => {
            Alert.alert(
              'No account found',
              'Use your recovery phrase to sign into this account',
              [{ text: 'Ok', isPreferred: true, style: 'default' }],
            );
          },
        });
      } catch (error) {
        if (isPasskeyCancellation(error)) {
          return;
        }

        if (isPasskeyNoCredential(error)) {
          Alert.alert(
            'No passkey found',
            'No passkey is available on this device. Please try another sign-in method.',
            [{ text: 'OK', style: 'default' }],
          );
          return;
        }

        trackError(error);

        if (
          error instanceof Error &&
          (error.message === 'Passkey did not return recovery data' ||
            error.message === 'LargeBlobMissing')
        ) {
          Alert.alert(
            'Sign in failed',
            "This passkey doesn't have recovery data. Please use a different sign in method.",
            [{ text: 'OK', style: 'default' }],
          );
          return;
        }

        Alert.alert(
          'Sign in failed',
          'Unable to sign in with this passkey. Please try again or use your recovery phrase.',
          [{ text: 'OK', style: 'default' }],
        );
      }
    }, [importWalletFromMnemonic, keyStore, push, trackEvent]);

    return (
      <View style={[t.hFull, t.itemsCenter, t.pX4]}>
        {passkeysSupported ? (
          <MenuItem
            name="Sign in with passkey"
            icon={<KeyRoundIcon color={t.colors.text.primary} size={18} />}
            slimPadding={true}
            isFirst
            useSeparators={false}
            onPress={onPasskeyDiscovery}
          />
        ) : null}
        <MenuItem
          name="Pair with another device"
          icon={<PhoneIcon color={t.colors.text.primary} size={18} />}
          slimPadding={true}
          isFirst={!passkeysSupported}
          useSeparators={false}
          onPress={async () => {
            trackEvent(AnalyticsEvent.AuthClickLogInOptionMobile, undefined);
            push('OnboardingSignInWithMobile', {});
          }}
        />
        <MenuItem
          name="Use recovery phrase"
          icon={<BookKeyIcon color={t.colors.text.primary} size={18} />}
          slimPadding={true}
          useSeparators={false}
          onPress={() => {
            trackEvent(AnalyticsEvent.AuthClickLogInOptionMnemonic, undefined);
            push('OnboardingImportWallet', {});
          }}
        />
        <MenuItem
          name="Recover account via email"
          icon={<MailIcon color={t.colors.text.primary} size={16} />}
          slimPadding={true}
          isLast
          useSeparators={false}
          onPress={() => {
            trackEvent(AnalyticsEvent.ClickLostRecoveryPhrase, undefined);
            push('RecoveryInitiate', {});
          }}
        />
      </View>
    );
  },
);

OnboardingSignInScreen.displayName = 'OnboardingSignInScreen';

export { OnboardingSignInScreen };
