import {
  ApiChainId,
  ApiEthereumAddress,
  ApiFarcasterWalletAction,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildWalletEvmScanActionFetcher =
  ({
    account,
    chainId,
    action,
    domain,
    apiClient,
    blockNumber,
    walletId,
  }: {
    account: ApiEthereumAddress;
    chainId: ApiChainId;
    action: ApiFarcasterWalletAction;
    domain: string;
    apiClient: FarcasterApiClient;
    blockNumber?: number;
    walletId?: string;
  }) =>
  async () => {
    const response = await apiClient.walletEvmScanAction({
      account,
      chainId,
      action,
      domain,
      blockNumber,
      walletId,
    });

    return response.data.result;
  };

export { buildWalletEvmScanActionFetcher };
