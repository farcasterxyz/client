import { isProd } from '~/constants/env';

// Dev-only escape hatch: persist `farcasterApi.local` in localStorage to
// flip the API base from prod (`farcaster.xyz/~api`) to a backend running
// on `localhost:8080`. Use the helper from `init/initFarcasterApi.ts` —
// don't poke localStorage directly.
const STORAGE_KEY = 'farcasterApi.local';

function isLocalApiEnabled(): boolean {
  if (isProd) {
    return false;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  return window.localStorage.getItem(STORAGE_KEY) === 'true';
}

const useLocalApi = isLocalApiEnabled();

const baseApiHost = useLocalApi ? 'localhost:8080' : 'farcaster.xyz/~api';

const baseUseHttps = !useLocalApi;

const baseApiUrl = baseUseHttps
  ? `https://${baseApiHost}`
  : `http://${baseApiHost}`;

const wsUrl = useLocalApi
  ? `ws://${baseApiHost}/stream`
  : 'wss://ws.farcaster.xyz/stream';

export { baseApiHost, baseApiUrl, baseUseHttps, STORAGE_KEY, wsUrl };
