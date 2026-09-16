import type { ApiAudioRoom } from 'farcaster-client-data';

export const prioritizeFollowedHostsAndFilterBlockedHosts = (
  rooms: ApiAudioRoom[] | undefined,
): ApiAudioRoom[] => {
  const followedHosts: ApiAudioRoom[] = [];
  const remainingRooms: ApiAudioRoom[] = [];

  for (const room of rooms ?? []) {
    if (
      room.host.viewerContext?.invisible ||
      room.host.viewerContext?.blocking
    ) {
      continue;
    }

    if (room.host.viewerContext?.following) {
      followedHosts.push(room);
      continue;
    }

    remainingRooms.push(room);
  }

  return [...followedHosts, ...remainingRooms];
};
