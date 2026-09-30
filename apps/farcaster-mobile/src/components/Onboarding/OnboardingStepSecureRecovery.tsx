import { useQuery } from '@tanstack/react-query';
import { AnalyticsEvent } from 'farcaster-analytics';
import { AppError } from 'farcaster-client-data';
import {
  buildRecoveryAddressFetcher,
  buildRecoveryAddressKey,
  useFarcasterApiClient,
  useUpdateRecoveryAddress,
} from 'farcaster-client-hooks';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { trackError } from '~/utils/ErrorUtils';

import { Onboarding } from './Onboarding';
import { OnboardingPortal } from './OnboardingPortal';
import { useOnboardingStateForOnboarding } from './StateProvider';
import {
  determineCurrentStepFromOnboardingState,
  useOnboardingSteps,
} from './StepsProvider';
import { recoveryNeedsSecuring } from './useSecureRecovery';

/**
 * Optional step shown after ChooseUsername for accounts whose recovery address
 * is not Farcaster's (external FIDs registered outside Warpcast). Offers to move
 * the recovery address to Farcaster's recovery proxy so the user can recover
 * their account if they lose their seed phrase. Self-skips for anyone who
 * doesn't need it (i.e. normal Warpcast users).
 */
function OnboardingStepSecureRecovery() {
  const t = useTheme();
  const { trackEvent } = useAnalytics();
  const toast = useToast();
  const { account } = useWallet();
  const { apiClient } = useFarcasterApiClient();
  const updateRecoveryAddress = useUpdateRecoveryAddress();

  const [state, dispatch] = useOnboardingSteps();
  const { onboardingState } = useOnboardingStateForOnboarding();

  const [processing, setProcessing] = useState(false);

  const { data, isError } = useQuery({
    queryKey: buildRecoveryAddressKey(),
    queryFn: buildRecoveryAddressFetcher({ apiClient }),
  });
  const recovery = data?.result.recoveryAddress;
  const needsSecuring = recoveryNeedsSecuring(recovery);

  const advance = useCallback(() => {
    dispatch({
      type: 'SetStep',
      step: determineCurrentStepFromOnboardingState({
        onboardingState,
        twitterVerificationsDisabled: state.twitterVerificationsDisabled,
        recoveryNeedsSecuring: false,
      }),
      direction: 'forwards',
    });
  }, [dispatch, onboardingState, state.twitterVerificationsDisabled]);

  // Self-skip once we know this account doesn't need the change, OR when we
  // can't determine recovery state (query errored with no cached data). This is
  // an optional step with no back navigation, so never strand the user.
  const advancedRef = useRef(false);
  useEffect(() => {
    if (advancedRef.current) {
      return;
    }
    if ((data && !needsSecuring) || (isError && !data)) {
      advancedRef.current = true;
      advance();
    }
  }, [data, needsSecuring, isError, advance]);

  // Track that the prompt was actually shown (needs securing) — fires once so
  // secure/skip rates can be measured against the impression.
  const viewedRef = useRef(false);
  useEffect(() => {
    if (viewedRef.current || !needsSecuring) {
      return;
    }
    viewedRef.current = true;
    trackEvent(AnalyticsEvent.ViewSecureRecovery, {});
  }, [needsSecuring, trackEvent]);

  const onSecure = useCallback(async () => {
    if (!recovery?.recoveryProxyAddress || !account) {
      // Shouldn't happen once the prompt is shown (recoveryProxyAddress is
      // always returned and the custody account is present during onboarding),
      // but surface feedback rather than leaving the button unresponsive.
      toast.show(
        'Could not update recovery. You can set it later in Settings.',
        {
          type: 'danger',
        },
      );
      return;
    }

    try {
      setProcessing(true);
      trackEvent(AnalyticsEvent.SubmitRecoveryAddressChange, {
        toAddress: recovery.recoveryProxyAddress,
      });

      // Submit the on-chain change (backend broadcasts and pays gas) and
      // continue immediately — it settles in the background.
      await updateRecoveryAddress({
        to: recovery.recoveryProxyAddress,
        account,
      });

      advance();
    } catch (e) {
      trackError(
        new AppError('failed to secure recovery during onboarding', {
          cause: e,
          location: 'OnboardingStepSecureRecovery',
          name: 'SecureRecoveryError',
        }),
      );
      toast.show(
        'Could not update recovery. You can set it later in Settings.',
        {
          type: 'danger',
        },
      );
    } finally {
      setProcessing(false);
    }
  }, [
    recovery?.recoveryProxyAddress,
    account,
    updateRecoveryAddress,
    advance,
    trackEvent,
    toast,
  ]);

  const onSkip = useCallback(() => {
    trackEvent(AnalyticsEvent.SkipSecureRecovery, {});
    advance();
  }, [advance, trackEvent]);

  // While loading, not applicable, or errored, the self-skip effect advances
  // the user — render a spinner (never a blank screen) since this step has no
  // back navigation.
  if (!needsSecuring) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Onboarding.Layout onBackPress={undefined} onSkipPress={undefined}>
      <Onboarding.Title>Secure your account</Onboarding.Title>
      <View style={[t.flex, t.flexCol, { marginTop: 12, gap: 12 }]}>
        <Onboarding.Text>
          Set Farcaster as your account recovery so you can get back in if you
          ever lose your recovery phrase. You can change this anytime in
          Advanced Settings.
        </Onboarding.Text>
      </View>
      <OnboardingPortal.Portal>
        <Onboarding.Button onPress={onSecure} loading={processing}>
          Secure my account
        </Onboarding.Button>
        <Onboarding.SecondaryButton onPress={onSkip} disabled={processing}>
          Maybe later
        </Onboarding.SecondaryButton>
      </OnboardingPortal.Portal>
    </Onboarding.Layout>
  );
}

export { OnboardingStepSecureRecovery };
