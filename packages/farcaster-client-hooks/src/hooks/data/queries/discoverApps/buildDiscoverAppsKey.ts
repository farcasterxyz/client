import {
  ApiDiscoveryAppCategory,
  ApiDiscoveryAppList,
} from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildDiscoverAppsKey = ({
  list,
  categoryFilter,
}: {
  list: ApiDiscoveryAppList;
  categoryFilter?: ApiDiscoveryAppCategory;
}) => compactQueryKey(['discoverApps', list, categoryFilter]);

export { buildDiscoverAppsKey };
