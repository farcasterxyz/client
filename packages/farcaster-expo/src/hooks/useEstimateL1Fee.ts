import { useQuery } from '@tanstack/react-query';
import {
  estimateL1Fee,
  EstimateL1FeeErrorType,
  EstimateL1FeeParameters,
} from 'viem/op-stack';
import { useClient } from 'wagmi';

export function useEstimateL1Fee({
  query,
  ...params
}: EstimateL1FeeParameters & {
  query: { enabled?: boolean; refetchInterval?: number };
}) {
  const publicClient = useClient();

  return useQuery<bigint, EstimateL1FeeErrorType, bigint, string[]>({
    queryKey: ['estimateL1Fee', publicClient!.uid],
    queryFn: () => estimateL1Fee(publicClient!, params),
    ...query,
    retry(failureCount) {
      return failureCount < 3;
    },
  });
}
