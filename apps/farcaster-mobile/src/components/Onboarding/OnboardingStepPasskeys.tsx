import { AnalyticsEvent } from 'farcaster-analytics';
import { useTelemetry } from 'farcaster-client-hooks';
import {
  completePasskeyRegistration,
  initiatePasskeyRegistration,
  isPasskeyCancellation,
  isPasskeyNotSupported,
} from 'farcaster-cryptography';
import { Typography } from 'farcaster-expo';
import { KeyRoundIcon, LogInIcon, SquareStackIcon } from 'lucide-react-native';
import React from 'react';
import { Platform, View } from 'react-native';

import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useFarcasterCryptographyKeyStore } from '~/contexts/FarcasterCryptographyKeyStoreProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';

import { Onboarding, RUM_ACTIONS, trackOnboardingError } from './Onboarding';
import { OnboardingPortal } from './OnboardingPortal';
import { useOnboardingStateForOnboarding } from './StateProvider';
import { useOnboardingSteps } from './StepsProvider';

const ICON_SIZE = 24;

const NATIVE_PASSKEY_PROVIDER =
  Platform.OS === 'ios' ? 'Apple Passwords' : 'Google Password Manager';

function DescriptionRow({
  title,
  description,
  Icon,
}: {
  title: string;
  description: string;
  Icon: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View style={[t.flex, t.flexRow, t.itemsStart, t.wFull, t.gap4]}>
      <View>{Icon}</View>
      <View style={[t.flex1, t.flexCol, t.gap2]}>
        <Onboarding.Sub>{title}</Onboarding.Sub>
        <Typography
          numberOfLines={3}
          adjustsFontSizeToFit
          label="Medium/Base"
          color="secondary"
        >
          {description}
        </Typography>
      </View>
    </View>
  );
}

function OnboardingStepPasskeys() {
  const t = useTheme();

  const { addAction } = useTelemetry();
  const { trackEvent } = useAnalytics();

  const [passkeyAttemptFailed, setPasskeyAttemptFailed] =
    React.useState<boolean>(false);
  const [passkeyNotSupported, setPasskeyNotSupported] =
    React.useState<boolean>(false);

  const [, dispatch] = useOnboardingSteps();

  const { keyStore } = useFarcasterCryptographyKeyStore();
  const [processing, setProcessing] = React.useState<boolean>(false);

  const { fullRefresh } = useOnboardingStateForOnboarding();

  const { address, account } = useWallet();

  const startPasskeyFlow = React.useCallback(async () => {
    try {
      setProcessing(true);
      setPasskeyAttemptFailed(false);
      setPasskeyNotSupported(false);

      const {
        result: { state: onboardingState },
      } = await fullRefresh();

      trackEvent(AnalyticsEvent.PasskeysEnrollInitiated, { version: 3 });
      addAction(RUM_ACTIONS.passkeyEnroll);

      const user = onboardingState.user;
      if (!user || !user.username) {
        // External FIDs can reach this step (they skip ChooseUsername when they
        // already have an fname) before their profile/username is reflected in
        // onboarding state. Fail into the retry/skip UI instead of
        // dereferencing a null user and crashing — a retry after indexing, or
        // Skip -> profile setup, recovers.
        throw new Error(
          'Onboarding state is missing user profile for passkey enrollment',
        );
      }

      const displayName = user.displayName;
      const isDefaultName = displayName === '!' + user.fid.toString();

      const credentialId = await initiatePasskeyRegistration({
        keyStore,
        address: address!,
        username: user.username,
        displayName: isDefaultName ? null! : displayName,
        fid: user.fid,
        pfpUrl: user.pfp?.url || '',
      });

      await completePasskeyRegistration({
        keyStore,
        credentialId,
        mnemonic: account!.mnemonic,
      });
      dispatch({
        type: 'SetStep',
        step: 'SetupProfile',
        direction: 'forwards',
      });
      trackEvent(AnalyticsEvent.PasskeysEnrollCompleted, {});
    } catch (e) {
      if (isPasskeyCancellation(e)) {
        addAction(RUM_ACTIONS.passkeyCancelled);
        return;
      }

      setPasskeyAttemptFailed(true);
      trackEvent(AnalyticsEvent.PasskeysEnrollRejected, { version: 3 });

      if (isPasskeyNotSupported(e)) {
        setPasskeyNotSupported(true);
        addAction(RUM_ACTIONS.passkeyOperationNotSupported);
      } else {
        addAction(RUM_ACTIONS.passkeyUnknownError);
        trackOnboardingError(e, 'passkeys');
      }
    } finally {
      setProcessing(false);
    }
  }, [
    addAction,
    address,
    dispatch,
    fullRefresh,
    keyStore,
    trackEvent,
    account,
  ]);

  const onContinuePress = React.useCallback(async () => {
    await startPasskeyFlow();
  }, [startPasskeyFlow]);

  const onSkipPress = React.useCallback(() => {
    trackEvent(AnalyticsEvent.OnboardingSkippedPasskeys, {});
    dispatch({ type: 'SetStep', step: 'SetupProfile', direction: 'forwards' });
  }, [dispatch, trackEvent]);

  return (
    <Onboarding.Layout
      onBackPress={undefined}
      onSkipPress={undefined}
      hideIcons
    >
      <Onboarding.Title>Set up a Passkey</Onboarding.Title>
      <View style={[t.flex, t.flexCol, t.gap6, t.mT3]}>
        <DescriptionRow
          title="Never lose access to your account"
          description="Passkeys are automatically backed up, so you’ll always be able to get back in to your account."
          Icon={<KeyRoundIcon color={t.colors.text.primary} size={ICON_SIZE} />}
        />
        <DescriptionRow
          title="Quickly sign in"
          description="Passkeys use your device’s secure biometric or PIN code without the need for another password."
          Icon={<LogInIcon color={t.colors.text.primary} size={ICON_SIZE} />}
        />
        <DescriptionRow
          title="Works across devices"
          description="Passkeys sync across all of your devices making it easy to sign in."
          Icon={
            <SquareStackIcon color={t.colors.text.primary} size={ICON_SIZE} />
          }
        />
      </View>
      <OnboardingPortal.Portal>
        {!passkeyAttemptFailed && (
          <Onboarding.MutedAlert>
            Not compatible with 1Password. Use {NATIVE_PASSKEY_PROVIDER}
          </Onboarding.MutedAlert>
        )}
        {passkeyAttemptFailed && (
          <Onboarding.Alert>
            {Platform.OS === 'android'
              ? passkeyNotSupported
                ? 'Passkey backup is not supported on this device. You can skip and use your recovery phrase to sign in.'
                : 'Something went wrong. Please try again.'
              : `Passkey failed, try again and select ${NATIVE_PASSKEY_PROVIDER} this time.`}
          </Onboarding.Alert>
        )}
        <Onboarding.Button onPress={onContinuePress} loading={processing}>
          Create Passkey
        </Onboarding.Button>
        <Onboarding.SecondaryButton onPress={onSkipPress}>
          {passkeyAttemptFailed ? 'Skip, and try again later' : 'Skip'}
        </Onboarding.SecondaryButton>
      </OnboardingPortal.Portal>
    </Onboarding.Layout>
  );
}

export { OnboardingStepPasskeys };
