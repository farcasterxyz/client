import { useInfiniteQuery } from '@tanstack/react-query';
import {
  ApiDirectCastConversationViewCategory,
  getNextPageCursor,
} from 'farcaster-client-data';

import { MILLIS_PER_MINUTE } from '../../../..';
import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import {
  extendResult,
  useFlatPaginatedResults,
  useOnEndReached,
} from '../../helpers';
import { useMergeIntoGloballyCachedDirectCastInboxConversation } from '../globallyCachedDirectCastInboxConversation';
import { buildSearchDirectCastInboxFetcher } from './buildSearchDirectCastInboxFetcher';
import { buildSearchDirectCastInboxKey } from './buildSearchDirectCastInboxKey';

const gcTime = MILLIS_PER_MINUTE;

const useSearchDirectCastInbox = ({
  q,
  category,
  limit = 25,
}: {
  q: string;
  category: ApiDirectCastConversationViewCategory;
  limit?: number;
}) => {
  const { apiClient } = useFarcasterApiClient();

  const mergeIntoGloballyCachedDirectCastInboxConversation =
    useMergeIntoGloballyCachedDirectCastInboxConversation();

  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildSearchDirectCastInboxKey({ q, category }),

    queryFn: buildSearchDirectCastInboxFetcher({
      q,
      category,
      limit,
      apiClient,
      mergeIntoGloballyCachedDirectCastInboxConversation,
    }),

    gcTime,
    getNextPageParam: getNextPageCursor,
  });

  const flatData = useFlatPaginatedResults({
    data: result.data,
    key: 'conversations',
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { flatData, onEndReached });
};

export { useSearchDirectCastInbox };
