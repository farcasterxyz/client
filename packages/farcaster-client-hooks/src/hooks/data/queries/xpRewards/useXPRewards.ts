import {
  useInfiniteQuery,
  useSuspenseInfiniteQuery,
} from '@tanstack/react-query';
import { ApiXPReward, getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import {
  extendResult,
  useFlatStandardizedPaginatedResults,
  useOnEndReached,
} from '../../helpers';
import { buildXPRewardsFetcher } from './buildXPRewardsFetcher';
import { buildXPRewardsKey } from './buildXPRewardsKey';

const xpRewardKeyExtractor = (item: ApiXPReward) => {
  return item.id;
};

export function useXPRewards() {
  const { apiClient } = useFarcasterApiClient();

  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildXPRewardsKey(),
    queryFn: buildXPRewardsFetcher({
      apiClient,
    }),
    getNextPageParam: getNextPageCursor,
    staleTime: 0,
  });

  const totalUsdc = result.data?.pages[0]?.totalUsdc ?? 0;
  const totalReferrals = result.data?.pages[0]?.totalReferrals ?? 0;

  const onEndReached = useOnEndReached(result);

  const flatData = useFlatStandardizedPaginatedResults({
    data: result.data,
    uniqBy: xpRewardKeyExtractor,
  });

  return extendResult(result, {
    flatData,
    onEndReached,
    totalUsdc,
    totalReferrals,
  });
}

export function useSuspenseXPRewards() {
  const { apiClient } = useFarcasterApiClient();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildXPRewardsKey(),
    queryFn: buildXPRewardsFetcher({
      apiClient,
    }),
    getNextPageParam: getNextPageCursor,
    staleTime: 0,
  });

  const totalUsdc = result.data?.pages[0]?.totalUsdc ?? 0;
  const totalReferrals = result.data?.pages[0]?.totalReferrals ?? 0;

  const onEndReached = useOnEndReached(result);

  const flatData = useFlatStandardizedPaginatedResults({
    data: result.data,
    uniqBy: xpRewardKeyExtractor,
  });

  return extendResult(result, {
    flatData,
    onEndReached,
    totalUsdc,
    totalReferrals,
  });
}
