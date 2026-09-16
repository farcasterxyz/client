import { ApiGetCastCollectiblesIndexQueryParams } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildCastCollectiblesIndexKey = ({
  key,
  ...rest
}: ApiGetCastCollectiblesIndexQueryParams) =>
  compactQueryKey(['castCollectiblesIndex', key, rest]) as string[];

export { buildCastCollectiblesIndexKey };
