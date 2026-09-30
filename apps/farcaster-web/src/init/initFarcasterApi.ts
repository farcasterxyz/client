import { STORAGE_KEY } from '~/constants/api';
import { isProd } from '~/constants/env';

// Browser-console toggle for the Farcaster API base URL. The flag is read
// once at module load by `constants/api.ts`, so callers must reload after
// flipping. Hidden in prod builds.
//
//   farcasterApi.setLocal()   → localhost:8080, ws://...
//   farcasterApi.setRemote()  → farcaster.xyz/~api, wss://...
//   farcasterApi.status()
export function initFarcasterApi(): void {
  if (typeof window === 'undefined') {
    return;
  }
  if (isProd) {
    return;
  }

  const helper = {
    isLocal: () => window.localStorage.getItem(STORAGE_KEY) === 'true',
    status: () => ({
      mode: helper.isLocal() ? 'local' : 'remote',
      reloadRequired: 'reload to apply',
    }),
    setLocal: () => {
      window.localStorage.setItem(STORAGE_KEY, 'true');
      // eslint-disable-next-line no-console
      console.log('farcasterApi → local (localhost:8080) — reload to apply');
    },
    setRemote: () => {
      window.localStorage.removeItem(STORAGE_KEY);
      // eslint-disable-next-line no-console
      console.log(
        'farcasterApi → remote (farcaster.xyz/~api) — reload to apply',
      );
    },
  };

  (window as unknown as { farcasterApi: typeof helper }).farcasterApi = helper;
}
