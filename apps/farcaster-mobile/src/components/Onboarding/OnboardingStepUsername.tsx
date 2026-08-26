import { Image } from 'expo-image';
import { AnalyticsEvent } from 'farcaster-analytics';
import { getFirstApiErrorBody } from 'farcaster-client-data';
import {
  useCompleteRegistration,
  useFetchIsFnameAvailable,
  useTelemetry,
} from 'farcaster-client-hooks';
import { useHaptics } from 'farcaster-expo';
import React, { useEffect, useMemo } from 'react';
import { Platform, View } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';

import { AnalyticsOnlyEvent } from '~/constants/AnalyticsOnlyEvents';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { useOnboardingRegisterFid } from '~/hooks/useOnboardingRegisterFid';
import { isUsernameValid } from '~/utils/RegistrationUtils';

import { Onboarding, RUM_ACTIONS, trackOnboardingError } from './Onboarding';
import { OnboardingPortal } from './OnboardingPortal';
import { OnboardingStepRegisteringLoading } from './OnboardingStepRegistering';
import { useOnboardingStateForOnboarding } from './StateProvider';
import {
  determineCurrentStepFromOnboardingState,
  useOnboardingSteps,
} from './StepsProvider';
import { useResolveRecoveryNeedsSecuring } from './useSecureRecovery';

// This has to be the same set as the Setup Profile step of onboarding so we have it properly fetched
const defaultAvatars = [
  'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/95e044eb-c3e1-47ca-ae1a-6cfce9f2ce00/original',
  'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/5a2717bd-8a5e-4596-12ba-67e920d4f600/original',
  'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/13cd6c7b-8fd2-4768-48ca-e32ac3620100/original',
  'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/5567fc3e-c6a7-4b6d-b410-a5c46554ab00/original',
  'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/be8deecf-57c0-45e4-0124-f4f136e1a700/original',
  'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/924d8eed-3ab3-42b8-4e17-a7450a8b4800/original',
];

Image.prefetch(defaultAvatars, {
  cachePolicy: 'memory-disk',
});

/**
 * This component assumes that the user is in a state where they can submit
 * a registration.
 */
