import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildAudioRoomChatKey = ({
  roomId,
  limit,
}: {
  roomId: string;
  limit?: number;
}) => compactQueryKey(['audioRoomChat', roomId, limit]);

export { buildAudioRoomChatKey };
