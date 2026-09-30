import { FarcasterApiClient } from 'farcaster-client-data';

import { BatchMergeIntoGloballyCachedCasts } from '../../../../types';
import { wrapPaginatedFetcher } from '../../helpers';

const buildUserCastsAndRepliesFetcher = ({
  apiClient,
  batchMergeIntoGloballyCachedCasts,
  fid,
}: {
  apiClient: FarcasterApiClient;
  batchMergeIntoGloballyCachedCasts: BatchMergeIntoGloballyCachedCasts;
  fid: number;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getUserCastsAndReplies({
      cursor,
      fid,
      limit: 15,
    });

    // Populate the cast cache in addition to this specific query cache
    batchMergeIntoGloballyCachedCasts({
      batchUpdates: response.data.result.casts,
    });

    return response.data;
  });

export { buildUserCastsAndRepliesFetcher };
