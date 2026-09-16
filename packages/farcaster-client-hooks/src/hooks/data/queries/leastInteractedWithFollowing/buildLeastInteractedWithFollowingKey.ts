import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildLeastInteractedWithFollowingKey = () =>
  compactQueryKey(['leastInteractedWithFollowing']);

export { buildLeastInteractedWithFollowingKey };
