import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateAudioRoomParticipants } from '../queries/audioRoomParticipants/useInvalidateAudioRoomParticipants';

const useDeclineStageInviteAudioRoom = () => {
  const { apiClient } = useFarcasterApiClient();
  const { invalidateAudioRoomParticipants } =
    useInvalidateAudioRoomParticipants();

  return useCallback(
    async ({ roomId }: { roomId: string }) => {
      const response = await apiClient.declineStageInviteAudioRoom({ roomId });
      invalidateAudioRoomParticipants({ roomId });
      return response.data.result;
    },
    [apiClient, invalidateAudioRoomParticipants],
  );
};

export { useDeclineStageInviteAudioRoom };
