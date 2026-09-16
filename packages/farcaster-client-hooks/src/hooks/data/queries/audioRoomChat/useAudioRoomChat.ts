import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildAudioRoomChatFetcher } from './buildAudioRoomChatFetcher';
import { buildAudioRoomChatKey } from './buildAudioRoomChatKey';

const useAudioRoomChat = ({
  roomId,
  limit,
  enabled = true,
}: {
  roomId: string;
  limit?: number;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useQuery({
    queryKey: buildAudioRoomChatKey({ roomId, limit }),
    queryFn: buildAudioRoomChatFetcher({ apiClient, roomId, limit }),
    enabled: enabled && !!roomId,
    // Chat is "near real-time": keep results fresh and poll while mounted so
    // incoming messages appear without requiring a local send action.
    staleTime: 1000 * 3,
    refetchInterval: enabled && !!roomId ? 1000 * 3 : false,
    refetchIntervalInBackground: false,
    gcTime: 1000 * 60,
  });

  return result;
};

export { useAudioRoomChat };
