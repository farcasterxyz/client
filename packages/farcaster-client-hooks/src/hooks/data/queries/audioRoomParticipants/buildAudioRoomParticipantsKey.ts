import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildAudioRoomParticipantsKey = ({
  roomId,
  includePast,
}: {
  roomId?: string;
  includePast?: boolean;
}) =>
  compactQueryKey([
    'audioRoomParticipants',
    roomId,
    includePast ? includePast : undefined,
  ]);

export { buildAudioRoomParticipantsKey };
