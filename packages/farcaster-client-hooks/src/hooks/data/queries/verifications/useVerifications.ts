import {
  useInfiniteQuery,
  useSuspenseInfiniteQuery,
} from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildVerificationsFetcher } from './buildVerificationsFetcher';
import { buildVerificationsKey } from './buildVerificationsKey';

const useVerifications = ({ fid }: { fid: number }) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildVerificationsKey({ fid }),
    queryFn: buildVerificationsFetcher({ apiClient, fid }),
    getNextPageParam: getNextPageCursor,
  });
};

const useVerificationsQuery = ({ fid }: { fid: number }) => {
  const { apiClient } = useFarcasterApiClient();

  return useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildVerificationsKey({ fid }),
    queryFn: buildVerificationsFetcher({ apiClient, fid }),
    getNextPageParam: getNextPageCursor,
  });
};

export { useVerifications, useVerificationsQuery };
