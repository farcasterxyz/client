import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import NetInfo from '@react-native-community/netinfo';
import * as Device from 'expo-device';
import * as Localization from 'expo-localization';
import {
  openBrowserAsync,
  WebBrowserPresentationStyle,
} from 'expo-web-browser';
import { AnalyticsEvent } from 'farcaster-analytics';
import { getFirstApiErrorBody } from 'farcaster-client-data';
import { useCreateOnboarding } from 'farcaster-client-hooks';
import React from 'react';
import { View } from 'react-native';

import { TextWithPress } from '~/components/TextWithPress';
import { AnalyticsOnlyEvent } from '~/constants/AnalyticsOnlyEvents';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { useUnmediatedNavigate } from '~/hooks/navigation/methods/navigate';
import { getStorefront } from '~/modules';
import { isEmailValid } from '~/utils/EmailUtils';

import { Onboarding, trackOnboardingError } from './Onboarding';
import { OnboardingPortal } from './OnboardingPortal';
import { useOnboardingStateForOnboarding } from './StateProvider';
import { useOnboardingSteps } from './StepsProvider';

async function getOnboardingCreateExtrasPayload() {
  const [deviceIsRooted, netInfo, storefront] = await Promise.all([
    Device.isRootedExperimentalAsync(),
    NetInfo.fetch(),
    getStorefront().catch(() => null),
  ]);

  const ipAddress =
    (netInfo.details as { ipAddress: string })?.ipAddress || null;
  const carrier = (netInfo.details as { carrier: string })?.carrier || null;
  const cellularGeneration =
    (netInfo.details as { cellularGeneration: string })?.cellularGeneration ||
    null;

  const network = {
    ipAddress: ipAddress,
    carrier: carrier,
    cellularGeneration: cellularGeneration,
    connectionType: netInfo.type,
    isInternetReachable: netInfo.isInternetReachable,
  };

  const locales = Localization.getLocales().map((l) => ({
    languageTag: l.languageTag,
    regionCode: l.regionCode,
    currencyCode: l.currencyCode,
  }));

  const calendars = Localization.getCalendars().map((c) => ({
    firstWeekday: c.firstWeekday,
    calendar: c.calendar,
  }));

  const payload = {
    device: {
      manufacturer: Device.manufacturer,
      model: Device.modelName,
      os: Device.osName,
      osVersion: Device.osVersion,
      deviceYearClass: Device.deviceYearClass,
      isDevice: Device.isDevice,
      isRooted: deviceIsRooted,
    },
    locales,
    calendars,
    network: network,
    storefront,
  };

  return payload;
}

function OnboardingStepEmail() {
  const t = useTheme();

  const { refresh } = useOnboardingStateForOnboarding();

  const { account } = useWallet();

  const navigate = useUnmediatedNavigate();

  const createOnboarding = useCreateOnboarding();

  const { trackEvent } = useAnalytics();

  const [error, setError] = React.useState<string | undefined>();

  const [inputError, setInputError] = React.useState<string | undefined>();

  const [email, setEmail] = React.useState('');

  const [, dispatch] = useOnboardingSteps();

  const [processing, setProcessing] = React.useState<boolean>(false);

  const validEmail = React.useMemo(() => {
    return isEmailValid(email.trim());
  }, [email]);

  const onBackPress = React.useCallback(() => {
    trackEvent(AnalyticsEvent.PressBackOnboardingEmail, {});
    navigate('Landing', {});
  }, [navigate, trackEvent]);

  const onContinuePress = React.useCallback(async () => {
    trackEvent(AnalyticsEvent.PressNextOnboardingEmail, {});

    if (!email.trim()) {
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    if (!valid) {
      setInputError('Email is not valid.');

      return;
    }

    let extras = undefined;

    setProcessing(true);

    try {
      extras = await getOnboardingCreateExtrasPayload();
    } catch (error) {
      DdRum.addAction(RumActionType.CUSTOM, 'fraud-prevention-payload:error', {
        error,
      });
    }

    try {
      await createOnboarding({
        email: trimmedEmail,
        account: account!,
        extras,
        version: 'v2',
      });

      void refresh();

      dispatch({ type: 'SetEmail', email: trimmedEmail });
      dispatch({
        type: 'SetStep',
        step: 'VerifyEmailCode',
        direction: 'forwards',
      });
    } catch (error) {
      const apiError = getFirstApiErrorBody(error);
      if (apiError) {
        if (apiError.reason === 'not_available') {
          trackEvent(AnalyticsOnlyEvent.OnboardingEmailError, {
            error_reason: 'not_available',
            error_message: apiError.message,
          });
          setInputError(
            'Email verification failed to start. Consider trying a different email.',
          );
          return;
        }
        if (apiError.reason === 'not_available_v2') {
          trackEvent(AnalyticsOnlyEvent.OnboardingEmailError, {
            error_reason: 'not_available_v2',
            error_message: apiError.message,
          });
          setInputError('Another account is using the same email.');
          return;
        }
      }

      trackEvent(AnalyticsOnlyEvent.OnboardingEmailError, {
        error_reason: 'unknown',
        error_message: String(error).slice(0, 500),
      });
      trackOnboardingError(error, 'email');
      setError(
        'Registration is not available at this time. Please try again later.',
      );
    } finally {
      setProcessing(false);
    }
  }, [createOnboarding, dispatch, email, refresh, account, trackEvent]);

  const isContinueButtonDisabled = !validEmail;

  const onChangeText = React.useCallback((text: string) => {
    setEmail(text);
  }, []);

  return (
    <Onboarding.Layout onBackPress={onBackPress} onSkipPress={undefined}>
      <Onboarding.Title>Enter email</Onboarding.Title>
      <Onboarding.Text>
        This email can recover your Farcaster account if you lose access to it.
      </Onboarding.Text>
      <View style={[t.flex, t.flexCol, t.gap4, t.mT2]}>
        <Onboarding.Input
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
          autoFocus={true}
          placeholder="satoshin@gmx.org"
          onChangeText={onChangeText}
          value={email}
        />
      </View>
      {typeof inputError !== 'undefined' && (
        <Onboarding.InputErrorText>{inputError}</Onboarding.InputErrorText>
      )}
      <OnboardingPortal.Portal>
        {typeof error !== 'undefined' && (
          <Onboarding.Alert>{error}</Onboarding.Alert>
        )}
        <Onboarding.ButtonDisclaimer>
          By continuing, you accept our{' '}
          <TextWithPress
            style={[t.texts.brand]}
            onPress={() => {
              openBrowserAsync('https://farcaster.xyz/~/terms-of-use', {
                dismissButtonStyle: 'close',
                readerMode: false,
                presentationStyle: WebBrowserPresentationStyle.POPOVER,
              });
            }}
          >
            Terms
          </TextWithPress>{' '}
          and{' '}
          <TextWithPress
            style={[t.texts.brand]}
            onPress={() => {
              openBrowserAsync('https://farcaster.xyz/~/privacy-policy', {
                dismissButtonStyle: 'close',
                readerMode: false,
                presentationStyle: WebBrowserPresentationStyle.POPOVER,
              });
            }}
          >
            Privacy Policy
          </TextWithPress>
          .
        </Onboarding.ButtonDisclaimer>
        <Onboarding.Button
          onPress={onContinuePress}
          disabled={isContinueButtonDisabled}
          loading={processing}
        >
          Create account
        </Onboarding.Button>
      </OnboardingPortal.Portal>
    </Onboarding.Layout>
  );
}

export { OnboardingStepEmail };
