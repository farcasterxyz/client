import { compactQueryKey } from '../../../../utils/QueryUtils';

export const buildOgFeedItemsKey = ({ feedKey }: { feedKey: string }) =>
  compactQueryKey(['ogFeedItems', feedKey]);
