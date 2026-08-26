import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildFeedItemsKey = ({
  feedKey,
  feedType,
  sortMode,
  seedCastHash,
}: {
  feedKey?: string;
  feedType?: string;
  sortMode?: string;
  seedCastHash?: string;
}) => compactQueryKey(['feedItems', feedKey, feedType, sortMode, seedCastHash]);

export { buildFeedItemsKey };
