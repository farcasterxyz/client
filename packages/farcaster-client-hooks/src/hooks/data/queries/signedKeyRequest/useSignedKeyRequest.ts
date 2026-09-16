import {
  useSuspenseQuery,
  UseSuspenseQueryOptions,
} from '@tanstack/react-query';
import { ApiGetSignedKeyRequest200Response } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildSignedKeyRequestFetcher } from './buildSignedKeyRequestFetcher';
import { buildSignedKeyRequestKey } from './buildSignedKeyRequestKey';

const useSignedKeyRequest = (
  {
    token,
    deadline,
  }: {
    token: string;
    deadline?: number;
  },
  options?: Omit<
    UseSuspenseQueryOptions<
      ApiGetSignedKeyRequest200Response,
      unknown,
      ApiGetSignedKeyRequest200Response,
      Array<string | number>
    >,
    'queryKey' | 'queryFn'
  >,
) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildSignedKeyRequestKey({ token, deadline }),
    queryFn: buildSignedKeyRequestFetcher({ apiClient, token, deadline }),
    ...options,
  });
};

export { useSignedKeyRequest };
