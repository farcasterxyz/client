import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildRecentlyUsedAppsKey = ({ limit }: { limit?: number }) =>
  compactQueryKey(['recentlyUsedApps', limit]);

export { buildRecentlyUsedAppsKey };
