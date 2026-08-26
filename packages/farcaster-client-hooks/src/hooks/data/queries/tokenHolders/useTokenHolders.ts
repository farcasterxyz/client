import { useInfiniteQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { selectFlatStandardizedPaginatedResults } from '../../helpers';
import {
  buildTokenHoldersFetcher,
  TokenHoldersQueryParams,
} from './buildTokenHoldersFetcher';
import { buildTokenHoldersKey } from './buildTokenHoldersKey';

const useTokenHolders = ({
  enabled,
  ...params
}: TokenHoldersQueryParams & { enabled?: boolean }) => {
  const { apiClient } = useFarcasterApiClient();
  const { limit = 25 } = params ?? {};

  return useInfiniteQuery({
    queryKey: buildTokenHoldersKey({ ...params, limit }),
    queryFn: ({ pageParam: cursor }) =>
      buildTokenHoldersFetcher({
        apiClient,
        params: { ...params, cursor, limit },
      })(),
    select: (data) => {
      return {
        totalHolders: data.pages[data.pages.length - 1].totalHolders,
        holders: selectFlatStandardizedPaginatedResults(data),
      };
    },
    getNextPageParam: (lastPage) => lastPage.next?.cursor || undefined,
    initialPageParam: undefined as string | undefined,
    enabled,
  });
};

export { useTokenHolders };
