import { ApiGetConnectedAppsQueryParams } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildConnectedAppsKey = (params: ApiGetConnectedAppsQueryParams) =>
  compactQueryKey([
    'connectedAppssss',
    params.cursor,
    params.limit,
  ]) as string[];
