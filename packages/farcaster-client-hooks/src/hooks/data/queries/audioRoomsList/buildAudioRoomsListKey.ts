import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildAudioRoomsListKey = ({ limit }: { limit?: number }) =>
  compactQueryKey(['audioRoomsList', limit]);

export { buildAudioRoomsListKey };
