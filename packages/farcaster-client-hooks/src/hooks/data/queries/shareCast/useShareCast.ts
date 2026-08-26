import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { ApiShareCastContext } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildShareCastFetcher } from './buildShareCastFetcher';
import { buildShareCastKey } from './buildShareCastKey';

const useShareCast = ({
  castHash,
  context,
  maxTargets,
}: {
  castHash: string;
  context?: ApiShareCastContext;
  maxTargets?: number;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildShareCastKey({ castHash, context, maxTargets }),

    queryFn: buildShareCastFetcher({
      apiClient,
      castHash,
      context,
      maxTargets,
    }),
  });
};

const useNonSuspendingShareCast = ({
  castHash,
  context,
  maxTargets,
}: {
  castHash: string;
  context?: ApiShareCastContext;
  maxTargets?: number;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildShareCastKey({ castHash, context, maxTargets }),
    queryFn: buildShareCastFetcher({
      apiClient,
      castHash,
      context,
      maxTargets,
    }),
  });
};

export { useNonSuspendingShareCast, useShareCast };
