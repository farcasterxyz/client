import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildUserUsernamesFetcher } from './buildUserUsernamesFetcher';
import { buildUserUsernamesKey } from './buildUserUsernamesKey';

const useUserUsernames = () => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildUserUsernamesKey(),
    queryFn: buildUserUsernamesFetcher({ apiClient }),
  });
};

export { useUserUsernames };
