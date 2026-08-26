import { useQueryClient } from '@tanstack/react-query';
import { ApiMutedKeywordProperties } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { MutedKeywordCache, MutedKeywordsCache } from '../../../types';
import { buildMutedKeywordKey } from '../queries/mutedKeyword/buildMutedKeywordKey';
import { buildMutedKeywordsKey } from '../queries/mutedKeywords/buildMutedKeywordsKey';

export const useAddMuteKeyword = () => {
  const { apiClient } = useFarcasterApiClient();

  const qc = useQueryClient();

  return useCallback(
    async ({
      keyword,
      properties,
    }: {
      keyword: string;
      properties: ApiMutedKeywordProperties;
    }) => {
      const mutedKeyword = { keyword, properties };

      qc.setQueryData<MutedKeywordCache>(
        buildMutedKeywordKey({ keyword }),
        () => {
          return { mutedKeyword };
        },
      );

      qc.setQueryData<MutedKeywordsCache>(buildMutedKeywordsKey(), (data) => {
        if (!data) {
          return {
            success: true,
            result: {
              // Deprecated so does not really matter
              keywords: [keyword],
              mutedKeywords: [mutedKeyword],
            },
          };
        }

        const possiblyExistingMutedKeywordFiltered =
          data.result.mutedKeywords.filter(
            (o) => o.keyword !== keyword.toLowerCase(),
          );

        return {
          success: true,
          result: {
            // Deprecated so does not really matter
            keywords: [keyword, ...data.result.keywords],
            mutedKeywords: [
              mutedKeyword,
              ...possiblyExistingMutedKeywordFiltered,
            ],
          },
        };
      });

      const { data } = await apiClient.addMuteKeyword({ keyword, properties });

      return data;
    },
    [apiClient, qc],
  );
};
