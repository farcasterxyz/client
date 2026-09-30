import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateAudioRoom } from '../queries/audioRoom/useInvalidateAudioRoom';
import { useInvalidateAudioRoomsList } from '../queries/audioRoomsList/useInvalidateAudioRoomsList';
import { useInvalidateScheduledAudioRoomsList } from '../queries/scheduledAudioRoomsList/useInvalidateScheduledAudioRoomsList';

const useEndAudioRoom = () => {
  const { apiClient } = useFarcasterApiClient();
  const { invalidateAudioRoomsList } = useInvalidateAudioRoomsList();
  const { invalidateAudioRoom } = useInvalidateAudioRoom();
  const { invalidateScheduledAudioRoomsList } =
    useInvalidateScheduledAudioRoomsList();

  return useCallback(
    async ({ roomId }: { roomId: string }) => {
      const response = await apiClient.endAudioRoom({ roomId });
      invalidateAudioRoomsList();
      invalidateScheduledAudioRoomsList();
      invalidateAudioRoom({ roomId });
      return response.data.result.room;
    },
    [
      apiClient,
      invalidateAudioRoom,
      invalidateAudioRoomsList,
      invalidateScheduledAudioRoomsList,
    ],
  );
};

export { useEndAudioRoom };
