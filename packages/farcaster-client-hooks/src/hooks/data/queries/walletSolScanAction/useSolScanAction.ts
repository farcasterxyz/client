import { useQuery } from '@tanstack/react-query';
import { ApiSolSendTransactionRequest } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildWalletSolScanActionFetcher } from './buildWalletSolScanActionFetcher';
import { buildWalletSolScanActionKey } from './buildWalletSolScanActionKey';

const useSolScanAction = ({
  account,
  action,
  domain,
  walletId,
  enabled = true,
}: {
  account: string;
  action: ApiSolSendTransactionRequest | undefined;
  domain: string;
  walletId?: string;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  const fetcher = buildWalletSolScanActionFetcher({
    account,
    action,
    domain,
    apiClient,
    walletId,
  });

  return useQuery({
    queryKey: buildWalletSolScanActionKey({
      account,
      action,
      domain,
      walletId,
    }),
    queryFn: fetcher,
    // Don't cache this query.
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    enabled: !!action && enabled,
  });
};

export { useSolScanAction };
