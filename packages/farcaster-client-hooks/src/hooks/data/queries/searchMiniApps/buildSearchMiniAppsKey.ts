import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildSearchMiniAppsKey = ({
  limit,
  query,
}: {
  limit: number | undefined;
  query: string;
}) => compactQueryKey(['searchMiniApps', query, limit]);
