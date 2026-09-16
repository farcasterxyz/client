import {
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildFrameDetailsFetcher } from './buildFrameDetailsFetcher';
import { buildFrameDetailsKey } from './buildFrameDetailsKey';
import { useMergeIntoGloballyCachedFrame } from './framesGlobalCache';

export const useFrameDetails = ({
  domain,
  id,
}: {
  domain?: string;
  id?: string;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const mergeIntoGlobalCache = useMergeIntoGloballyCachedFrame();

  const result = useSuspenseQuery({
    queryKey: buildFrameDetailsKey({ domain, id }),
    queryFn: buildFrameDetailsFetcher({
      domain,
      id,
      apiClient,
      mergeIntoGlobalCache,
    }),
    staleTime: 0,
  });

  return result;
};

export const useNonSuspenseFrameDetails = ({
  domain,
  id,
  enabled = true,
}: {
  domain?: string;
  id?: string;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const mergeIntoGlobalCache = useMergeIntoGloballyCachedFrame();

  const result = useQuery({
    queryKey: buildFrameDetailsKey({ domain, id }),
    queryFn: buildFrameDetailsFetcher({
      domain,
      id,
      apiClient,
      mergeIntoGlobalCache,
    }),
    staleTime: 0,
    enabled: (!!domain || !!id) && enabled,
  });

  return result;
};

export const useFetchFrameDetails = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const mergeIntoGlobalCache = useMergeIntoGloballyCachedFrame();
  return useCallback(
    ({ domain, id }: { domain?: string; id?: string }) => {
      const queryKey = buildFrameDetailsKey({ domain, id });

      return queryClient.fetchQuery({
        queryKey,
        queryFn: buildFrameDetailsFetcher({
          id,
          domain,
          apiClient,
          mergeIntoGlobalCache,
        }),
      });
    },
    [apiClient, queryClient, mergeIntoGlobalCache],
  );
};
