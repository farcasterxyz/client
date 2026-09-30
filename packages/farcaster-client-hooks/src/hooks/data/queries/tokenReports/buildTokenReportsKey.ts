import { ApiChain } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildTokenReportsKey = ({
  chain,
  ca,
}: {
  chain?: ApiChain;
  ca?: string;
}) => compactQueryKey(['tokenReports', chain, ca]);

export { buildTokenReportsKey };
