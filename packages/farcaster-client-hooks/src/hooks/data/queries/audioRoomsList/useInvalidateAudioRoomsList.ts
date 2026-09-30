import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

const useInvalidateAudioRoomsList = () => {
  const queryClient = useQueryClient();

  const invalidateAudioRoomsList = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: ['audioRoomsList'] });
  }, [queryClient]);

  return { invalidateAudioRoomsList };
};

export { useInvalidateAudioRoomsList };
