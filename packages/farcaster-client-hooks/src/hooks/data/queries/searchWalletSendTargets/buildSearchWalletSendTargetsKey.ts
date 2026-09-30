import { ApiSearchWalletSendTargetsQueryParamsCamelCase } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildSearchWalletSendTargetsKey = ({
  query,
  limit,
  cursor,
  protocol,
}: ApiSearchWalletSendTargetsQueryParamsCamelCase) =>
  compactQueryKey(['searchWalletSendTargets', query, cursor, limit, protocol]);

export { buildSearchWalletSendTargetsKey };
