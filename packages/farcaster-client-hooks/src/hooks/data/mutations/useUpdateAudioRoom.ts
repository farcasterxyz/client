import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateAudioRoom } from '../queries/audioRoom/useInvalidateAudioRoom';
import { useInvalidateAudioRoomsList } from '../queries/audioRoomsList/useInvalidateAudioRoomsList';
import { useInvalidateScheduledAudioRoomsList } from '../queries/scheduledAudioRoomsList/useInvalidateScheduledAudioRoomsList';

/**
 * Update title / description / scheduledAt on a Space. Host-only.
 * Scheduled Spaces allow all fields; live Spaces allow title and description.
 */
const useUpdateAudioRoom = () => {
  const { apiClient } = useFarcasterApiClient();
  const { invalidateAudioRoom } = useInvalidateAudioRoom();
  const { invalidateAudioRoomsList } = useInvalidateAudioRoomsList();
  const { invalidateScheduledAudioRoomsList } =
    useInvalidateScheduledAudioRoomsList();

  return useCallback(
    async ({
      roomId,
      title,
      description,
      scheduledAt,
    }: {
      roomId: string;
      title?: string;
      description?: string;
      scheduledAt?: string;
    }) => {
      const response = await apiClient.updateAudioRoom({
        roomId,
        title,
        description,
        scheduledAt,
      });
      invalidateAudioRoom({ roomId });
      invalidateAudioRoomsList();
      invalidateScheduledAudioRoomsList();
      return response.data.result;
    },
    [
      apiClient,
      invalidateAudioRoom,
      invalidateAudioRoomsList,
      invalidateScheduledAudioRoomsList,
    ],
  );
};

export { useUpdateAudioRoom };
