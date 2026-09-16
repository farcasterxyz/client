import { NetworkMode } from '@tanstack/react-query';

// Poll every 5s to keep the participant list fresh while in a room.
const audioRoomParticipantsDefaultQueryOptions = {
  staleTime: 1000 * 3,
  gcTime: 1000 * 60,
  refetchInterval: 1000 * 5,
  refetchOnWindowFocus: true,
  networkMode: 'online' as NetworkMode,
};

export { audioRoomParticipantsDefaultQueryOptions };
