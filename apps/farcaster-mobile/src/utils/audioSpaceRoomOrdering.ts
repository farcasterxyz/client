import type { ApiAudioRoom } from 'farcaster-client-data';

const partitionVisibleRoomsByFollowStatus = (
  rooms: ApiAudioRoom[] | undefined,
): { followedHosts: ApiAudioRoom[]; remainingRooms: ApiAudioRoom[] } => {
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

  return { followedHosts, remainingRooms };
};

export const prioritizeFollowedHostsAndFilterBlockedHosts = (
  rooms: ApiAudioRoom[] | undefined,
): ApiAudioRoom[] => {
  const { followedHosts, remainingRooms } =
    partitionVisibleRoomsByFollowStatus(rooms);
  return [...followedHosts, ...remainingRooms];
};

const byListenerCountDesc = (a: ApiAudioRoom, b: ApiAudioRoom) =>
  b.listenerCount - a.listenerCount;

export const rankLiveSpacesForFeedStrip = (
  rooms: ApiAudioRoom[] | undefined,
): ApiAudioRoom[] => {
  const { followedHosts, remainingRooms } =
    partitionVisibleRoomsByFollowStatus(rooms);

  followedHosts.sort(byListenerCountDesc);
  remainingRooms.sort(byListenerCountDesc);

  return [...followedHosts, ...remainingRooms];
};
