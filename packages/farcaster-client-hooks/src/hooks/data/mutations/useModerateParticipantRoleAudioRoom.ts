import { ApiAudioRoomModerationRole } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useInvalidateAudioRoomParticipants } from '../queries/audioRoomParticipants/useInvalidateAudioRoomParticipants';

const useModerateParticipantRoleAudioRoom = () => {
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
      role: ApiAudioRoomModerationRole;
    }) => {
      const response = await apiClient.moderateParticipantRoleAudioRoom({
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

export { useModerateParticipantRoleAudioRoom };