function OnboardingStepUsername() {
  const t = useTheme();
  const { triggerImpactAsync, triggerSuccessNotificationAsync } = useHaptics();
  const { trackEvent } = useAnalytics();
  const { startAction, stopAction, addAction } = useTelemetry();
  const { fullRefresh, refresh, onboardingState } =
    useOnboardingStateForOnboarding();
  const completeRegistration = useCompleteRegistration();

  const { account } = useWallet();
  const [state, dispatch] = useOnboardingSteps();
  const resolveRecoveryNeedsSecuring = useResolveRecoveryNeedsSecuring();

  const [submittedPreFid, setSubmittedPreFid] = React.useState<boolean>(false);
  const [processing, setProcessing] = React.useState<boolean>(false);
  const [username, setUsername] = React.useState<string>('');
  const [error, setError] = React.useState<string | undefined>();

  // Set once registration is initiated ON this step (FID registration or a
  // username submission). Keeps the "already has fname" auto-skip below from
  // firing for a user who GAINS an fname by registering here — that user is
  // routed forward by doCompleteRegistration instead.
  const registrationInitiatedRef = React.useRef(false);

  const onSuccess = React.useCallback(async () => {
    await refresh();
    addAction(RUM_ACTIONS.registeringCompleted);
  }, [addAction, refresh]);

  const onError = React.useCallback(
    async (error: unknown) => {
      const apiError = getFirstApiErrorBody(error);
      if (apiError?.reason === 'fid_already_registered') {
        onSuccess();
        return;
      }

      if (apiError?.reason === 'invalid_invite_code') {
        addAction(RUM_ACTIONS.registeringError, { error });
        trackEvent(AnalyticsOnlyEvent.OnboardingRegistrationError, {
          error_reason: apiError.reason,
          error_message: apiError.message ?? String(error).slice(0, 500),
        });
        // Not calling trackOnboardingError here — invalid_invite_code is expected user
        // behavior (bad code entered), not a crash. The trackEvent above is sufficient.
        setSubmittedPreFid(false);

        // Route back to invite code screen with error shown so the user understands why.
        dispatch({ type: 'SetInviteCode', inviteCode: undefined });
        dispatch({
          type: 'SetRegistrationError',
          error: 'invalid_invite_code',
        });
        dispatch({
          type: 'SetStep',
          step: 'UseInviteCode',
          direction: 'backwards',
        });
        return;
      }

      if (apiError?.reason === 'registration_payment_required') {
        // Free-path budget (sponsor-all cap, etc.) was exhausted between the
        // onboarding-state peek and this registration attempt. The peek said
        // free; the backend now says pay. Route to the payment step instead
        // of leaving the user on a dead-end error with no way to proceed.
        addAction(RUM_ACTIONS.registeringError, { error });
        trackEvent(AnalyticsOnlyEvent.OnboardingRegistrationError, {
          error_reason: apiError.reason,
          error_message: apiError.message ?? String(error).slice(0, 500),
        });
        setSubmittedPreFid(false);
        await refresh();
        dispatch({
          type: 'SetStep',
          step: state.twitterVerificationsDisabled
            ? 'PayWithIAP'
            : 'VerifyWithX',
          direction: 'forwards',
        });
        return;
      }

      // Registration failed for an unknown reason. These errors should be
      // closely monitored. Let the user try submitting again in case the
      // error was intermittent.
      addAction(RUM_ACTIONS.registeringError, { error });
      trackEvent(AnalyticsOnlyEvent.OnboardingRegistrationError, {
        error_reason: getFirstApiErrorBody(error)?.reason ?? 'unknown',
        error_message:
          getFirstApiErrorBody(error)?.message ?? String(error).slice(0, 500),
      });
      trackOnboardingError(error, 'register_fid');
      setSubmittedPreFid(false);
      setError('An unknown error occurred, please try again.');
    },
    [
      addAction,
      dispatch,
      onSuccess,
      trackEvent,
      refresh,
      state.twitterVerificationsDisabled,
    ],
  );

  const { startFidRegistration } = useOnboardingRegisterFid({
    routeName: 'Onboarding',
    onSuccessCallback: onSuccess,
    onErrorCallback: onError,
    inviteCode: state.inviteCode,
  });

  // Ensure an FID is being registered
  useEffect(() => {
    if (!onboardingState.hasFid) {
      registrationInitiatedRef.current = true;
      startFidRegistration();
    }
  }, [startFidRegistration, onboardingState.hasFid]);

  // Defensive: an account that ALREADY has an fname must never be shown the
  // username picker — submitting would attempt to register a SECOND fname.
  // Normal/external onboarders reach this step precisely because they have no
  // fname yet (guarded by `!hasFname` below), and a user who registers an fname
  // HERE is routed forward by doCompleteRegistration instead (guarded by
  // registrationInitiatedRef). So this only ever fires for the edge where an
  // external FID that already owns an fname is routed here (e.g. hasFname briefly
  // stale at the routing decision) — advancing once to the canonical next step.
  const skippedForExistingFnameRef = React.useRef(false);
  useEffect(() => {
    if (
      skippedForExistingFnameRef.current ||
      registrationInitiatedRef.current ||
      !onboardingState.hasFname
    ) {
      return;
    }
    skippedForExistingFnameRef.current = true;
    void (async () => {
      const recoveryNeedsSecuring = await resolveRecoveryNeedsSecuring({
        hasFid: onboardingState.hasFid,
      });
      dispatch({
        type: 'SetStep',
        step: determineCurrentStepFromOnboardingState({
          onboardingState,
          twitterVerificationsDisabled: state.twitterVerificationsDisabled,
          recoveryNeedsSecuring,
        }),
        direction: 'forwards',
      });
    })();
  }, [
    onboardingState,
    resolveRecoveryNeedsSecuring,
    dispatch,
    state.twitterVerificationsDisabled,
  ]);

  const onChangeText = React.useCallback(
    (text: string) => {
      setUsername(text.toLowerCase());
    },
    [setUsername],
  );

  const trimmedUsername = username.trim();
  const fetchIsFnameAvailable = useFetchIsFnameAvailable();
  const checkAvailabilityTimeoutRef =
    React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const [usernameAvailability, setUsernameAvailability] = React.useState<
    Record<string, boolean | undefined>
  >({});

  React.useEffect(() => {
    if (
      trimmedUsername &&
      usernameAvailability[trimmedUsername] === undefined
    ) {
      if (checkAvailabilityTimeoutRef.current) {
        clearTimeout(checkAvailabilityTimeoutRef.current);
      }

      checkAvailabilityTimeoutRef.current = setTimeout(async () => {
        const { isAvailable } = await fetchIsFnameAvailable({
          fname: trimmedUsername,
        });

        setUsernameAvailability((prevAvailability) => ({
          ...prevAvailability,
          [trimmedUsername]: isAvailable,
        }));
      }, 300);
    }
  }, [fetchIsFnameAvailable, trimmedUsername, usernameAvailability]);

  const doCompleteRegistration = React.useCallback(async () => {
    if (processing) {
      return;
    }

    // Backstop for the "already has fname" auto-skip: if that skip has started,
    // never attempt a (duplicate) fname registration — even if Continue was
    // pressed during the skip effect's async window. The skip effect and this
    // guard are mutually exclusive via registrationInitiatedRef, so this only
    // fires when the skip won the race.
    if (skippedForExistingFnameRef.current) {
      return;
    }

    // Registration is being initiated here, so the auto-skip effect must not
    // also route this user (doCompleteRegistration handles their forward step).
    registrationInitiatedRef.current = true;

    try {
      setProcessing(true);
      const res = await fetch(`https://fnames.farcaster.xyz/current-time`);

      let timestamp;
      const clientTimestamp = Math.floor(Date.now() / 1000);
      if (res.ok) {
        timestamp = (await res.json()).currentTime;
      } else {
        timestamp = clientTimestamp;
      }

      if (Math.abs(timestamp - clientTimestamp) > 5 * 60 * 1000) {
        trackEvent(AnalyticsEvent.ClientTimestampSkew, {
          clientTimestamp,
          timestamp,
        });
      }

      await completeRegistration({
        account: account!,
        data: {
          username: trimmedUsername,
          timestamp,
        },
      });

      const refreshed = await fullRefresh();

      if (Platform.OS === 'ios') {
        triggerSuccessNotificationAsync();
      } else {
        triggerImpactAsync();
      }

      // Route via the canonical step logic using the freshly refreshed state
      // (the closure `onboardingState` is stale here). This handles external
      // FIDs that need SecureRecovery as well as hasSetupProfile deciding
      // Passkeys vs SetupProfile.
      //
      // Force hasFname=true: completeRegistration above just succeeded, so this
      // account definitively has an fname now. If `fullRefresh` returns a state
      // where hasFname is still false (backend read-after-write lag right after
      // registration), determineCurrentStep would send the user BACK to
      // ChooseUsername — the step they just finished. Overriding it keeps the
      // forward progression the old hard-coded 'Passkeys' transition guaranteed,
      // while still using the fresh state for the SecureRecovery / Passkeys /
      // SetupProfile decision.
      const refreshedState = {
        ...refreshed.result.state,
        hasFname: true,
      };
      const recoveryNeedsSecuring = await resolveRecoveryNeedsSecuring({
        hasFid: refreshedState.hasFid,
      });
      dispatch({
        type: 'SetStep',
        step: determineCurrentStepFromOnboardingState({
          onboardingState: refreshedState,
          twitterVerificationsDisabled: state.twitterVerificationsDisabled,
          recoveryNeedsSecuring,
        }),
        direction: 'forwards',
      });

      stopAction(RUM_ACTIONS.registering, undefined);
    } catch (error) {
      const apiError = getFirstApiErrorBody(error);

      // It's possible the fname was claimed by another user since we last
      // checked for availability.
      if (apiError?.reason === 'fname_unavailable') {
        setUsernameAvailability((prevAvailability) => ({
          ...prevAvailability,
          [trimmedUsername]: false,
        }));

        return;
      }

      trackEvent(AnalyticsOnlyEvent.OnboardingRegistrationError, {
        error_reason: getFirstApiErrorBody(error)?.reason ?? 'unknown',
        error_message:
          getFirstApiErrorBody(error)?.message ?? String(error).slice(0, 500),
      });
      trackOnboardingError(error, 'username');
      setError('An unknown error occurred, please try again.');
    } finally {
      setProcessing(false);
      setSubmittedPreFid(false);
    }
  }, [
    account,
    completeRegistration,
    dispatch,
    fullRefresh,
    processing,
    resolveRecoveryNeedsSecuring,
    state.twitterVerificationsDisabled,
    stopAction,
    trackEvent,
    triggerImpactAsync,
    triggerSuccessNotificationAsync,
    trimmedUsername,
  ]);

  const canCompleteRegistration =
    onboardingState.hasFid && onboardingState.hasDelegatedSigner;

  const submittedStartRef = React.useRef<number | undefined>(undefined);
  const onContinuePress = React.useCallback(async () => {
    if (canCompleteRegistration) {
      startAction(RUM_ACTIONS.registering, {
        can_complete_registration: canCompleteRegistration,
      });
      await doCompleteRegistration();

      // record perceived registration time as zero since we aren't showing the
      // register screen at all in this case
      addAction('onboarding:perceived_onchain_registration', {
        timing: 0,
      });
    } else {
      submittedStartRef.current = Date.now();
      setSubmittedPreFid(true);
    }
  }, [addAction, canCompleteRegistration, doCompleteRegistration, startAction]);

  useEffect(() => {
    (async () => {
      if (submittedPreFid && canCompleteRegistration) {
        await doCompleteRegistration();
        if (submittedStartRef.current) {
          addAction('onboarding:perceived_onchain_registration', {
            timing: Date.now() - submittedStartRef.current,
          });
        }
      } else if (submittedPreFid && !canCompleteRegistration) {
        // TODO: Handle this case, or call it when setting submittedPreFid
      }
    })();
  }, [
    addAction,
    canCompleteRegistration,
    doCompleteRegistration,
    processing,
    submittedPreFid,
  ]);

  const isAvailable = usernameAvailability[trimmedUsername];
  const isValid = useMemo(
    () => isUsernameValid(trimmedUsername),
    [trimmedUsername],
  );

  // Also disable Continue when the account already has an fname: such a user
  // must never submit a second fname registration. This closes the race the
  // async auto-skip effect can't (the UI stays interactive during its await) —
  // render state is always fresh, so the button is disabled the moment hasFname
  // is true. Normal onboarders have hasFname=false here, so this is inert.
  const isContinueDisabled =
    !trimmedUsername || !isAvailable || !isValid || onboardingState.hasFname;

  const availabilityStatus = React.useMemo(() => {
    if (!trimmedUsername) {
      return null;
    }

    if (trimmedUsername.length > 16) {
      return (
        <Onboarding.InputErrorText>
          Username must be less than 16 characters.
        </Onboarding.InputErrorText>
      );
    }

    if (!isValid) {
      return (
        <Onboarding.InputErrorText>
          Username may only include lowercase letters, numbers and hyphens (-),
          and should not start with a hyphen
        </Onboarding.InputErrorText>
      );
    }

    if (isAvailable === undefined) {
      return null;
    }

    if (!isAvailable) {
      return (
        <Onboarding.InputErrorText>Not available</Onboarding.InputErrorText>
      );
    }

    if (isAvailable) {
      return (
        <Onboarding.InputSuccessText>Available</Onboarding.InputSuccessText>
      );
    }

    return null;
  }, [isAvailable, isValid, trimmedUsername]);

  const animationValue = useSharedValue(0);

  useEffect(() => {
    if (availabilityStatus) {
      animationValue.value = withTiming(1, { duration: 250 });
    } else {
      animationValue.value = withTiming(0, { duration: 250 });
    }
  }, [availabilityStatus, animationValue]);

  if (submittedPreFid) {
    return <OnboardingStepRegisteringLoading />;
  }

  return (
    <Onboarding.Layout onBackPress={undefined} onSkipPress={undefined}>
      <Onboarding.Title>Choose username</Onboarding.Title>
      <Onboarding.Text>People can find you by your @username</Onboarding.Text>
      <View style={[t.flex, t.flexCol, t.gap4, t.mT2]}>
        <Onboarding.Input
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={'twitter'}
          autoFocus={true}
          placeholder="@satoshi"
          onChangeText={onChangeText}
          maxLength={16}
          value={username}
          color={isAvailable === false ? 'danger' : 'primary'}
        />
      </View>
      {availabilityStatus}
      <OnboardingPortal.Portal>
        {typeof error !== 'undefined' && (
          <Onboarding.Alert>{error}</Onboarding.Alert>
        )}
        <Onboarding.Button
          onPress={onContinuePress}
          loading={processing}
          disabled={isContinueDisabled}
        >
          Continue
        </Onboarding.Button>
      </OnboardingPortal.Portal>
    </Onboarding.Layout>
  );
}

export { OnboardingStepUsername };
