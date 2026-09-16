import { useQueryClient } from '@tanstack/react-query';
import {
  ApiChainId,
  ApiEthereumAddress,
  ApiFarcasterWalletAction,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildWalletEvmScanActionFetcher } from './buildWalletEvmScanActionFetcher';
import { buildWalletEvmScanActionKey } from './buildWalletEvmScanActionKey';

const useFetchEvmScanAction = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    ({
      account,
      chainId,
      action,
      domain,
      blockNumber,
      walletId,
    }: {
      account: ApiEthereumAddress;
      chainId: ApiChainId;
      action: ApiFarcasterWalletAction;
      domain: string;
      blockNumber?: number;
      walletId?: string;
    }) => {
      const queryKey = buildWalletEvmScanActionKey({
        account,
        chainId,
        action,
        domain,
        walletId,
      });

      return queryClient.fetchQuery({
        queryKey: queryKey,
        queryFn: buildWalletEvmScanActionFetcher({
          account,
          chainId,
          action,
          domain,
          blockNumber,
          walletId,
          apiClient,
        }),
      });
    },
    [apiClient, queryClient],
  );
};

export { useFetchEvmScanAction };
