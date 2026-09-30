import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildAudioRoomChatKey } from './buildAudioRoomChatKey';

const useInvalidateAudioRoomChat = () => {
  const queryClient = useQueryClient();

  const invalidateAudioRoomChat = useCallback(
    ({ roomId }: { roomId: string }) => {
      return queryClient.invalidateQueries({
        queryKey: buildAudioRoomChatKey({ roomId }),
      });
    },
    [queryClient],
  );

  return { invalidateAudioRoomChat };
};

export { useInvalidateAudioRoomChat };
