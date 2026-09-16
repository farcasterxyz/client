import { ApiTrendingTopicCastsSort } from 'farcaster-client-data';

import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildTrendingTopicCastsKey = ({
  topicId,
  sort,
}: {
  topicId: string;
  sort: ApiTrendingTopicCastsSort;
}) => compactQueryKey(['trendingTopicCasts', topicId, sort]);

export { buildTrendingTopicCastsKey };
