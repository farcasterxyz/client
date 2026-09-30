import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildValidateNewChannelKeyFetcher } from './buildValidateNewChannelKeyFetcher';

const useValidateNewChannelKey = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ channelKey }: { channelKey: string }) => {
      const response = await buildValidateNewChannelKeyFetcher({
        apiClient,
        channelKey,
      })();

      return response;
    },
    [apiClient],
  );
};

export { useValidateNewChannelKey };
