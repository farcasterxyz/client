import { ApiGetOnchainTokenCandlestickChartQueryParams } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildOnchainTokenCandlestickChartKey = (
  params: ApiGetOnchainTokenCandlestickChartQueryParams,
) =>
  compactQueryKey([
    'onchainTokenCandlestickChart',
    params.chain,
    params.ca,
    params.res,
    // This has 2 parts 2 it:
    // 1. Codex API expects the time in seconds, so keying off of params of milliseconds is unnecessary
    // 2. Using timestamps is painful to manage prefetching, use seconds instead to avoid one off issues
    Math.floor(params.from / 1000),
    Math.floor(params.to / 1000),
    params.countback,
  ]);

export { buildOnchainTokenCandlestickChartKey };
