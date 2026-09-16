import { useQuery } from '@tanstack/react-query';
import { ApiOnboardingState } from 'farcaster-client-data';
import {
  buildRecoveryAddressFetcher,
  buildRecoveryAddressKey,
  useClientConfig,
  useFarcasterApiClient,
} from 'farcaster-client-hooks';
import React from 'react';
import { Platform } from 'react-native';

import { OnboardingParams } from '~/types';

import { useOnboardingStateForOnboarding } from './StateProvider';
import { recoveryNeedsSecuring } from './useSecureRecovery';

type TwitterVerificationError = OnboardingParams['error'] | 'unknown';

type RegistrationError = 'invalid_invite_code' | 'unknown' | undefined;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const steps = [
  'Email',
  'VerifyEmailCode',
  'ChoosePayment',
  'VerifyWithX',
  'VerifyingX',
  'PayWithIAP',
  'UseInviteCode',
  'ChooseUsername',
  'SecureRecovery',
  'Passkeys',
  'SetupProfile',
  'SelectInterests',
] as const;
type Step = (typeof steps)[number];

type Action =
  | {
      type: 'SetStep';
      step: Step;
      direction: 'backwards' | 'forwards';
    }
  | {
      type: 'SetInviteCode';
      inviteCode: string | undefined;
    }
  | {
      type: 'SetTwitterVerifcationError';
      error: TwitterVerificationError;
    }
  | {
      type: 'SetRegistrationError';
      error: RegistrationError;
    }
  | {
      type: 'SetEmail';
      email: string | undefined;
    };

interface State {
  currentStep: Step;
  currentStepDirection: 'backwards' | 'forwards';
  onboardingEmail: string | undefined;
  registrationError: RegistrationError;
  twitterVerificationsDisabled: boolean;
  twitterVerificationError: TwitterVerificationError;
  inviteCode: string | undefined;
}

function reducer(state: State, action: Action): State {
  let updatedState = state;

  switch (action.type) {
    case 'SetStep': {
      if (state.currentStep !== action.step) {
        updatedState = {
          ...state,
          currentStep: action.step,
          currentStepDirection: action.direction,
        };
      }
      break;
    }
    case 'SetTwitterVerifcationError': {
      updatedState = {
        ...state,
        twitterVerificationError: action.error,
      };
      break;
    }
    case 'SetRegistrationError': {
      updatedState = {
        ...state,
        registrationError: action.error,
      };
      break;
    }
    case 'SetInviteCode': {
      updatedState = {
        ...state,
        inviteCode: action.inviteCode,
      };
      break;
    }
    case 'SetEmail': {
      updatedState = {
        ...state,
        onboardingEmail: action.email,
      };
      break;
    }
  }

  return updatedState;
}

export function determineCurrentStepFromOnboardingState({
  onboardingState,
  twitterVerificationsDisabled,
  recoveryNeedsSecuring = false,
}: {
  onboardingState: ApiOnboardingState;
  twitterVerificationsDisabled: boolean;
  // True only when the account has a non-Farcaster recovery address that can be
  // changed (external FIDs registered outside Warpcast). Normal users always
  // have Farcaster's recovery proxy, so this stays false and they never see the
  // SecureRecovery step. Passed in because recovery state lives outside
  // ApiOnboardingState (see useRecoveryAddress).
  recoveryNeedsSecuring?: boolean;
}): Step {
  if (typeof onboardingState.email === 'undefined') {
    return 'Email';
  }

  if (!onboardingState.hasConfirmedEmail) {
    return 'VerifyEmailCode';
  }

  if (!onboardingState.hasFid && onboardingState.needsRegistrationPayment) {
    if (twitterVerificationsDisabled) {
      return 'PayWithIAP';
    }

    if (!onboardingState.twitterProfile) {
      return 'VerifyWithX';
    }

    return 'VerifyingX';
  }

  if (!onboardingState.hasFname) {
    return 'ChooseUsername';
  }

  if (recoveryNeedsSecuring) {
    return 'SecureRecovery';
  }

  if (!onboardingState.hasSetupProfile) {
    return 'Passkeys';
  }

  return 'SetupProfile';
}

type OnboardingStepsProviderContextValue = [State, (action: Action) => void];

const OnboardingStepsProviderContext =
  React.createContext<OnboardingStepsProviderContextValue>([] as never);

type OnboardingStepsProviderProps = React.PropsWithChildren;

