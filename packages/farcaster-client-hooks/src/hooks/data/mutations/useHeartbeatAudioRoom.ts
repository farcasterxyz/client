import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useHeartbeatAudioRoom = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      roomId,
      activeSpeakerFids,
    }: {
      roomId: string;
      activeSpeakerFids: number[];
    }) => {
      await apiClient.heartbeatAudioRoom({ roomId, activeSpeakerFids });
    },
    [apiClient],
  );
};

export { useHeartbeatAudioRoom };
