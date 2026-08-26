import { ApiGetOnboardingState200Response } from 'farcaster-client-data';
import {
  OnboardingRefreshOnboardingStateError,
  useRefreshOnboardingStateAndAuthToken,
} from 'farcaster-client-hooks';
import { useCallback } from 'react';

import { useAuthToken } from '~/contexts/AuthTokenProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { logInDevOnly } from '~/utils/LogUtils';

const interval = 500;

const usePollForRegistrationComplete = () => {
  const { account } = useWallet();
  const refreshOnboardingStateAndAuthToken =
    useRefreshOnboardingStateAndAuthToken();

  const { setAuthToken } = useAuthToken();

  return useCallback(
    ({
      email,
      fid,
    }: {
      email: string | undefined;
      fid: number | undefined;
    }) => {
      return new Promise<ApiGetOnboardingState200Response>((resolve) => {
        const scheduleCheckForRegistrationComplete = () => {
          setTimeout(checkForRegistrationComplete, interval);
        };

        const checkForRegistrationComplete = async () => {
          try {
            const nextOnboardingState =
              await refreshOnboardingStateAndAuthToken({ account: account! });

            if (nextOnboardingState.result.token) {
              await setAuthToken({
                authToken: nextOnboardingState.result.token,
              });
            }

            logInDevOnly(nextOnboardingState.result.state);
            // Block here until we process both the FID registration and onchain
            // signer events. These happen simultaneously onchain, but we don't
            // process them atomically.
            if (
              nextOnboardingState.result.state.hasFid &&
              nextOnboardingState.result.state.hasDelegatedSigner
            ) {
              resolve(nextOnboardingState);
            } else {
              scheduleCheckForRegistrationComplete();
            }
          } catch (error) {
            new OnboardingRefreshOnboardingStateError({
              email,
              fid,
              error,
              step: 'register_fid',
            });
            scheduleCheckForRegistrationComplete();
          }
        };

        checkForRegistrationComplete();
      });
    },
    [account, refreshOnboardingStateAndAuthToken, setAuthToken],
  );
};

export { usePollForRegistrationComplete };
