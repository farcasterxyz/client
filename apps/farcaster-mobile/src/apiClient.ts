import { FarcasterApiClient } from 'farcaster-client-data';

import { baseApiUrl, wsUrl } from './constants/Api';
import { isDev } from './constants/Env';

export const apiClient = new FarcasterApiClient({
  baseUrl: baseApiUrl,
  wsUrl: wsUrl,
  debug: isDev,
  timeoutRetryDecayFactor: 0.3,
});

// The client's `isOffline` flag is kept in sync from the single NetInfo
// callback in ConnectionStatusProvider, which updates it before handing the
// same event to React Query's `setOnline`. It is deliberately not driven from
// here (nor from a React effect): React Query resumes paused fetches
// synchronously inside `setOnline`, so anything that races that ordering lets
// the first resumed attempt see a stale `isOffline:true` and burn a retry on an
// instant 'Offline' throw right as connectivity returns (NEYN-13137).
