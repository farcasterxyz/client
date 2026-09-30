import {
  DefaultError,
  useQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';
import {
  ApiGetTokenWalletContext200Response,
  ApiGetTokenWalletContextQueryParamsCamelCase,
  FarcasterError,
} from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { UseQueryParameters, UseSuspenseQueryParameters } from '../types';
import { buildTokenWalletContextFetcher } from './buildTokenWalletContextFetcher';
import { buildTokenWalletContextKey } from './buildTokenWalletContextKey';

const useTokenWalletContext = ({
  params,
  query,
}: {
  params: ApiGetTokenWalletContextQueryParamsCamelCase;
  query?: UseSuspenseQueryParameters<
    ApiGetTokenWalletContext200Response,
    FarcasterError | DefaultError,
    ApiGetTokenWalletContext200Response['result']['walletContext']
  >;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildTokenWalletContextKey(params),
    queryFn: buildTokenWalletContextFetcher({
      apiClient,
      params,
    }),
    select: (data) => data?.result.walletContext,
    ...query,
  });
};

const useNonSuspenseTokenWalletContext = ({
  params,
  query,
}: {
  params: ApiGetTokenWalletContextQueryParamsCamelCase;
  query?: UseQueryParameters<
    ApiGetTokenWalletContext200Response,
    FarcasterError | DefaultError,
    ApiGetTokenWalletContext200Response['result']['walletContext']
  >;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildTokenWalletContextKey(params),
    queryFn: buildTokenWalletContextFetcher({
      apiClient,
      params,
    }),
    select: (data) => data?.result.walletContext,
    ...query,
  });
};
export { useNonSuspenseTokenWalletContext, useTokenWalletContext };
