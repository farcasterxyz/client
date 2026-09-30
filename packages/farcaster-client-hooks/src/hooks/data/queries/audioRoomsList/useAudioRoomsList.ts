import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { audioRoomsListDefaultQueryOptions } from './audioRoomsListDefaultQueryOptions';
import { buildAudioRoomsListFetcher } from './buildAudioRoomsListFetcher';
import { buildAudioRoomsListKey } from './buildAudioRoomsListKey';

const useAudioRoomsList = ({
  limit,
  enabled = true,
}: {
  limit?: number;
  enabled?: boolean;
} = {}) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useQuery({
    ...audioRoomsListDefaultQueryOptions,
    queryKey: buildAudioRoomsListKey({ limit }),
    queryFn: buildAudioRoomsListFetcher({ apiClient, limit }),
    enabled,
  });

  return result;
};

export { useAudioRoomsList };
