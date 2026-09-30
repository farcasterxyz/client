import {
  ApiGetOnboardingState200Response,
  ApiOnboardingState,
} from 'farcaster-client-data';
import { useRef } from 'react';

const useFallbackOnboardingState = (): ApiGetOnboardingState200Response => {
  return useRef({
    result: {
      state: {
        address: undefined,
        email: undefined,
        user: undefined,
        hasOnboarding: false,
        needsRegistrationPayment: true,
        hasFid: false,
        hasFname: false,
        hasConfirmedEmail: false,
        hasDelegatedSigner: false,
        hasStorage: false,
        hasCompletedRegistration: false,
        hasSetupProfile: false,
        hasWarpcastWalletAddress: false,
        hasWarpcastSolanaWalletAddress: false,
        geoRestricted: false,
      } satisfies ApiOnboardingState,
    },
  }).current;
};

export { useFallbackOnboardingState };
