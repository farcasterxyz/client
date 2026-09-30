import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { MutedKeywordCache, MutedKeywordsCache } from '../../../types';
import { buildMutedKeywordKey } from '../queries/mutedKeyword/buildMutedKeywordKey';
import { buildMutedKeywordsKey } from '../queries/mutedKeywords/buildMutedKeywordsKey';

export const useRemoveMuteKeyword = () => {
  const { apiClient } = useFarcasterApiClient();

  const qc = useQueryClient();

  return useCallback(
    async ({ keyword }: { keyword: string }) => {
      qc.setQueryData<MutedKeywordCache>(
        buildMutedKeywordKey({ keyword }),
        () => {
          return undefined;
        },
      );

      qc.setQueryData<MutedKeywordsCache>(buildMutedKeywordsKey(), (data) => {
        if (!data) {
          return {
            success: true,
            result: {
              // Deprecated so does not really matter
              keywords: [],
              mutedKeywords: [],
            },
          };
        }

        const existingKeywordFiltered = data.result.mutedKeywords.filter(
          (o) => o.keyword !== keyword.toLowerCase(),
        );

        return {
          success: true,
          result: {
            // Deprecated so does not really matter
            keywords: [],
            mutedKeywords: [...existingKeywordFiltered],
          },
        };
      });

      const { data } = await apiClient.removeMuteKeyword({ keyword });
      return data;
    },
    [apiClient, qc],
  );
};
