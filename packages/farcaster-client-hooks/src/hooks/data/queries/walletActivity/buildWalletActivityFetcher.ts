import {
  ApiGetWalletActivityQueryParams,
  chainIdToChain,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

const buildWalletActivityFetcher = ({
  apiClient,
  params,
}: {
  apiClient: FarcasterApiClient;
  params: Omit<ApiGetWalletActivityQueryParams, 'limit'>;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getWalletActivity({
      cursor,
      address: params.address,
      fid: params.fid,
      walletId: params.walletId,
      hideSpam: params.hideSpam,
      hideMicrotransactions: params.hideMicrotransactions,
      token: params.token,
      chain: params.chain,
      // Not used but part of the type.
      limit: 100,
    });

    // Filter out invalid chains
    const originalActivityCount = response.data.result.activity.length;
    const activityFromKnownChains = response.data.result.activity.filter(
      (activity) => {
        if (activity.transaction.protocol === 'solana') {
          return true;
        }
        const chainId = activity.transaction.chainId.toString();
        const isKnownChain = !!chainIdToChain(chainId);
        if (!isKnownChain) {
          // eslint-disable-next-line no-console
          console.warn(
            `Filtering out wallet activity with unknown chainId: ${chainId}`,
          );
        }
        return isKnownChain;
      },
    );

    // Log if any activities were filtered out
    const filteredCount =
      originalActivityCount - activityFromKnownChains.length;
    if (filteredCount > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `Filtered out ${filteredCount} wallet activities with unknown chains`,
      );
    }

    return {
      ...response.data,
      result: {
        ...response.data.result,
        activity: activityFromKnownChains,
      },
    };
  });

export { buildWalletActivityFetcher };
