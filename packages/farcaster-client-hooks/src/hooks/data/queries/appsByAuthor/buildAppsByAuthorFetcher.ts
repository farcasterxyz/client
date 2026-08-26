import { FarcasterApiClient } from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

const buildAppsByAuthorFetcher = ({
  apiClient,
  fid,
}: {
  apiClient: FarcasterApiClient;
  fid: number;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getAppsByAuthor({
      cursor,
      fid,
      limit: 25,
    });

    return {
      items: response.data.result.frames,
      next: response.data.next,
    };
  });

export { buildAppsByAuthorFetcher };
