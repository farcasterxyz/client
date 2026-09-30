import { useQueryClient } from '@tanstack/react-query';
import { ApiChain } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { TokenWatchlistsCache } from '../../../types';
import {
  buildTokenWatchlistsKey,
  useMergeIntoGloballyCachedToken,
} from '../queries';

const useRemoveTokenFromWatchlist = () => {
  const { apiClient } = useFarcasterApiClient();

  const qc = useQueryClient();

  const mergeIntoGloballyCachedToken = useMergeIntoGloballyCachedToken();

  return useCallback(
    async ({
      tokenCa,
      tokenChain,
    }: {
      tokenCa: string;
      tokenChain: ApiChain;
    }) => {
      qc.setQueryData<TokenWatchlistsCache>(
        buildTokenWatchlistsKey(),
        (data) => {
          if (!data) {
            return;
          }

          const { pages, pageParams } = data;

          const updatedPages = pages.map(({ next, result: { tokens } }) => {
            const updatedTokens = tokens.filter(
              (token) => token.ca !== tokenCa || token.chain !== tokenChain,
            );

            return {
              next: next,
              result: {
                tokens: updatedTokens,
              },
            };
          });

          return { pageParams, pages: updatedPages };
        },
      );

      mergeIntoGloballyCachedToken({
        updates: {
          ca: tokenCa,
          chain: tokenChain,
          walletContext: {
            favorited: false,
          },
        },
      });

      await apiClient.removeTokenFromWatchlist({
        tokenCa,
        tokenChain,
      });
    },
    [apiClient, mergeIntoGloballyCachedToken, qc],
  );
};

export { useRemoveTokenFromWatchlist };
