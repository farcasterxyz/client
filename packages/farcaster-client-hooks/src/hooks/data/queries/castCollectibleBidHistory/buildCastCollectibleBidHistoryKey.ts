import { ApiGetCastCollectibleBidHistoryQueryParams } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildCastCollectibleBidHistoryKey = (
  params: ApiGetCastCollectibleBidHistoryQueryParams,
) => compactQueryKey(['castCollectibleBidHistory', params]);

export { buildCastCollectibleBidHistoryKey };
