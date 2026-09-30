import { NetworkMode } from '@tanstack/react-query';

import { MILLIS_PER_HOUR } from '../../../..';

const feedSummariesDefaultQueryOptions = {
  staleTime: MILLIS_PER_HOUR,
  networkMode: 'offlineFirst' as NetworkMode,
};

export { feedSummariesDefaultQueryOptions };
