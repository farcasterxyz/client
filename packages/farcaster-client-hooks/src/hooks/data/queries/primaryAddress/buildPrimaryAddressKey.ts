import { ApiGetPrimaryAddressQueryParams } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildPrimaryAddressKey = (
  params: Partial<ApiGetPrimaryAddressQueryParams> = {},
) => compactQueryKey(['primaryAddress', params.fid]) as string[];
