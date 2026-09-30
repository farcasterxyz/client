import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildUserKey = ({
  fid,
  isCurrentUser = false,
}: {
  fid?: number;
  isCurrentUser?: boolean;
}) => compactQueryKey([isCurrentUser ? 'currentUser' : 'user', fid]);

export { buildUserKey };
