import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { buildArticleFetcher } from './buildArticleFetcher';
import { buildArticleKey } from './buildArticleKey';

const usePrefetchArticle = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({ publicId }: { publicId: string }) => {
      const queryKey = buildArticleKey({ publicId });

      if (checkIfRecentlyPrefetched({ queryKey })) {
        return;
      }

      return queryClient.prefetchQuery({
        queryKey: queryKey,
        queryFn: buildArticleFetcher({
          apiClient,
          publicId,
        }),
      });
    },
    [checkIfRecentlyPrefetched, queryClient, apiClient],
  );
};

export { usePrefetchArticle };
