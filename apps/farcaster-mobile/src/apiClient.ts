import { FarcasterApiClient } from 'farcaster-client-data';

import { baseApiUrl, wsUrl } from './constants/Api';
import { isDev } from './constants/Env';

export const apiClient = new FarcasterApiClient({
  baseUrl: baseApiUrl,
  wsUrl: wsUrl,
  debug: isDev,
  timeoutRetryDecayFactor: 0.3,
});
