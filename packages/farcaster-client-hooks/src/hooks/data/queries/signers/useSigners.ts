import {
  useInfiniteQuery,
  useSuspenseInfiniteQuery,
} from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildSignersFetcher } from './buildSignersFetcher';
import { buildSignersKey } from './buildSignersKey';

const useSigners = () => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildSignersKey(),
    queryFn: buildSignersFetcher({ apiClient }),
    getNextPageParam: getNextPageCursor,
  });
};

const useNonSuspendingSigners = () => {
  const { apiClient } = useFarcasterApiClient();

  return useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildSignersKey(),
    queryFn: buildSignersFetcher({ apiClient }),
    getNextPageParam: getNextPageCursor,
  });
};

export { useNonSuspendingSigners, useSigners };
