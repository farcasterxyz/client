import { AnalyticsEvent } from 'farcaster-analytics';
import {
  useRegisterUserAuthAddress,
  useUserAuthAddress,
} from 'farcaster-client-hooks';
import React, { FC, memo, ReactNode, useEffect, useState } from 'react';
import { Hex } from 'viem';

import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { trackError } from '~/utils/ErrorUtils';

import { useAnalytics } from './AnalyticsProvider';

export const RegisterAuthAddressProvider: FC<{ children: ReactNode }> = memo(
  ({ children }) => {
    // Avoid competing for network resources on start up, also used to guard
    // against resubmissions
    const [autoEnabled, setAutoEnabled] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => {
        setAutoEnabled(true);
      }, 5000);
      return () => clearTimeout(timer);
    }, []);

    const { trackEvent } = useAnalytics();
    const { account } = useWallet();
    const registerUserAuthAddress = useRegisterUserAuthAddress();
    const { authAddressState } = useUserAppContext();

    // Performance optimization: we only need to enable query if the user's
    // auth address state is unavailable or needed.
    const queryNeeded =
      authAddressState === 'unavailable' || authAddressState === 'needed';

    const { data, isStale } = useUserAuthAddress({
      enabled: queryNeeded && autoEnabled,
      staleTime: 1000 * 60,
      gcTime: 1000 * 60,
    });

    useEffect(() => {
      if (
        autoEnabled &&
        authAddressState === 'needed' &&
        data?.hash &&
        data?.deadline &&
        !isStale
      ) {
        const { hash, deadline } = data;

        // Flip this back to false to ensure this effect doesn't run again
        setAutoEnabled(false);

        (async () => {
          try {
            const signature = await account!.sign({ hash: hash as Hex });
            await registerUserAuthAddress({
              deadline,
              signature,
            });

            trackEvent(AnalyticsEvent.AutoRegisterAuthAddress, {});
          } catch (e) {
            trackError(e);
          }
        })();
      }
    }, [
      account,
      authAddressState,
      autoEnabled,
      data,
      isStale,
      registerUserAuthAddress,
      trackEvent,
    ]);

    return <>{children}</>;
  },
);

RegisterAuthAddressProvider.displayName = 'RegisterAuthAddressProvider';
