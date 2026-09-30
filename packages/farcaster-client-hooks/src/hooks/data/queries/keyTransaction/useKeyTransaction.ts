import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import {
  ApiGetKeyTransaction200Response,
  ApiGetKeyTransactionQueryParams,
} from 'farcaster-client-data';
import { useEffect } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useInvalidateSigners } from '../signers';
import { useInvalidateUserAppContext } from '../userAppContext';
import { buildKeyTransactionFetcher } from './buildKeyTransactionFetcher';
import { buildKeyTransactionKey } from './buildKeyTransactionKey';

const useKeyTransaction = (
  params: ApiGetKeyTransactionQueryParams,
  options?: Omit<
    UseQueryOptions<
      ApiGetKeyTransaction200Response,
      unknown,
      ApiGetKeyTransaction200Response,
      string[]
    >,
    'queryKey' | 'queryFn'
  >,
) => {
  const { apiClient } = useFarcasterApiClient();
  const invalidateSigners = useInvalidateSigners();
  const invalidateUserAppContext = useInvalidateUserAppContext();

  const result = useQuery({
    queryKey: buildKeyTransactionKey(params),
    queryFn: buildKeyTransactionFetcher({ apiClient, params }),
    ...options,
  });

  // When a key transaction completes or fails, invalidate signer-related
  // caches
  useEffect(() => {
    if (
      result.data?.result.keyTransaction.failedAt ||
      result.data?.result.keyTransaction.completedAt
    ) {
      invalidateSigners();
      invalidateUserAppContext();
    }
  }, [result.data, invalidateSigners, invalidateUserAppContext]);

  return result;
};

export { useKeyTransaction };
