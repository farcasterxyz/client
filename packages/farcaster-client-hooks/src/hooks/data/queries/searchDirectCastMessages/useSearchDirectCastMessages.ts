import { useInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { MILLIS_PER_MINUTE } from '../../../..';
import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import {
  extendResult,
  useFlatPaginatedResults,
  useOnEndReached,
} from '../../helpers';
import { buildSearchDirectCastMessagesFetcher } from './buildSearchDirectCastMessagesFetcher';
import { buildSearchDirectCastMessagesKey } from './buildSearchDirectCastMessagesKey';

const gcTime = MILLIS_PER_MINUTE;

const useSearchDirectCastMessages = ({
  query,
  limit = 25,
}: {
  query: string;
  limit?: number;
}) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildSearchDirectCastMessagesKey({ query }),
    queryFn: buildSearchDirectCastMessagesFetcher({
      apiClient,
      query,
      limit,
    }),
    gcTime,
    getNextPageParam: getNextPageCursor,
    enabled: query.length > 2,
  });

  const flatData = useFlatPaginatedResults({
    data: result.data,
    key: 'searchResults',
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { flatData, onEndReached });
};

export { useSearchDirectCastMessages };
