import { NetworkMode } from '@tanstack/react-query';

const scheduledAudioRoomsListDefaultQueryOptions = {
  staleTime: 1000 * 30,
  gcTime: 1000 * 60 * 5,
  refetchOnWindowFocus: true,
  networkMode: 'online' as NetworkMode,
};

export { scheduledAudioRoomsListDefaultQueryOptions };
