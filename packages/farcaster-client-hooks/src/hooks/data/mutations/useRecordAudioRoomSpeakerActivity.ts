import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useRecordAudioRoomSpeakerActivity = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      roomId,
      activeSpeakerFids,
    }: Parameters<typeof apiClient.recordAudioRoomSpeakerActivity>[0]) => {
      await apiClient.recordAudioRoomSpeakerActivity({
        roomId,
        activeSpeakerFids,
      });
    },
    [apiClient],
  );
};

export { useRecordAudioRoomSpeakerActivity };
