import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildAudioRoomFetcher } from './buildAudioRoomFetcher';
import { buildAudioRoomKey } from './buildAudioRoomKey';

const useAudioRoom = ({
  roomId,
  enabled = true,
  refetchIntervalMs = false,
}: {
  roomId: string;
  enabled?: boolean;
  refetchIntervalMs?: number | false;
}) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useQuery({
    queryKey: buildAudioRoomKey({ roomId }),
    queryFn: buildAudioRoomFetcher({ apiClient, roomId }),
    enabled: enabled && !!roomId,
    staleTime: 1000 * 5,
    gcTime: 1000 * 60,
    refetchInterval: refetchIntervalMs,
  });

  return result;
};

export { useAudioRoom };
