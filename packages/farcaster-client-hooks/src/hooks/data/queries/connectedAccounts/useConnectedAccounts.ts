import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildConnectedAccountsFetcher } from './buildConnectedAccountsFetcher';
import { buildConnectedAccountsKey } from './buildConnectedAccountsKey';

const useConnectedAccounts = () => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildConnectedAccountsKey(),
    queryFn: buildConnectedAccountsFetcher({ apiClient }),
    getNextPageParam: getNextPageCursor,
  });
};

export { useConnectedAccounts };
