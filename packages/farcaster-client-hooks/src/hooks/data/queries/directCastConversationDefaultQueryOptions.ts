import { NetworkMode } from '@tanstack/react-query';

import { MILLIS_PER_MINUTE } from '../../..';

/**
 * Shared default query options for all direct cast conversation queries.
 * This ensures consistent caching behavior across messages, recent messages,
 * and historical messages queries.
 */
const directCastConversationDefaultQueryOptions = {
  staleTime: MILLIS_PER_MINUTE,
  networkMode: 'offlineFirst' as NetworkMode,
};

export { directCastConversationDefaultQueryOptions };
