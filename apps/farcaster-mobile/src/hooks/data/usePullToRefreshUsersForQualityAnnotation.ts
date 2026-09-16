import { buildUsersForQualityAnnotationKey } from 'farcaster-client-hooks';

import { usePullToRefreshInfiniteFirstPageOnly } from './usePullToRefreshInfiniteFirstPageOnly';

const usePullToRefreshUsersForQualityAnnotation = ({
  refetch,
}: {
  refetch: () => Promise<unknown>;
}) => {
  return usePullToRefreshInfiniteFirstPageOnly(
    buildUsersForQualityAnnotationKey(),
    refetch,
  );
};

export { usePullToRefreshUsersForQualityAnnotation };
