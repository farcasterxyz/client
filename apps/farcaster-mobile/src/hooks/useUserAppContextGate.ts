import { nativeApplicationVersion, nativeBuildVersion } from 'expo-application';
import { useClientConfig } from 'farcaster-client-hooks';
import { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';

import { useUserAppContext } from '~/contexts/UserAppContextProvider';

type FeatureName =
  | 'wallet-intents'
  | 'mini-apps'
  | 'in-app-browser-wallet'
  | 'collectibles'
  | 'referrals'
  | 'ota-updates'
  | 'create-channels'
  | 'passkeys'
  | 'warps'
  | 'pro-upsells'
  | 'wallet-upsells'
  | 'profile-tokens'
  | 'full-settings'
  | 'trade-ideas'
  | 'onboarding-trading'
  | 'wallet-onramp'
  | 'wallet-links';

function useUserAppContextGate() {
  const { data } = useClientConfig();

  const { appContextId } = useUserAppContext();

  const allGatesClosed = useMemo(() => {
    return Platform.select({
      android:
        typeof data.result.android.appReviewAppVersion !== 'undefined' &&
        typeof data.result.android.appReviewBuildVersion !== 'undefined' &&
        data.result.android.appReviewAppVersion === nativeApplicationVersion &&
        data.result.android.appReviewBuildVersion === nativeBuildVersion,
      default:
        typeof data.result.ios.appReviewAppVersion !== 'undefined' &&
        typeof data.result.ios.appReviewBuildVersion !== 'undefined' &&
        data.result.ios.appReviewAppVersion === nativeApplicationVersion &&
        data.result.ios.appReviewBuildVersion === nativeBuildVersion,
    });
  }, [
    data.result.android.appReviewAppVersion,
    data.result.android.appReviewBuildVersion,
    data.result.ios.appReviewAppVersion,
    data.result.ios.appReviewBuildVersion,
  ]);

  const checkUserAppContextGate = useCallback(
    (_: FeatureName): { value: boolean } => {
      // Review-mode hiding is a property of the build + server config, not
      // the user. Check it before the appContextId fallback so the gate stays
      // closed during pre-login / user-context-loading windows.
      if (allGatesClosed) {
        return { value: false };
      }

      if (typeof appContextId === 'undefined') {
        return { value: true };
      }

      switch (appContextId) {
        case 'a4014b2f-a935-4b8a-81da-363b6f47d183':
          return { value: false };
        // Wallet balance app context values
        case 'f45e9d29-c5d8-4551-b407-5ffb1bc1b6aa':
        case '3b6dbf3a-ab5d-45fe-baa9-8c63233037b0':
        default:
          return { value: true };
      }
    },
    [allGatesClosed, appContextId],
  );

  return { checkUserAppContextGate };
}

export { useUserAppContextGate };
