import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useRaiseHandAudioRoom = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ roomId, raised }: { roomId: string; raised: boolean }) => {
      const response = await apiClient.raiseHandAudioRoom({ roomId, raised });
      return response.data.result;
    },
    [apiClient],
  );
};

export { useRaiseHandAudioRoom };
