import {
  ApiDiscoveryFrameCategory,
  ApiDiscoveryFrameList,
} from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildDiscoverFramesKey = ({
  list,
  categoryFilter,
}: {
  list: ApiDiscoveryFrameList;
  categoryFilter?: ApiDiscoveryFrameCategory;
}) => compactQueryKey(['discoverFrames', list, categoryFilter]);

export { buildDiscoverFramesKey };
