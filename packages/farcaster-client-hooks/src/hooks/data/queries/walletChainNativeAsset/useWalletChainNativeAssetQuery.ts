import { useQuery } from '@tanstack/react-query';
import {
  ApiGetWalletChainNativeAsset200Response,
  ApiGetWalletChainNativeAssetQueryParams,
  FarcasterError,
} from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { UseQueryParameters } from '../types';
import { buildWalletChainNativeAssetFetcher } from './buildWalletChainNativeAssetFetcher';
import {
  BuildWalletChainNativeAssetKey,
  buildWalletChainNativeAssetKey,
} from './buildWalletChainNativeAssetKey';
import { walletChainNativeAssetDefaultQueryOptions } from './walletChainNativeAssetQueryDefaultOptions';

export const useWalletChainNativeAssetQuery = ({
  params,
  query = {},
}: {
  params: ApiGetWalletChainNativeAssetQueryParams;
  query?: UseQueryParameters<
    ApiGetWalletChainNativeAsset200Response['result'],
    FarcasterError,
    ApiGetWalletChainNativeAsset200Response['result'],
    BuildWalletChainNativeAssetKey
  >;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildWalletChainNativeAssetKey(params),
    queryFn: buildWalletChainNativeAssetFetcher({ params, apiClient }),
    ...walletChainNativeAssetDefaultQueryOptions,
    ...query,
  });
};
