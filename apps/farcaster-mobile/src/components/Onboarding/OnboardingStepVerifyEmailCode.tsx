// import * as Clipboard from 'expo-clipboard';
import * as AppIntegrity from '@expo/app-integrity';
import * as Application from 'expo-application';
import { Platform } from 'expo-modules-core';
import { AnalyticsEvent } from 'farcaster-analytics';
import { AppError, getFirstApiErrorBody } from 'farcaster-client-data';
import {
  useSetOnboardingState,
  useVerifyEmailWithCode,
} from 'farcaster-client-hooks';
import { Typography } from 'farcaster-expo';
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { sha256, stringToBytes } from 'viem';

import { AnalyticsOnlyEvent } from '~/constants/AnalyticsOnlyEvents';
import { GOOGLE_CLOUD_PROJECT_NUMBER } from '~/constants/GooglePlay';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import * as DeviceCheck from '~/modules';
import { trackError } from '~/utils/ErrorUtils';

import { Onboarding, trackOnboardingError } from './Onboarding';
import { OnboardingPortal } from './OnboardingPortal';
import {
  determineCurrentStepFromOnboardingState,
  useOnboardingSteps,
} from './StepsProvider';
import { useResolveRecoveryNeedsSecuring } from './useSecureRecovery';

function OnboardingStepVerifyEmail() {
  const t = useTheme();

  const { trackEvent } = useAnalytics();

  const [inputError, setInputError] = React.useState<string | undefined>();

  const [error, setError] = React.useState<string | undefined>();

  const { account } = useWallet();

  const setOnboardingState = useSetOnboardingState();
  const verifyEmailWithCode = useVerifyEmailWithCode();
  const resolveRecoveryNeedsSecuring = useResolveRecoveryNeedsSecuring();

  const [emailCode, setEmailCode] = React.useState<string | undefined>();

  const [loading, setLoading] = React.useState(false);

  const [{ onboardingEmail, twitterVerificationsDisabled }, dispatch] =
    useOnboardingSteps();

  const onBackPress = React.useCallback(() => {
    trackEvent(AnalyticsEvent.PressBackOnboardingEmailCode, {});

    dispatch({ type: 'SetStep', step: 'Email', direction: 'backwards' });
  }, [dispatch, trackEvent]);

  const disabled = !emailCode || emailCode.length !== 6;

  useEffect(() => {
    if (Platform.OS === 'android') {
      void (async () => {
        try {
          // @see https://developer.android.com/google/play/integrity/standard#prepare-integrity
          await AppIntegrity.prepareIntegrityTokenProviderAsync(
            GOOGLE_CLOUD_PROJECT_NUMBER,
          );
        } catch (err) {
          trackError(
            new AppError('Failed to prepareIntegrityTokenProvider', {
              location: 'OnboardingStepVerifyEmail',
              name: 'PrepareIntegrityTokenProviderError',
              cause: err as Error,
            }),
          );
        }
      })();
    }
  }, []);

  const onContinuePress = React.useCallback(async () => {
    if (disabled) {
      return;
    }

    trackEvent(AnalyticsEvent.PressNextOnboardingEmailCode, {});

    try {
      setLoading(true);

      const deviceCheck = await (async () => {
        try {
          if (Platform.OS === 'ios' && DeviceCheck.isSupported) {
            const token = await DeviceCheck.generateToken();
            return {
              platform: 'ios' as const,
              token,
            };
          }
        } catch {
          trackError(
            new AppError('Failed to generate iOS DeviceCheck', {
              location: 'OnboardingStepVerifyEmail',
              name: 'DeviceCheckError',
            }),
          );
        }
      })();

      const integrityCheck = await (async () => {
        try {
          if (Platform.OS === 'android' && AppIntegrity.isSupported) {
            const applicationId = Application.getAndroidId();
            const hash = sha256(stringToBytes(`${emailCode}:${applicationId}`));
            const token = await AppIntegrity.requestIntegrityCheckAsync(hash);

            return {
              platform: 'android' as const,
              token,
              id: applicationId,
            };
          }
        } catch {
          trackError(
            new AppError('Failed to generate AppIntegrity token', {
              location: 'OnboardingStepVerifyEmail',
              name: 'AppIntegrityError',
            }),
          );
        }
      })();

      const onboardingState = await verifyEmailWithCode({
        account: account!,
        params: {
          code: emailCode,
          deviceCheck,
          integrityCheck,
        },
      });

      setOnboardingState(onboardingState);

      if (!onboardingState.result.state.needsRegistrationPayment) {
        trackEvent(AnalyticsEvent.SkipRegistrationPayment, {});
        // Defer to the canonical step logic instead of hard-coding the next
        // step. External users (FIDs registered outside Warpcast) often already
        // have an fname and/or a profile; ChooseUsername always tries to
        // register a NEW fname, so those users must skip it. With payment
        // already skipped and email confirmed, this resolves to
        // ChooseUsername / SecureRecovery / Passkeys / SetupProfile as needed.
        const recoveryNeedsSecuring = await resolveRecoveryNeedsSecuring({
          hasFid: onboardingState.result.state.hasFid,
        });
        dispatch({
          type: 'SetStep',
          step: determineCurrentStepFromOnboardingState({
            onboardingState: onboardingState.result.state,
            twitterVerificationsDisabled,
            recoveryNeedsSecuring,
          }),
          direction: 'forwards',
        });
      } else if (twitterVerificationsDisabled) {
        dispatch({
          type: 'SetStep',
          step: 'PayWithIAP',
          direction: 'forwards',
        });
      } else {
        dispatch({
          type: 'SetStep',
          step: 'VerifyWithX',
          direction: 'forwards',
        });
      }
    } catch (error) {
      const apiError = getFirstApiErrorBody(error);
      if (apiError) {
        if (apiError.reason === 'invalid_verification_code') {
          trackEvent(AnalyticsOnlyEvent.OnboardingEmailVerificationError, {
            error_reason: 'invalid_verification_code',
            error_message: apiError.message,
          });
          setInputError('Code does not match our records. Please try again.');
          return;
        }

        if (apiError.reason === 'max_verification_attempt_1d') {
          trackEvent(AnalyticsOnlyEvent.OnboardingEmailVerificationError, {
            error_reason: 'max_verification_attempt_1d',
            error_message: apiError.message,
          });
          setInputError(
            'You have reached maximum number of verification tries for the next 24 hours.',
          );
          return;
        }
      }

      trackEvent(AnalyticsOnlyEvent.OnboardingEmailVerificationError, {
        error_reason: 'unknown',
        error_message: String(error).slice(0, 500),
      });
      trackOnboardingError(error, 'verifyEmailCode');
      setError('Verification failed. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [
    disabled,
    trackEvent,
    verifyEmailWithCode,
    account,
    emailCode,
    setOnboardingState,
    twitterVerificationsDisabled,
    dispatch,
    resolveRecoveryNeedsSecuring,
  ]);

  const onChangeText = React.useCallback((text: string) => {
    setEmailCode(text.trim());
    setInputError(undefined);
  }, []);

  // const [clipboardHasCode, setClipboardHasCode] = React.useState(false);

  // React.useEffect(() => {
  //   const checkClipboard = async () => {
  //     const hasContent = await Clipboard.hasStringAsync();
  //     if (hasContent) {
  //       const content = await Clipboard.getStringAsync();
  //       if (/^\d{6}$/.test(content)) {
  //         setClipboardHasCode(true);
  //       }
  //     }
  //   };
  //   checkClipboard();
  // }, []);

  // const onPastePress = React.useCallback(async () => {
  //   const content = await Clipboard.getStringAsync();
  //   if (/^\d{6}$/.test(content)) {
  //     setEmailCode(content);
  //   }
  // }, []);

  const triggerContinue = useRef(false);
  useEffect(() => {
    if (emailCode && emailCode.length === 6) {
      if (!triggerContinue.current) {
        triggerContinue.current = true;
        onContinuePress();
      }
    } else {
      triggerContinue.current = false;
    }
  }, [emailCode, onContinuePress]);

  return (
    <Onboarding.Layout onBackPress={onBackPress} onSkipPress={undefined}>
      <Onboarding.Title>Enter verification code</Onboarding.Title>
      <View style={[t.flex, t.flexCol, { marginTop: 12, gap: 12 }]}>
        {typeof inputError !== 'undefined' && (
          <Onboarding.InputErrorText>{inputError}</Onboarding.InputErrorText>
        )}
        <Onboarding.CodeInput onChangeText={onChangeText} />
        <View style={[t.wFull, t.gap2]}>
          <Onboarding.Text>Enter the 6-digit code we sent to</Onboarding.Text>
          <Typography label="Medium/S" color="primary">
            {onboardingEmail}
          </Typography>
        </View>
      </View>
      <OnboardingPortal.Portal>
        {typeof error !== 'undefined' && (
          <Onboarding.Alert>{error}</Onboarding.Alert>
        )}
        <Onboarding.Button
          onPress={onContinuePress}
          disabled={disabled}
          loading={loading}
        >
          Continue
        </Onboarding.Button>
      </OnboardingPortal.Portal>
    </Onboarding.Layout>
  );
}

export { OnboardingStepVerifyEmail };
