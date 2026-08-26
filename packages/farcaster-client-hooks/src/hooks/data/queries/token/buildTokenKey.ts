import { ApiGetTokenQueryParams } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildTokenKey = ({ chain, ca, fid, address }: ApiGetTokenQueryParams) =>
  compactQueryKey(['token', { chain, ca }, fid, address]);

export { buildTokenKey };
