import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiGetOnboardingState200Response,
  DEFAULT_TIMEOUT_ONBOARDING_STATE,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { EventV2Props } from '../../../../providers/EventingProvider';
import { MergeIntoGloballyCachedUser } from '../../../../types';

type TrackEvent = (event: AnalyticsEvent, props?: EventV2Props) => void;

const buildOnboardingStateFetcher =
  ({
    apiClient,
    Authorization,
    mergeIntoGloballyCachedUser,
    trackEvent,
  }: {
    apiClient: FarcasterApiClient;
    mergeIntoGloballyCachedUser: MergeIntoGloballyCachedUser;
    Authorization?: string;
    trackEvent?: TrackEvent;
  }) =>
  async (): Promise<ApiGetOnboardingState200Response> => {
    const response = await apiClient.getOnboardingState({
      headers: { Authorization: Authorization || '' },
      timeout: DEFAULT_TIMEOUT_ONBOARDING_STATE,
    });
    const state = response.data.result.state;
    const user = state.user;
    if (user) {
      mergeIntoGloballyCachedUser({ updates: user });
    }

    if (trackEvent) {
      trackEvent(AnalyticsEvent.OnboardingStateLoaded, {
        fid: user?.fid,
        hasFid: state.hasFid,
        hasDelegatedSigner: state.hasDelegatedSigner,
        hasCompletedRegistration: state.hasCompletedRegistration,
        hasOnboarding: state.hasOnboarding,
        hasStorage: state.hasStorage,
        hasSetupProfile: state.hasSetupProfile,
        hasConfirmedEmail: state.hasConfirmedEmail,
      });

      if (state.hasFid && !state.hasDelegatedSigner && state.hasStorage) {
        trackEvent(AnalyticsEvent.OnboardingStuckMissingDelegateSigner, {
          fid: user?.fid,
          hasOnboarding: state.hasOnboarding,
          hasConfirmedEmail: state.hasConfirmedEmail,
          hasCompletedRegistration: state.hasCompletedRegistration,
          hasFname: state.hasFname,
          hasSetupProfile: state.hasSetupProfile,
          hasWarpcastWalletAddress: state.hasWarpcastWalletAddress,
        });
      }
    }

    return response.data;
  };

export { buildOnboardingStateFetcher };
