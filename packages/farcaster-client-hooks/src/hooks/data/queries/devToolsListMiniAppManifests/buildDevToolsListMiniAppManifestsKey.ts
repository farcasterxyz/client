import { ApiDevToolsListMiniAppManifestsQueryParams } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildDevToolsListMiniAppManifestsKey = (
  params?: Omit<ApiDevToolsListMiniAppManifestsQueryParams, 'cursor' | 'limit'>,
) => compactQueryKey(['devToolsListMiniAppManifests', params]);

export { buildDevToolsListMiniAppManifestsKey };
