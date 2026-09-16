import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateAudioRoomsList } from '../queries/audioRoomsList/useInvalidateAudioRoomsList';
import { useInvalidateScheduledAudioRoomsList } from '../queries/scheduledAudioRoomsList/useInvalidateScheduledAudioRoomsList';

const useStartAudioRoom = () => {
  const { apiClient } = useFarcasterApiClient();
  const { invalidateAudioRoomsList } = useInvalidateAudioRoomsList();
  const { invalidateScheduledAudioRoomsList } =
    useInvalidateScheduledAudioRoomsList();

  return useCallback(
    async ({
      title,
      description,
      channelUrl,
      scheduledAt,
      recordingEnabled,
    }: {
      title: string;
      description?: string;
      channelUrl?: string;
      scheduledAt?: string;
      recordingEnabled?: boolean;
    }) => {
      const response = await apiClient.createAudioRoom({
        title,
        description,
        channelUrl,
        scheduledAt,
        recordingEnabled,
      });
      invalidateAudioRoomsList();
      if (scheduledAt) {
        invalidateScheduledAudioRoomsList();
      }
      return response.data.result;
    },
    [apiClient, invalidateAudioRoomsList, invalidateScheduledAudioRoomsList],
  );
};

export { useStartAudioRoom };
