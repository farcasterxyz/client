import { CastHashPrefix } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildUserCastKey = ({
  username,
  hashPrefix,
}: {
  username: string | undefined;
  hashPrefix: CastHashPrefix | undefined;
}) => compactQueryKey(['userCast', username, hashPrefix]);

export { buildUserCastKey };
