import { useQueryClient } from '@tanstack/react-query';
import { ApiChain, ApiTokenLink } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { TokenWatchlistsCache } from '../../../types';
import {
  buildTokenWatchlistsKey,
  useMergeIntoGloballyCachedToken,
} from '../queries';

const useAddTokenToWatchlist = () => {
  const { apiClient } = useFarcasterApiClient();

  const qc = useQueryClient();

  const mergeIntoGloballyCachedToken = useMergeIntoGloballyCachedToken();

  return useCallback(
    async ({
      tokenCa,
      tokenChain,
      optimisticTokenToInsert,
    }: {
      tokenCa: string;
      tokenChain: ApiChain;
      optimisticTokenToInsert: ApiTokenLink;
    }) => {
      qc.setQueryData<TokenWatchlistsCache>(
        buildTokenWatchlistsKey(),
        (data) => {
          if (!data) {
            return;
          }

          const { pages, pageParams } = data;

          const updatedPages = pages.map(({ next, result: { tokens } }) => {
            tokens.unshift(optimisticTokenToInsert);

            return {
              next: next,
              result: {
                tokens: tokens,
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
            favorited: true,
          },
        },
      });

      await apiClient.addTokenToWatchlist({
        tokenCa,
        tokenChain,
      });
    },
    [apiClient, mergeIntoGloballyCachedToken, qc],
  );
};

export { useAddTokenToWatchlist };