export function OnboardingStepsProvider({
  children,
}: OnboardingStepsProviderProps) {
  const { data } = useClientConfig();

  const twitterVerificationsDisabled = React.useMemo(() => {
    return Platform.select({
      ios: data.result.ios.disableXVerifications,
      android: data.result.android.disableXVerifications,
      default: true,
    });
  }, [
    data.result.android.disableXVerifications,
    data.result.ios.disableXVerifications,
  ]);

  const { onboardingState } = useOnboardingStateForOnboarding();

  // Recovery state lives outside ApiOnboardingState, so fetch it here to decide
  // whether the SecureRecovery step applies. Only enabled once the account has
  // an FID (the endpoint requires one); shares its cache with the per-step
  // fetches. External FIDs (non-Farcaster recovery) get needsSecuring=true;
  // normal users get false and never see the step.
  const { apiClient } = useFarcasterApiClient();
  const { data: recoveryData, isFetching: isFetchingRecovery } = useQuery({
    queryKey: buildRecoveryAddressKey(),
    queryFn: buildRecoveryAddressFetcher({ apiClient }),
    enabled: onboardingState.hasFid,
  });
  const needsSecuring = recoveryNeedsSecuring(
    recoveryData?.result.recoveryAddress,
  );

  const initializer = React.useCallback(() => {
    const currentStep = determineCurrentStepFromOnboardingState({
      onboardingState,
      twitterVerificationsDisabled: twitterVerificationsDisabled,
      recoveryNeedsSecuring: needsSecuring,
    });

    return {
      currentStep: currentStep,
      currentStepDirection: 'forwards',
      onboardingEmail: onboardingState.email,
      registrationError: undefined,
      twitterVerificationsDisabled: twitterVerificationsDisabled,
      twitterVerificationError:
        typeof onboardingState.twitterProfile !== 'undefined' &&
        !onboardingState.twitterProfile.fcVerified
          ? 'not_eligible'
          : undefined,
      inviteCode: undefined,
    } satisfies State;
  }, [onboardingState, twitterVerificationsDisabled, needsSecuring]);

  const [state, dispatch] = React.useReducer(reducer, null, initializer);

  // On cold resume the initializer can run before recovery data has loaded, so
  // an external FID may be initialized past the SecureRecovery insertion point
  // (Passkeys/SetupProfile/SelectInterests) and skip it. Once recovery data
  // resolves, redirect into SecureRecovery a single time if the user is sitting
  // on one of those later steps.
  //
  // We must NOT gate this on the step being unchanged since init: the user can
  // advance (e.g. finish passkey enrollment, which routes straight to
  // SetupProfile) before the recovery query resolves, and that must still pull
  // them into SecureRecovery rather than silently skip it.
  //
  // This can't re-prompt after a "Maybe later" skip: showing SecureRecovery at
  // all requires recovery data (the step and the forward-flow routing read the
  // same cache key), so `recoveryData` — and this one-shot guard — always
  // resolve at or before SecureRecovery is first reached, never afterwards on a
  // post-skip Passkeys/SetupProfile step.
  const recoveryResolvedRef = React.useRef(false);
  React.useEffect(() => {
    // Only latch once the recovery query has SETTLED with fresh data — never on
    // a value that is still being refetched. `['recoveryAddress']` is a global
    // cache key (shared across accounts, persisted across cold restarts via the
    // MMKV persister), so on mount useQuery can synchronously hand back stale
    // data from a prior account/session while a background refetch is in flight
    // (staleTime defaults to 0). Latching on that stale value — which may report
    // needsSecuring=false for an account that actually needs securing — would
    // permanently disable this one-shot redirect and let an external FID finish
    // onboarding without securing recovery. `isFetchingRecovery` is false only
    // once the in-flight fetch resolves, so gating on it guarantees the fresh
    // result drives the decision.
    if (recoveryResolvedRef.current || !recoveryData || isFetchingRecovery) {
      return;
    }
    recoveryResolvedRef.current = true;
    if (
      needsSecuring &&
      (state.currentStep === 'Passkeys' ||
        state.currentStep === 'SetupProfile' ||
        state.currentStep === 'SelectInterests')
    ) {
      dispatch({
        type: 'SetStep',
        step: 'SecureRecovery',
        direction: 'forwards',
      });
    }
  }, [recoveryData, isFetchingRecovery, needsSecuring, state.currentStep]);

  return React.useMemo(
    () => (
      <OnboardingStepsProviderContext.Provider value={[state, dispatch]}>
        {children}
      </OnboardingStepsProviderContext.Provider>
    ),
    [children, state],
  );
}

export const useOnboardingSteps = () => {
  return React.useContext(OnboardingStepsProviderContext);
};
