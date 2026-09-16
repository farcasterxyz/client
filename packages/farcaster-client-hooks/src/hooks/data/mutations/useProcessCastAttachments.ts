import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { resolveCastEmbedUrls } from '../../../utils/resolveCastEmbedUrls';

const useProcessCastAttachments = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      text,
      embeds,
    }: {
      text: string;
      embeds: string[] | undefined;
    }) => {
      const resolvedEmbeds = await resolveCastEmbedUrls({ apiClient, embeds });
      const response = await apiClient.processCastAttachments({
        text,
        embeds: resolvedEmbeds,
      });
      return response.data;
    },
    [apiClient],
  );
};

export { useProcessCastAttachments };
