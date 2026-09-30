import {
  ApiSolSendTransactionRequest,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildWalletSolScanActionFetcher =
  ({
    account,
    action,
    domain,
    apiClient,
    walletId,
  }: {
    account: string;
    action: ApiSolSendTransactionRequest | undefined;
    domain: string;
    apiClient: FarcasterApiClient;
    walletId?: string;
  }) =>
  async () => {
    if (!action) {
      throw new Error('No action provided');
    }
    const response = await apiClient.walletSolScanAction({
      account,
      action,
      domain,
      walletId,
    });

    return response.data.result;
  };

export { buildWalletSolScanActionFetcher };
