import { ApiGetConnectedAppQueryParams } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildConnectedAppKey = (params: ApiGetConnectedAppQueryParams) =>
  compactQueryKey(['connectedApp', params.appFid]) as string[];
