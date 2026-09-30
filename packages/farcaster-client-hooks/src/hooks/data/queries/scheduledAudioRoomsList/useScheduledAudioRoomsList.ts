import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildScheduledAudioRoomsListFetcher } from './buildScheduledAudioRoomsListFetcher';
import { buildScheduledAudioRoomsListKey } from './buildScheduledAudioRoomsListKey';
import { scheduledAudioRoomsListDefaultQueryOptions } from './scheduledAudioRoomsListDefaultQueryOptions';

const useScheduledAudioRoomsList = ({
  limit,
  enabled = true,
}: {
  limit?: number;
  enabled?: boolean;
} = {}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    ...scheduledAudioRoomsListDefaultQueryOptions,
    queryKey: buildScheduledAudioRoomsListKey({ limit }),
    queryFn: buildScheduledAudioRoomsListFetcher({ apiClient, limit }),
    enabled,
  });
};

export { useScheduledAudioRoomsList };
