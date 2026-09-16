import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers';
import { buildSuggestedUsersToFollowFetcher } from './buildSuggestedUsersToFollowFetcher';
import { buildSuggestedUsersToFollowKey } from './buildSuggestedUsersToFollowKey';

const useSuggestedUsersToFollow = (interests?: string[]) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildSuggestedUsersToFollowKey({ interests }),
    queryFn: buildSuggestedUsersToFollowFetcher({ apiClient, interests }),
  });
};

export { useSuggestedUsersToFollow };
