import {
  ApiChain,
  ApiTokenSourcePlatforms,
  ApiTrendingTokensAmountMinimums,
  ApiTrendingTokensSortBy,
  ApiTrendingTokensSortOrder,
  ApiTrendingTokensTimeWindow,
} from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildTrendingTokensKey = ({
  chain,
  platforms,
  minLiquidity,
  hasCreatorData,
  sortBy,
  sortOrder,
  timeWindow = '6h',
  limit,
  codex,
}: {
  chain?: ApiChain;
  platforms?: ApiTokenSourcePlatforms;
  minLiquidity?: ApiTrendingTokensAmountMinimums;
  hasCreatorData?: boolean;
  sortBy?: ApiTrendingTokensSortBy;
  sortOrder?: ApiTrendingTokensSortOrder;
  timeWindow?: ApiTrendingTokensTimeWindow;
  limit?: number;
  codex?: boolean;
}) =>
  compactQueryKey([
    'trendingTokens',
    chain,
    platforms,
    minLiquidity,
    hasCreatorData,
    sortBy,
    sortOrder,
    timeWindow,
    limit,
    codex,
  ]);

export { buildTrendingTokensKey };
