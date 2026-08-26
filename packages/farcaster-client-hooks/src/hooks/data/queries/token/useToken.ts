import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import {
  ApiGetToken200Response,
  ApiGetTokenQueryParamsCamelCase,
} from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useMergeIntoGloballyCachedToken } from '../globallyCachedToken';
import { UseQueryParameters, UseSuspenseQueryParameters } from '../types';
import { buildTokenFetcher } from './buildTokenFetcher';
import { buildTokenKey } from './buildTokenKey';

const useToken = ({
  params,
  query,
}: {
  params: ApiGetTokenQueryParamsCamelCase;
  query?: UseSuspenseQueryParameters<ApiGetToken200Response['result']>;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const mergeIntoGloballyCachedToken = useMergeIntoGloballyCachedToken();

  return useSuspenseQuery({
    queryKey: buildTokenKey(params),
    queryFn: buildTokenFetcher({
      apiClient,
      params,
      mergeIntoGloballyCachedToken,
    }),
    ...query,
  });
};

const useNonSuspenseToken = ({
  params,
  query,
}: {
  params: ApiGetTokenQueryParamsCamelCase;
  query?: UseQueryParameters<ApiGetToken200Response['result']>;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const mergeIntoGloballyCachedToken = useMergeIntoGloballyCachedToken();

  return useQuery({
    queryKey: buildTokenKey(params),
    queryFn: buildTokenFetcher({
      apiClient,
      params,
      mergeIntoGloballyCachedToken,
    }),
    ...query,
  });
};
export { useNonSuspenseToken, useToken };
