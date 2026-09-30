import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateAudioRoom } from '../queries/audioRoom/useInvalidateAudioRoom';
import { useInvalidateAudioRoomParticipants } from '../queries/audioRoomParticipants/useInvalidateAudioRoomParticipants';
import { useInvalidateAudioRoomsList } from '../queries/audioRoomsList/useInvalidateAudioRoomsList';

const useAcceptStageInviteAudioRoom = () => {
  const { apiClient } = useFarcasterApiClient();
  const { invalidateAudioRoomParticipants } =
    useInvalidateAudioRoomParticipants();
  const { invalidateAudioRoom } = useInvalidateAudioRoom();
  const { invalidateAudioRoomsList } = useInvalidateAudioRoomsList();

  return useCallback(
    async ({ roomId }: { roomId: string }) => {
      const response = await apiClient.acceptStageInviteAudioRoom({ roomId });
      invalidateAudioRoomParticipants({ roomId });
      invalidateAudioRoom({ roomId });
      invalidateAudioRoomsList();
      return response.data.result;
    },
    [
      apiClient,
      invalidateAudioRoom,
      invalidateAudioRoomParticipants,
      invalidateAudioRoomsList,
    ],
  );
};

export { useAcceptStageInviteAudioRoom };
