import { useInfiniteQuery } from '@tanstack/react-query';
import {
  ApiDirectCastConversationFilter,
  ApiDirectCastConversationViewCategory,
  getNextPageCursor,
} from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { useMergeIntoGloballyCachedDirectCastInboxConversation } from '../globallyCachedDirectCastInboxConversation';
import { buildDirectCastInboxByAccountFetcher } from './buildDirectCastInboxByAccountFetcher';
import { buildDirectCastInboxByAccountKey } from './buildDirectCastInboxByAccountKey';

const useDirectCastInboxByAccount = ({
  fid,
  category,
  filter,
  refetchOnMount = 'always',
  retry,
}: {
  fid: number;
  category: ApiDirectCastConversationViewCategory;
  filter?: ApiDirectCastConversationFilter;
  refetchOnMount?: boolean | 'always';
  retry?: number;
}) => {
  const { apiClient } = useFarcasterApiClient();

  const mergeIntoGloballyCachedDirectCastInbox =
    useMergeIntoGloballyCachedDirectCastInboxConversation();

  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildDirectCastInboxByAccountKey({
      fid,
      category,
      filter,
    }),

    queryFn: buildDirectCastInboxByAccountFetcher({
      apiClient,
      category,
      filter,
      mergeIntoGloballyCachedDirectCastInbox,
    }),
    getNextPageParam: getNextPageCursor,
    refetchOnMount,
    retry,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useDirectCastInboxByAccount };
