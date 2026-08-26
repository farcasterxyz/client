import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateAudioRoomParticipants } from '../queries/audioRoomParticipants/useInvalidateAudioRoomParticipants';

const useRemoveParticipantAudioRoom = () => {
  const { apiClient } = useFarcasterApiClient();
  const { invalidateAudioRoomParticipants } =
    useInvalidateAudioRoomParticipants();

  return useCallback(
    async ({ roomId, fid }: { roomId: string; fid: number }) => {
      const response = await apiClient.removeParticipantAudioRoom({
        roomId,
        fid,
      });
      invalidateAudioRoomParticipants({ roomId });
      return response.data.result;
    },
    [apiClient, invalidateAudioRoomParticipants],
  );
};

export { useRemoveParticipantAudioRoom };
