import { useQuery } from '@tanstack/react-query';
import {
  ApiGetOnboardingState200Response,
  FarcasterError,
} from 'farcaster-client-data';

import { useTrackEvent } from '../../../../providers/EventingProvider';
import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useMergeIntoGloballyCachedUser } from '../globallyCachedUser/useMergeIntoGloballyCachedUser';
import { UseQueryParameters } from '../types';
import { buildOnboardingStateFetcher } from './buildOnboardingStateFetcher';
import {
  BuildOnboardingStateKey,
  buildOnboardingStateKey,
} from './buildOnboardingStateKey';
import { onboardingStateDefaultQueryOptions } from './defaultOnboardingStateQueryOptions';

export const useOnboardingStateWithoutFallback = ({
  query,
}: {
  query?: UseQueryParameters<
    ApiGetOnboardingState200Response,
    FarcasterError | Error,
    ApiGetOnboardingState200Response,
    BuildOnboardingStateKey
  >;
} = {}) => {
  const { apiClient } = useFarcasterApiClient();
  const mergeIntoGloballyCachedUser = useMergeIntoGloballyCachedUser();
  const { trackEvent } = useTrackEvent();

  return useQuery({
    queryKey: buildOnboardingStateKey(),
    queryFn: buildOnboardingStateFetcher({
      apiClient,
      mergeIntoGloballyCachedUser,
      trackEvent,
    }),
    ...onboardingStateDefaultQueryOptions,
    ...query,
  });
};
