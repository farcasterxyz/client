import {
  useInfiniteQuery,
  useSuspenseInfiniteQuery,
} from '@tanstack/react-query';
import {
  ApiReferralCodeClaims,
  getNextPageCursor,
} from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import {
  extendResult,
  useFlatStandardizedPaginatedResults,
  useOnEndReached,
} from '../../helpers';
import { buildReferralsFetcher } from './utils/buildReferralsFetcher';
import { buildReferralsKey } from './utils/buildReferralsKey';

const referralKeyExtractor = (item: ApiReferralCodeClaims) => {
  return item.claimer.fid.toString();
};

export function useReferralsList() {
  const { apiClient } = useFarcasterApiClient();

  const result = useInfiniteQuery({
    initialPageParam: undefined as string | undefined,
    queryKey: buildReferralsKey(),
    queryFn: buildReferralsFetcher({
      apiClient,
      params: { limit: 50 },
    }),
    getNextPageParam: getNextPageCursor,
    staleTime: 0,
  });

  const flatData = useFlatStandardizedPaginatedResults({
    data: result.data,
    uniqBy: referralKeyExtractor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, {
    flatData,
    onEndReached,
  });
}

export function useSuspenseReferralsList() {
  const { apiClient } = useFarcasterApiClient();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined as string | undefined,
    queryKey: buildReferralsKey(),
    queryFn: buildReferralsFetcher({
      apiClient,
      params: { limit: 50 },
    }),
    getNextPageParam: getNextPageCursor,
    staleTime: 0,
  });

  const flatData = useFlatStandardizedPaginatedResults({
    data: result.data,
    uniqBy: referralKeyExtractor,
  });

  const onEndReached = useOnEndReached(result);

  return {
    ...result,
    flatData,
    onEndReached,
  };
}
