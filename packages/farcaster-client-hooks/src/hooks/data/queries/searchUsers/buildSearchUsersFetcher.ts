import {
  ApiSearchUsers200Response,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedUsers } from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';
import { defaultLimit } from './shared';

const buildSearchUsersFetcher = ({
  q,
  excludeSelf,
  prioritizeFids,
  includeDirectCastAbility = false,
  limit = defaultLimit,
  apiClient,
  batchMergeIntoGloballyCachedUsers,
}: {
  q: string;
  excludeSelf?: boolean;
  prioritizeFids?: number[];
  includeDirectCastAbility?: boolean;
  limit?: number;
  apiClient: FarcasterApiClient;
  batchMergeIntoGloballyCachedUsers: BatchMergeIntoGloballyCachedUsers;
}) =>
  wrapPaginatedFetcher(
    async ({ pageParam: cursor }): Promise<ApiSearchUsers200Response> => {
      if (q.trim().length === 0) {
        return { result: { users: [] } };
      }

      const response = await apiClient.searchUsers({
        cursor,
        q,
        excludeSelf,
        prioritizeFids: prioritizeFids ? prioritizeFids.join(',') : undefined,
        limit,
        includeDirectCastAbility,
      });

      batchMergeIntoGloballyCachedUsers({
        batchUpdates: response.data.result.users,
      });

      return response.data;
    },
  );

export { buildSearchUsersFetcher };
