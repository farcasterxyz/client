import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildScheduledAudioRoomsListKey } from './buildScheduledAudioRoomsListKey';

const useInvalidateScheduledAudioRoomsList = () => {
  const queryClient = useQueryClient();

  const invalidateScheduledAudioRoomsList = useCallback(
    ({ limit }: { limit?: number } = {}) => {
      return queryClient.invalidateQueries({
        queryKey: buildScheduledAudioRoomsListKey({ limit }),
      });
    },
    [queryClient],
  );

  return { invalidateScheduledAudioRoomsList };
};

export { useInvalidateScheduledAudioRoomsList };
