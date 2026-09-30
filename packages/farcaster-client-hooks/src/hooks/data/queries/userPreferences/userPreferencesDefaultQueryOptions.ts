import { NetworkMode } from '@tanstack/react-query';

import { MILLIS_PER_DAY } from '../../../..';

const userPreferencesDefaultQueryOptions = {
  staleTime: MILLIS_PER_DAY,
  networkMode: 'offlineFirst' as NetworkMode,
};

export { userPreferencesDefaultQueryOptions };
