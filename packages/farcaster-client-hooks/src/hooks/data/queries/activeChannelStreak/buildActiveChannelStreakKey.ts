import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildActiveChannelStreakKey = ({ fid }: { fid: number }) =>
  compactQueryKey(['activeChannelStreak', fid]);

export { buildActiveChannelStreakKey };
