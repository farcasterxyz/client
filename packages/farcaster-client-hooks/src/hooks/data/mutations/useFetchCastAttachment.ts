import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { MILLIS_PER_HOUR, MILLIS_PER_SECOND } from '../../..';
import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { resolveCastEmbedUrls } from '../../../utils/resolveCastEmbedUrls';

const useFetchCastAttachment = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ embeds }: { embeds: string[] }) => {
      // Resolve short-hash Farcaster cast URLs to full-hash conversation URLs so
      // `processCastAttachments` gets an embed the API accepts. We key the query
      // cache by the resolved URLs (so short and full forms share a cache entry),
      // but return the original `embeds` so callers that guard against stale
      // responses via strict equality (e.g. `useCastComposerEmbeds`) keep working.
      const resolvedEmbeds =
        (await resolveCastEmbedUrls({ apiClient, embeds })) ?? embeds;
      return queryClient.fetchQuery({
        queryKey: ['fetch-cast-attachments', ...resolvedEmbeds],
        staleTime: MILLIS_PER_HOUR,
        queryFn: async () => {
          const response = await apiClient.processCastAttachments(
            {
              text: '',
              embeds: resolvedEmbeds,
            },
            {
              timeout: MILLIS_PER_SECOND * 10,
            },
          );
          return { responseData: response.data, embeds };
        },
        retry: false,
      });
    },
    [apiClient, queryClient],
  );
};

export { useFetchCastAttachment };
