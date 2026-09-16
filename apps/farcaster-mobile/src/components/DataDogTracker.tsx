import { DdSdkReactNative } from '@datadog/mobile-react-native';
import { useCachedOnboardingState } from 'farcaster-client-hooks';
import React, { memo, PropsWithChildren, useEffect } from 'react';

import { useGlobalGate } from '~/contexts/GlobalGateProvider';
import { useWallet } from '~/contexts/WalletProvider';

const DataDogTracker = memo(({ children }: PropsWithChildren) => {
  const { address } = useWallet();
  const {
    result: { state },
  } = useCachedOnboardingState();
  const { gates } = useGlobalGate();

  const fid = state.user?.fid;
  const username = state.user?.username;
  const displayName = state.user?.displayName;
  const email = state.hasConfirmedEmail ? state.email : undefined;

  useEffect(() => {
    if (typeof fid === 'undefined' || fid === 0) {
      DdSdkReactNative.clearUserInfo();
      return;
    }

    DdSdkReactNative.setUserInfo({
      id: String(fid),
      name: username,
      email,
      extraInfo: {
        address,
        fid,
        displayName,
        featureGates: Array.from(gates()),
      },
    });
  }, [address, fid, username, displayName, email, gates]);

  return <>{children}</>;
});

DataDogTracker.displayName = 'DataDogTracker';

const UnauthedDataDogTracker = memo(({ children }: PropsWithChildren) => {
  const { address } = useWallet();
  const {
    result: { state: onboarding },
  } = useCachedOnboardingState();

  // Gate email on hasConfirmedEmail to avoid leaking typo'd or unverified
  // emails to Datadog as user.email for users mid-signup.
  const email = onboarding.hasConfirmedEmail ? onboarding.email : undefined;

  useEffect(() => {
    // Clear when there's no onboarding identity to set. Covers the
    // logout path: AuthedInitializers unmounts (carrying SDK user state),
    // UnauthedInitializers mounts, this effect fires with neither
    // address nor onboarding.id, and we drop the previous user so
    // post-logout RUM events aren't attributed to the signed-out user.
    if (address && onboarding.id) {
      DdSdkReactNative.setUserInfo({
        id: onboarding.id,
        email,
        extraInfo: {
          address,
        },
      });
    } else {
      DdSdkReactNative.clearUserInfo();
    }
  }, [address, email, onboarding.id]);

  return <>{children}</>;
});

UnauthedDataDogTracker.displayName = 'UnauthedDataDogTracker';

export { DataDogTracker, UnauthedDataDogTracker };
