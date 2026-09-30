import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useScrapeEmbed = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ embed }: { embed: string }) => {
      const response = await apiClient.scrapeEmbed({ embed });
      return response.data;
    },
    [apiClient],
  );
};

export { useScrapeEmbed };
