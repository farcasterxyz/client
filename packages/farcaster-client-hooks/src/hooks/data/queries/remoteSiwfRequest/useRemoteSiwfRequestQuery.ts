import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import {
  ApiGetRemoteSiwfRequest200Response,
  ApiGetRemoteSiwfRequestQueryParams,
} from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildRemoteSiwfRequestFetcher } from './buildRemoteSiwfRequestFetcher';
import { buildRemoteSiwfRequestKey } from './buildRemoteSiwfRequestKey';

// Non-suspense version
const useRemoteSiwfRequestQuery = (
  params: ApiGetRemoteSiwfRequestQueryParams,
  options?: Omit<
    UseQueryOptions<
      ApiGetRemoteSiwfRequest200Response,
      unknown,
      ApiGetRemoteSiwfRequest200Response,
      Array<string | number>
    >,
    'queryKey' | 'queryFn'
  >,
) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildRemoteSiwfRequestKey(params),
    queryFn: buildRemoteSiwfRequestFetcher({ apiClient, params }),
    staleTime: 0,
    ...options,
  });
};

export { useRemoteSiwfRequestQuery };
