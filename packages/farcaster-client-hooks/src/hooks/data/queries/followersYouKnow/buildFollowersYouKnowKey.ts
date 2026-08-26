import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildFollowersYouKnowKey = ({
  fid,
  limit,
}: {
  fid: number;
  limit: number;
}) => compactQueryKey(['followersYouKnow', fid, limit]);

export { buildFollowersYouKnowKey };
