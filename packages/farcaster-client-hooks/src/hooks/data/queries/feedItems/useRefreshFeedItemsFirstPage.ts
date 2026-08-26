import { useRefreshInfiniteFirstPageOnly } from '../../helpers';
import { buildFeedItemsKey } from './buildFeedItemsKey';

const useRefreshFeedItemsFirstPage = (
  feedKey: string,
  feedType: string,
  refetch: () => Promise<unknown>,
) => {
  return useRefreshInfiniteFirstPageOnly(
    buildFeedItemsKey({ feedKey, feedType }),
    refetch,
  );
};

export { useRefreshFeedItemsFirstPage };
