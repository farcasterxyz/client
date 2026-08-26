import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateAudioRoomParticipants } from '../queries/audioRoomParticipants/useInvalidateAudioRoomParticipants';

const useRemoveSpeakerAudioRoom = () => {
  const { apiClient } = useFarcasterApiClient();
  const { invalidateAudioRoomParticipants } =
    useInvalidateAudioRoomParticipants();

  return useCallback(
    async ({ roomId, fid }: { roomId: string; fid: number }) => {
      const response = await apiClient.removeSpeakerAudioRoom({ roomId, fid });
      invalidateAudioRoomParticipants({ roomId });
      return response.data.result;
    },
    [apiClient, invalidateAudioRoomParticipants],
  );
};

export { useRemoveSpeakerAudioRoom };
