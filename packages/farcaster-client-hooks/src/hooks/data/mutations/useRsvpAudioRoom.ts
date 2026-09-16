import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateAudioRoom } from '../queries/audioRoom/useInvalidateAudioRoom';
import { useInvalidateScheduledAudioRoomsList } from '../queries/scheduledAudioRoomsList/useInvalidateScheduledAudioRoomsList';

const useRsvpAudioRoom = () => {
  const { apiClient } = useFarcasterApiClient();
  const { invalidateAudioRoom } = useInvalidateAudioRoom();
  const { invalidateScheduledAudioRoomsList } =
    useInvalidateScheduledAudioRoomsList();

  return useCallback(
    async ({ roomId }: { roomId: string }) => {
      const response = await apiClient.rsvpAudioRoom({ roomId });
      invalidateAudioRoom({ roomId });
      invalidateScheduledAudioRoomsList();
      return response.data.result;
    },
    [apiClient, invalidateAudioRoom, invalidateScheduledAudioRoomsList],
  );
};

export { useRsvpAudioRoom };
