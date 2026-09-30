import { useQuery } from '@tanstack/react-query';
import {
  ApiChainId,
  ApiEthereumAddress,
  ApiFarcasterWalletAction,
} from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildWalletEvmScanActionFetcher } from './buildWalletEvmScanActionFetcher';
import { buildWalletEvmScanActionKey } from './buildWalletEvmScanActionKey';

const useEvmScanAction = ({
  account,
  chainId,
  action,
  domain,
  blockNumber,
  walletId,
  enabled = true,
}: {
  account: ApiEthereumAddress;
  chainId: ApiChainId;
  action: ApiFarcasterWalletAction;
  domain: string;
  blockNumber?: number;
  walletId?: string;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  const fetcher = buildWalletEvmScanActionFetcher({
    account,
    chainId,
    action,
    domain,
    apiClient,
    blockNumber,
    walletId,
  });

  return useQuery({
    queryKey: buildWalletEvmScanActionKey({
      account,
      chainId,
      action,
      domain,
      walletId,
    }),
    queryFn: fetcher,
    // Don't cache this query.
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    enabled,
  });
};

export { useEvmScanAction };
