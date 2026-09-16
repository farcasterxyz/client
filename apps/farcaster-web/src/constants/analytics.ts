import {
  POSTHOG_API_HOST,
  POSTHOG_API_KEY_DEV,
  POSTHOG_API_KEY_PRODUCTION,
} from 'farcaster-analytics';

import { isProd } from '~/constants/env';

const posthogApiKey = isProd ? POSTHOG_API_KEY_PRODUCTION : POSTHOG_API_KEY_DEV;
const posthogApiHost = POSTHOG_API_HOST;

export { posthogApiHost, posthogApiKey };
