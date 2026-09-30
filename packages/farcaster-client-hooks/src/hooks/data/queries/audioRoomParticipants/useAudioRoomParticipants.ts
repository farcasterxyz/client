import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { audioRoomParticipantsDefaultQueryOptions } from './audioRoomParticipantsDefaultQueryOptions';
import { buildAudioRoomParticipantsFetcher } from './buildAudioRoomParticipantsFetcher';
import { buildAudioRoomParticipantsKey } from './buildAudioRoomParticipantsKey';

const useAudioRoomParticipants = ({
  roomId,
  enabled = true,
  includePast = false,
}: {
  roomId: string;
  enabled?: boolean;
  includePast?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    ...audioRoomParticipantsDefaultQueryOptions,
    queryKey: buildAudioRoomParticipantsKey({ roomId, includePast }),
    queryFn: buildAudioRoomParticipantsFetcher({
      apiClient,
      roomId,
      includePast,
    }),
    enabled: enabled && !!roomId,
  });
};

export { useAudioRoomParticipants };
