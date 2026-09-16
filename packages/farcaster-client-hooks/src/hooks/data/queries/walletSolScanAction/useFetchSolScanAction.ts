import { useQueryClient } from '@tanstack/react-query';
import { ApiSolSendTransactionRequest } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildWalletSolScanActionFetcher } from './buildWalletSolScanActionFetcher';
import { buildWalletSolScanActionKey } from './buildWalletSolScanActionKey';

const useFetchSolScanAction = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    ({
      account,
      action,
      domain,
      walletId,
    }: {
      account: string;
      action: ApiSolSendTransactionRequest;
      domain: string;
      walletId?: string;
    }) => {
      const queryKey = buildWalletSolScanActionKey({
        account,
        action,
        domain,
        walletId,
      });

      return queryClient.fetchQuery({
        queryKey: queryKey,
        queryFn: buildWalletSolScanActionFetcher({
          account,
          action,
          domain,
          apiClient,
          walletId,
        }),
      });
    },
    [apiClient, queryClient],
  );
};

export { useFetchSolScanAction };
