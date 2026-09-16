import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildAudioRoomKey } from './buildAudioRoomKey';

const useInvalidateAudioRoom = () => {
  const queryClient = useQueryClient();

  const invalidateAudioRoom = useCallback(
    ({ roomId }: { roomId: string }) => {
      return queryClient.invalidateQueries({
        queryKey: buildAudioRoomKey({ roomId }),
      });
    },
    [queryClient],
  );

  return { invalidateAudioRoom };
};

export { useInvalidateAudioRoom };
