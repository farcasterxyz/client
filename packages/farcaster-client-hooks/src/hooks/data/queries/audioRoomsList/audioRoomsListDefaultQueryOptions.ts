import { NetworkMode } from '@tanstack/react-query';

// Poll every 10s so the home-feed "Live now" pill picks up new rooms quickly.
// This is admin-only in v1 so the extra network traffic is negligible.
const audioRoomsListDefaultQueryOptions = {
  staleTime: 1000 * 5,
  gcTime: 1000 * 60,
  refetchInterval: 1000 * 10,
  refetchOnWindowFocus: true,
  networkMode: 'online' as NetworkMode,
};

export { audioRoomsListDefaultQueryOptions };
