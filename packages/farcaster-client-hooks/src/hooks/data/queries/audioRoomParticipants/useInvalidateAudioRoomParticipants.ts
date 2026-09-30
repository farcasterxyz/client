import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildAudioRoomParticipantsKey } from './buildAudioRoomParticipantsKey';

const useInvalidateAudioRoomParticipants = () => {
  const queryClient = useQueryClient();

  const invalidateAudioRoomParticipants = useCallback(
    ({ roomId }: { roomId: string }) => {
      return queryClient.invalidateQueries({
        queryKey: buildAudioRoomParticipantsKey({ roomId }),
      });
    },
    [queryClient],
  );

  return { invalidateAudioRoomParticipants };
};

export { useInvalidateAudioRoomParticipants };
