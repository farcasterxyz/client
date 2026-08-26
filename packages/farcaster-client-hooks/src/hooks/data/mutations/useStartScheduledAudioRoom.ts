import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateAudioRoomsList } from '../queries/audioRoomsList/useInvalidateAudioRoomsList';
import { useInvalidateScheduledAudioRoomsList } from '../queries/scheduledAudioRoomsList/useInvalidateScheduledAudioRoomsList';

const useStartScheduledAudioRoom = () => {
  const { apiClient } = useFarcasterApiClient();
  const { invalidateAudioRoomsList } = useInvalidateAudioRoomsList();
  const { invalidateScheduledAudioRoomsList } =
    useInvalidateScheduledAudioRoomsList();

  return useCallback(
    async ({ roomId }: { roomId: string }) => {
      const response = await apiClient.startScheduledAudioRoom({ roomId });
      invalidateAudioRoomsList();
      invalidateScheduledAudioRoomsList();
      return response.data.result;
    },
    [apiClient, invalidateAudioRoomsList, invalidateScheduledAudioRoomsList],
  );
};

export { useStartScheduledAudioRoom };
