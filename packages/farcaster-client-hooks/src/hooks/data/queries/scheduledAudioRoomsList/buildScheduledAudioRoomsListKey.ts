import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildScheduledAudioRoomsListKey = ({ limit }: { limit?: number }) =>
  compactQueryKey(['scheduledAudioRoomsList', limit]);

export { buildScheduledAudioRoomsListKey };
