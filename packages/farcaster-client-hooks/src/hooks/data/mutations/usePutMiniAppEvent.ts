import { ApiPutMiniAppEventRequestBody } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const usePutMiniAppEvent = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async (params: ApiPutMiniAppEventRequestBody) => {
      try {
        await apiClient.putMiniAppEvent(params);
      } catch (e) {
        // Log the error but don't throw it since mini app events are for analytics
        // and shouldn't break the user flow
        // eslint-disable-next-line no-console
        console.warn(
          '[usePutMiniAppEvent] Failed to record mini app event:',
          e,
        );
      }
    },
    [apiClient],
  );
};

export { usePutMiniAppEvent };
