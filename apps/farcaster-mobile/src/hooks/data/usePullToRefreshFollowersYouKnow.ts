import { buildFollowersYouKnowKey } from 'farcaster-client-hooks';

import { usePullToRefreshInfiniteFirstPageOnly } from './usePullToRefreshInfiniteFirstPageOnly';

const usePullToRefreshFollowersYouKnow = ({
  fid,
  limit,
  refetch,
}: {
  fid: number;
  limit: number;
  refetch: () => Promise<unknown>;
}) => {
  return usePullToRefreshInfiniteFirstPageOnly(
    buildFollowersYouKnowKey({ fid, limit }),
    refetch,
  );
};

export { usePullToRefreshFollowersYouKnow };
