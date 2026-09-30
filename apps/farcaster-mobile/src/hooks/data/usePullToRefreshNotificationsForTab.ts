import { buildNotificationsForTabKey } from 'farcaster-client-hooks';

import { usePullToRefreshInfiniteFirstPageOnly } from './usePullToRefreshInfiniteFirstPageOnly';

const usePullToRefreshNotificationsForTab = ({
  tab,
  refetch,
}: {
  tab: string;
  refetch: () => Promise<unknown>;
}) => {
  return usePullToRefreshInfiniteFirstPageOnly(
    buildNotificationsForTabKey({ tab }),
    refetch,
  );
};

export { usePullToRefreshNotificationsForTab };
