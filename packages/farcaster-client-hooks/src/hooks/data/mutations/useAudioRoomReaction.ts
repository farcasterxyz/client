import { ApiAudioRoomReactionEmoji } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useAudioRoomReaction = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      roomId,
      emoji,
    }: {
      roomId: string;
      emoji: ApiAudioRoomReactionEmoji;
    }) => {
      const response = await apiClient.sendAudioRoomReaction({ roomId, emoji });
      return response.data.result;
    },
    [apiClient],
  );
};

export { useAudioRoomReaction };
