import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildUserCastsAndRepliesKey = ({ fid }: { fid: number | undefined }) =>
  compactQueryKey(['userCastsAndReplies', fid]);

export { buildUserCastsAndRepliesKey };
