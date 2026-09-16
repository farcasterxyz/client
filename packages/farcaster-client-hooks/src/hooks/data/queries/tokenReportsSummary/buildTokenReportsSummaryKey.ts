import { ApiChain } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildTokenReportsSummaryKey = ({
  chain,
  ca,
}: {
  chain?: ApiChain;
  ca?: string;
}) => compactQueryKey(['tokenReportsSummary', chain, ca]);

export { buildTokenReportsSummaryKey };
