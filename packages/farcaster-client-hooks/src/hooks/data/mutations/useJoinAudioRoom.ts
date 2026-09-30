import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateAudioRoom } from '../queries/audioRoom/useInvalidateAudioRoom';
import { useInvalidateAudioRoomsList } from '../queries/audioRoomsList/useInvalidateAudioRoomsList';

const useJoinAudioRoom = () => {
  const { apiClient } = useFarcasterApiClient();
  const { invalidateAudioRoomsList } = useInvalidateAudioRoomsList();
  const { invalidateAudioRoom } = useInvalidateAudioRoom();

  return useCallback(
    async ({ roomId }: { roomId: string }) => {
      const response = await apiClient.joinAudioRoom({ roomId });
      invalidateAudioRoomsList();
      invalidateAudioRoom({ roomId });
      return response.data.result;
    },
    [apiClient, invalidateAudioRoom, invalidateAudioRoomsList],
  );
};

export { useJoinAudioRoom };
