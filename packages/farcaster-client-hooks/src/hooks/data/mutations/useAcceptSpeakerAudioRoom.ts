import { ApiAudioRoomPromoteRole } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateAudioRoomParticipants } from '../queries/audioRoomParticipants/useInvalidateAudioRoomParticipants';

const useAcceptSpeakerAudioRoom = () => {
  const { apiClient } = useFarcasterApiClient();
  const { invalidateAudioRoomParticipants } =
    useInvalidateAudioRoomParticipants();

  return useCallback(
    async ({
      roomId,
      fid,
      role,
    }: {
      roomId: string;
      fid: number;
      role?: ApiAudioRoomPromoteRole;
    }) => {
      const response = await apiClient.acceptSpeakerAudioRoom({
        roomId,
        fid,
        role,
      });
      invalidateAudioRoomParticipants({ roomId });
      return response.data.result;
    },
    [apiClient, invalidateAudioRoomParticipants],
  );
};

export { useAcceptSpeakerAudioRoom };
