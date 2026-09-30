import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateAudioRoom } from '../queries/audioRoom/useInvalidateAudioRoom';
import { useInvalidateAudioRoomsList } from '../queries/audioRoomsList/useInvalidateAudioRoomsList';

const useLeaveAudioRoom = () => {
  const { apiClient } = useFarcasterApiClient();
  const { invalidateAudioRoomsList } = useInvalidateAudioRoomsList();
  const { invalidateAudioRoom } = useInvalidateAudioRoom();

  return useCallback(
    async ({ roomId }: { roomId: string }) => {
      await apiClient.leaveAudioRoom({ roomId });
      invalidateAudioRoomsList();
      invalidateAudioRoom({ roomId });
    },
    [apiClient, invalidateAudioRoom, invalidateAudioRoomsList],
  );
};

export { useLeaveAudioRoom };
