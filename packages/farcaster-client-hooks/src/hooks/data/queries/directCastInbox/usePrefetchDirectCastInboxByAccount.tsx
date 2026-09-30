import { useQueryClient } from '@tanstack/react-query';
import { ApiGetDirectCastConversationsV3QueryParams } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { useMergeIntoGloballyCachedDirectCastInboxConversation } from '../globallyCachedDirectCastInboxConversation';
import { buildDirectCastInboxByAccountFetcher } from './buildDirectCastInboxByAccountFetcher';
import { buildDirectCastInboxByAccountKey } from './buildDirectCastInboxByAccountKey';

const usePrefetchDirectCastInboxByAccount = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  const mergeIntoGloballyCachedDirectCastInbox =
    useMergeIntoGloballyCachedDirectCastInboxConversation();

  return useCallback(
    ({
      fid,
      params,
    }: {
      fid: number;
      params: Omit<
        ApiGetDirectCastConversationsV3QueryParams,
        'cursor' | 'limit'
      >;
    }) => {
      const queryKey = buildDirectCastInboxByAccountKey({
        fid,
        ...params,
      });

      if (checkIfRecentlyPrefetched({ queryKey })) {
        return;
      }

      return queryClient.prefetchInfiniteQuery({
        initialPageParam: undefined,
        queryKey: buildDirectCastInboxByAccountKey({ fid, ...params }),

        queryFn: buildDirectCastInboxByAccountFetcher({
          apiClient,
          mergeIntoGloballyCachedDirectCastInbox,
          ...params,
        }),
      });
    },
    [
      queryClient,
      apiClient,
      mergeIntoGloballyCachedDirectCastInbox,
      checkIfRecentlyPrefetched,
    ],
  );
};

export { usePrefetchDirectCastInboxByAccount };
