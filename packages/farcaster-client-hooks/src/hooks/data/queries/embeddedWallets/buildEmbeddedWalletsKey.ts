import { ApiListEmbeddedWalletsQueryParams } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildEmbeddedWalletsKey = ({
  includePrivate,
  scopeKey,
}: Partial<ApiListEmbeddedWalletsQueryParams> & {
  scopeKey?: string | number;
} = {}) =>
  compactQueryKey(['embeddedWallets', scopeKey, includePrivate]) as string[];

export { buildEmbeddedWalletsKey };
