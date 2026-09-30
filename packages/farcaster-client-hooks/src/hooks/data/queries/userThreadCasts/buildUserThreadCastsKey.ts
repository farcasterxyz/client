import { CastHashPrefix } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildUserThreadCastsKey = ({
  castHashPrefix,
  username,
}: {
  castHashPrefix: CastHashPrefix | undefined;
  username: string | undefined;
}) => compactQueryKey(['userThreadCasts', username, castHashPrefix]);

export { buildUserThreadCastsKey };
