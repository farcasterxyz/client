import { AnalyticsEvent } from 'farcaster-analytics';
import { getFirstApiErrorBody } from 'farcaster-client-data';
import {
  OnboardingCreateAccountError,
  useCachedOnboardingState,
  useRegisterFid,
  useTelemetry,
} from 'farcaster-client-hooks';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from 'react-native-toast-notifications';

import { RUM_ACTIONS } from '~/components/Onboarding/Onboarding';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { usePollForRegistrationComplete } from '~/hooks/data/usePollForRegistrationComplete';
import { UnauthedStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';

// These are rotated on a timer
const registeringStatusMessages = [
  'Creating account...',
  'Creating account...',
  'Creating account...',
  'Almost done...',
];

export function useOnboardingRegisterFid({
  routeName,
  onSuccessCallback,
  onErrorCallback,
  inviteCode,
}: {
  routeName: keyof UnauthedStackParamList;
  onSuccessCallback: () => Promise<void>;
  onErrorCallback?: (error: unknown) => Promise<void>;
  inviteCode?: string;
}) {
  const { trackEvent } = useAnalytics();
  const toast = useToast();

  const onboardingState = useCachedOnboardingState();
  const { needsRegistrationPayment, email } = onboardingState.result.state;

  const { account } = useWallet();
  const registerFid = useRegisterFid();
  const pollForRegistrationComplete = usePollForRegistrationComplete();
  const { addAction } = useTelemetry();

  const loadingMessageIndexRef = useRef(0);

  const [registerButtonTitle, setRegisterButtonTitle] = useState('Continue');
  const [registering, setRegistering] = useState(false);

  const messageChangeTimeout = useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);

  const rotateButtonTitle = useCallback(() => {
    if (loadingMessageIndexRef.current < registeringStatusMessages.length - 1) {
      loadingMessageIndexRef.current += 1;
      setRegisterButtonTitle(
        registeringStatusMessages[loadingMessageIndexRef.current],
      );
      messageChangeTimeout.current = setTimeout(rotateButtonTitle, 5000);
    } else {
      messageChangeTimeout.current = undefined;
    }
  }, []);

  useEffect(() => {
    // Clear timer on unmount
    return () => {
      if (messageChangeTimeout.current) {
        clearTimeout(messageChangeTimeout.current);
      }
    };
  }, []);

  const startFidRegistration = useCallback(async () => {
    if (registering) {
      return;
    }

    const start = Date.now();
    addAction(RUM_ACTIONS.submitRegisterFid);

    setRegistering(true);
    loadingMessageIndexRef.current = 0;
    setRegisterButtonTitle(registeringStatusMessages[0]);
    messageChangeTimeout.current = setTimeout(rotateButtonTitle, 5000);

    try {
      try {
        // The spinner used to be a separate step so keeping the event
        trackEvent(AnalyticsEvent.ShowOnboardingStep, {
          title: 'Creating account...',
          mobile: true,
          version: 2,
        });

        trackEvent(AnalyticsEvent.BroadcastRegisterTx, undefined);
        await registerFid({
          recoveryAddress: undefined,
          account: account!,
          inviteCode,
        });
        trackEvent(AnalyticsEvent.ConfirmRegisterTx, undefined);
      } catch (error) {
        if (
          routeName === 'Onboarding' &&
          typeof onErrorCallback !== 'undefined'
        ) {
          // Awaited so `finally` below doesn't reset `registering` to false
          // (re-arming the auto-start effect) until the caller's own async
          // recovery — e.g. refresh + step navigation — has finished.
          await onErrorCallback(error);

          return;
        }

        const apiError = getFirstApiErrorBody(error);
        if (apiError?.reason === 'fid_already_registered') {
          // continue
        } else {
          throw error;
        }
      }

      await pollForRegistrationComplete({
        email,
        fid: undefined,
      });

      addAction(RUM_ACTIONS.fidRegistered, {
        timing: Date.now() - start,
      });

      await onSuccessCallback();
    } catch (error) {
      setRegistering(false);
      if (messageChangeTimeout.current) {
        clearTimeout(messageChangeTimeout.current);
      }

      trackEvent(AnalyticsEvent.FailRegisterTx, { email });

      setRegisterButtonTitle('Try again');

      trackError(error);
      trackError(
        new OnboardingCreateAccountError({
          fid: undefined,
          email,
          error,
        }),
      );
      toast.show('There was a problem creating your account', {
        type: 'danger',
      });
    } finally {
      setRegistering(false);
    }
  }, [
    registering,
    addAction,
    rotateButtonTitle,
    pollForRegistrationComplete,
    email,
    routeName,
    onSuccessCallback,
    trackEvent,
    registerFid,
    account,
    onErrorCallback,
    toast,
    inviteCode,
  ]);

  return useMemo(
    () => ({
      needsRegistrationPayment,
      email,
      startFidRegistration,
      registerButtonTitle,
      registering,
    }),
    [
      email,
      needsRegistrationPayment,
      startFidRegistration,
      registerButtonTitle,
      registering,
    ],
  );
}
