import {
  useSuspenseQuery,
  UseSuspenseQueryOptions,
} from '@tanstack/react-query';
import {
  ApiGetRemoteSiwfRequest200Response,
  ApiGetRemoteSiwfRequestQueryParams,
} from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildRemoteSiwfRequestFetcher } from './buildRemoteSiwfRequestFetcher';
import { buildRemoteSiwfRequestKey } from './buildRemoteSiwfRequestKey';

const useRemoteSiwfRequest = (
  params: ApiGetRemoteSiwfRequestQueryParams,
  options?: Omit<
    UseSuspenseQueryOptions<
      ApiGetRemoteSiwfRequest200Response,
      unknown,
      ApiGetRemoteSiwfRequest200Response,
      Array<string | number>
    >,
    'queryKey' | 'queryFn'
  >,
) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildRemoteSiwfRequestKey(params),
    queryFn: buildRemoteSiwfRequestFetcher({ apiClient, params }),
    staleTime: 0,
    ...options,
  });
};

export { useRemoteSiwfRequest };
