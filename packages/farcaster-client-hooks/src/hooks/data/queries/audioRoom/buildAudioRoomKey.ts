import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildAudioRoomKey = ({ roomId }: { roomId: string }) =>
  compactQueryKey(['audioRoom', roomId]);

export { buildAudioRoomKey };
