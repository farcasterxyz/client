import {
  ApiGetOnboardingState200Response,
  ApiGetOnboardingStateAndAuthToken200Response,
  ApiOnboardingState,
} from 'farcaster-client-data';
import {
  useFallbackOnboardingState,
  useOnboardingStateWithoutFallback,
  useRefreshOnboardingState,
  useRefreshOnboardingStateBeforeUserHasFid,
} from 'farcaster-client-hooks';
import React, { createContext, FC, memo, ReactNode, useContext } from 'react';

import { useAuthToken } from '~/contexts/AuthTokenProvider';
import { useWallet } from '~/contexts/WalletProvider';

type OnboardingStateContext = {
  onboardingState: ApiOnboardingState;
  refresh: () => Promise<ApiGetOnboardingStateAndAuthToken200Response>;
  fullRefresh: () => Promise<ApiGetOnboardingState200Response>;
};

const OnboardingStateContext = createContext<OnboardingStateContext>(
  {} as never,
);

type OnboardingStateProviderProps = {
  children: ReactNode;
};

const OnboardingStateProvider: FC<OnboardingStateProviderProps> = memo(
  ({ children }) => {
    const [initialized, setInitialized] = React.useState<boolean>(false);

    const { account } = useWallet();
    const { setAuthToken } = useAuthToken();

    const defaultOnboardingState = useFallbackOnboardingState();
    const { data } = useOnboardingStateWithoutFallback({
      query: {
        enabled: false,
        initialData: defaultOnboardingState,
      },
    });
    const onboardingState = (data ?? defaultOnboardingState).result.state;

    const refreshOnboardingState = useRefreshOnboardingStateBeforeUserHasFid();
    const fullRefresh = useRefreshOnboardingState();

    // Highest auth-token expiry this provider has adopted. refresh() is called
    // concurrently (OnboardingStepVerifyingX polls it via setInterval without
    // awaiting prior calls) and responses can resolve out of order; gating
    // adoption on a strictly-increasing expiry ensures a slower, older refresh
    // can never overwrite a newer minted token and leave the device back on a
    // superseded session. All tokens share a fixed TTL, so a larger expiresAt
    // means a newer mint.
    const latestAdoptedTokenExpiresAtRef = React.useRef(0);

    const refresh = React.useCallback(async () => {
      const refreshedState = await refreshOnboardingState({
        account: account!,
      });

      // Adopt the freshly-minted token on THIS device.
      // refreshOnboardingStateBeforeUserHasFid mints a new auth token, and the
      // backend's one-token-per-device dedup soft-revokes this device's
      // PREVIOUS token (same fid + FC-DEVICE-ID) as part of that mint. This
      // refresh runs on mount and is polled by onboarding steps (e.g.
      // OnboardingStepVerifyingX), so without adopting, AuthTokenProvider's
      // active token is left superseded and the user is involuntarily signed
      // out ~10 min later (SUPERSEDED_TOKEN_GRACE_MS) mid-onboarding — even
      // while just browsing. Mirrors the mint + setAuthToken pattern in
      // usePollForRegistrationComplete. Only adopt a strictly-newer token (see
      // ref above) so overlapping refreshes can't regress to an older one.
      const token = refreshedState.result.token;
      if (token && token.expiresAt > latestAdoptedTokenExpiresAtRef.current) {
        latestAdoptedTokenExpiresAtRef.current = token.expiresAt;
        await setAuthToken({ authToken: token });
      }

      setInitialized(true);

      return refreshedState;
    }, [refreshOnboardingState, account, setAuthToken]);

    // Let's always refresh on mount so we have the latest reference to the cached
    // onboarding state.
    React.useEffect(() => {
      refresh();
    }, [refresh]);

    if (!initialized) {
      return <></>;
    }

    return (
      <OnboardingStateContext.Provider
        value={{ onboardingState, refresh, fullRefresh }}
      >
        {children}
      </OnboardingStateContext.Provider>
    );
  },
);

OnboardingStateProvider.displayName = 'OnboardingStateProvider';

const useOnboardingStateForOnboarding = () =>
  useContext(OnboardingStateContext);

export { OnboardingStateProvider, useOnboardingStateForOnboarding };
