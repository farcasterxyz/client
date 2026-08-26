import { useQueryClient } from '@tanstack/react-query';
import { ApiShareCastContext } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { buildShareCastFetcher } from './buildShareCastFetcher';
import { buildShareCastKey } from './buildShareCastKey';

const usePrefetchShareCast = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({
      castHash,
      context,
      maxTargets,
    }: {
      castHash: string;
      context?: ApiShareCastContext;
      maxTargets?: number;
    }) => {
      const queryKey = buildShareCastKey({ castHash, context, maxTargets });

      if (checkIfRecentlyPrefetched({ queryKey })) {
        return;
      }

      return queryClient.prefetchQuery({
        queryKey: queryKey,

        queryFn: buildShareCastFetcher({
          apiClient,
          castHash,
          context,
          maxTargets,
        }),
      });
    },
    [checkIfRecentlyPrefetched, queryClient, apiClient],
  );
};

export { usePrefetchShareCast };
