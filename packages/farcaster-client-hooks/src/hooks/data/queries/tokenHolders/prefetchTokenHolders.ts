import { QueryClient } from '@tanstack/react-query';
import { FarcasterApiClient } from 'farcaster-client-data';

import {
  buildTokenHoldersFetcher,
  TokenHoldersQueryParams,
} from './buildTokenHoldersFetcher';
import { buildTokenHoldersKey } from './buildTokenHoldersKey';

export const prefetchTokenHolders = (
  queryClient: QueryClient,
  apiClient: FarcasterApiClient,
  { params }: { params: TokenHoldersQueryParams },
) => {
  queryClient.prefetchQuery({
    queryKey: buildTokenHoldersKey(params),
    queryFn: buildTokenHoldersFetcher({
      apiClient,
      params,
    }),
  });
};
