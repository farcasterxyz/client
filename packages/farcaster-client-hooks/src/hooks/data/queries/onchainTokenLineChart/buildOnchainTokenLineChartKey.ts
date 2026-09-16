import {
  ApiChain,
  ApiFid,
  ApiOnchainTokenChartPeriod,
} from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildOnchainTokenLineChartKey = ({
  fid,
  chain,
  ca,
  period,
}: {
  fid?: ApiFid;
  chain: ApiChain;
  ca: string;
  period: ApiOnchainTokenChartPeriod;
}) => compactQueryKey(['onchainTokenLineChart', fid, chain, ca, period]);

export { buildOnchainTokenLineChartKey };
