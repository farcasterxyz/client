import { ApiGetCastCollectibleQueryParams } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildCastCollectibleKey = (
  params: ApiGetCastCollectibleQueryParams,
): string[] =>
  compactQueryKey([
    'castCollectible',
    params.castHash,
    params.refresh,
  ]) as string[];

export { buildCastCollectibleKey };
