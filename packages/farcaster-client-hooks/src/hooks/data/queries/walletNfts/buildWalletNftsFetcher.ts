import {
  ApiGetWalletNftsQueryParams,
  chainIdToChain,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildWalletNftsFetcher =
  ({
    apiClient,
    params,
  }: {
    apiClient: FarcasterApiClient;
    params: Omit<ApiGetWalletNftsQueryParams, 'limit'>;
  }) =>
  async ({ pageParam }: { pageParam?: string }) => {
    const response = await apiClient.getWalletNfts({
      ...params,
      cursor: pageParam,
      // Not used but part of the type.
      limit: 100,
    });

    const originalNftsCount = response.data.result.nfts.length;
    const nfts = response.data.result.nfts.filter((nft) => {
      const chainId = nft.chainId?.toString() ?? '';
      const chain = chainIdToChain(chainId);
      if (!chain && chainId) {
        // eslint-disable-next-line no-console
        console.warn(
          `Filtering out wallet NFT with unknown chainId: ${chainId}`,
        );
      }
      return !!chain;
    });

    // Log if any NFTs were filtered out
    const filteredCount = originalNftsCount - nfts.length;
    if (filteredCount > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `Filtered out ${filteredCount} wallet NFTs with unknown chains`,
      );
    }

    return {
      ...response.data,
      result: {
        ...response.data.result,
        nfts,
      },
    };
  };

export { buildWalletNftsFetcher };
