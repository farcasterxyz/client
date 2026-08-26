import { QueryKey } from '@tanstack/react-query';
import { ApiGetTopMiniAppsQueryParams } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildTopMiniAppsKey = (
  params: Partial<ApiGetTopMiniAppsQueryParams> = {},
): QueryKey => compactQueryKey(['topMiniApps', params.cursor, params.limit]);
