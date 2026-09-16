import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildDirectCastUsersKey = ({
  q,
  excludeFids,
}: {
  q: string;
  excludeFids?: number[];
}) =>
  compactQueryKey([
    'directCastUsers',
    q,
    excludeFids ? excludeFids.join(',') : undefined,
  ]);

export { buildDirectCastUsersKey };
