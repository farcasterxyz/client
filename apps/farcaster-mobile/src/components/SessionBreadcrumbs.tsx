import { useCachedOnboardingState } from 'farcaster-client-hooks';
import React, { FC, memo, ReactNode, useEffect, useRef } from 'react';

import {
  buildMobileAnalyticsAppMetadata,
  buildMobileAnalyticsPersonProperties,
} from '~/analyticsClient/mobilePersonState';
import { AnalyticsOnlyEvent } from '~/constants/AnalyticsOnlyEvents';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useWallet } from '~/contexts/WalletProvider';

type SessionBreadcrumbsProps = {
  children: ReactNode;
};

const SessionBreadcrumbs: FC<SessionBreadcrumbsProps> = memo(({ children }) => {
  const { address, walletRestoreParams } = useWallet();
  const { identify, reset, setUserProperties, trackEvent } = useAnalytics();
  const {
    result: { state },
  } = useCachedOnboardingState();

  const appMetadata = React.useMemo(
    () => buildMobileAnalyticsAppMetadata(),
    [],
  );
  const stateUser = state.user;
  const fid = stateUser?.fid;
  const username = stateUser?.username;
  const email = state.email;
  const hasConfirmedEmail = state.hasConfirmedEmail;
  const previousFidRef = useRef<number | undefined>(undefined);
  const restoreParamsLoggedForFidRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (fid) {
      // Reset before identifying a new FID so PostHog doesn't alias the
      // previous identified user into the new one (PostHog alias is
      // permanent and merges person profiles).
      if (previousFidRef.current && previousFidRef.current !== fid) {
        reset();
      }
      identify({
        fid,
        username,
      });
      previousFidRef.current = fid;
      return;
    }

    if (previousFidRef.current) {
      reset();
      previousFidRef.current = undefined;
    }
    // Only clear the restore-params dedupe on logout (fid cleared), not when
    // username/identify deps change while still signed in.
    restoreParamsLoggedForFidRef.current = undefined;
  }, [fid, identify, reset, username]);

  useEffect(() => {
    if (
      !fid ||
      !walletRestoreParams ||
      restoreParamsLoggedForFidRef.current === fid
    ) {
      return;
    }

    restoreParamsLoggedForFidRef.current = fid;
    trackEvent(AnalyticsOnlyEvent.WalletRestoreParamsChecked, {
      fid,
      ...walletRestoreParams,
    });
  }, [fid, trackEvent, walletRestoreParams]);

  useEffect(() => {
    setUserProperties(
      buildMobileAnalyticsPersonProperties({
        address,
        appMetadata,
        onboardingState: {
          email,
          hasConfirmedEmail,
          user: stateUser,
        },
      }),
    );
  }, [
    address,
    appMetadata,
    email,
    hasConfirmedEmail,
    setUserProperties,
    stateUser,
  ]);

  return <>{children}</>;
});

SessionBreadcrumbs.displayName = 'SessionBreadcrumbs';

export { SessionBreadcrumbs };
