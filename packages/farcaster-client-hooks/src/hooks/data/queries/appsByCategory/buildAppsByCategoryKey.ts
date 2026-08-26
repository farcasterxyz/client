import { ApiAppsSortBy } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildAppsByCategoryKey = ({
  category,
  sortByKey,
  limit,
}: {
  category: string;
  sortByKey: ApiAppsSortBy;
  limit?: number;
}) => compactQueryKey(['appsByCategory', category, sortByKey, limit]);

export { buildAppsByCategoryKey };
