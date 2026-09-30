import * as SecureStore from 'expo-secure-store';
import { type ApiGetOnboardingState200Response } from 'farcaster-client-data';

const ENDPOINT_URL = 'https://client.farcaster.xyz/v2/onboarding-state';

/**
 * Performs early auth token validation. Should be called as early as possible, before the app initializes.
 *
 * This is an optimization that can save 200+ ms during app startup by allowing the navigation stack
 * to load without waiting for token validation inside the JS bundle.
 *
 * In most cases, the validation request will complete by the time the navigation stack is rendered.
 *
 * Use the async SecureStore API here. The synchronous `getItem` performs a
 * blocking Android Keystore read on the calling thread at bundle-eval time
 * (before the first frame), which can stall for hundreds of ms to seconds and
 * surface as a frame-less app-launch ANR. `getItemAsync` keeps the read off the
 * main thread; the validation fetch still kicks off as early as possible.
 */
export const preloadedOnboardingStatePromise: Promise<
  ApiGetOnboardingState200Response | undefined
> = (async () => {
  try {
    const authToken = await SecureStore.getItemAsync(
      __DEV__ ? 'auth-token-dev' : 'auth-token',
    );

    if (authToken) {
      const { secret } = JSON.parse(authToken);
      const controller = new AbortController();
      const abort = setTimeout(() => {
        controller.abort();
      }, 15000);

      try {
        const response = await fetch(ENDPOINT_URL, {
          headers: {
            Authorization: `Bearer ${secret}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        if (response.ok) {
          return await response.json();
        }
      } finally {
        clearTimeout(abort);
      }
    }
  } catch (error) {
    // AbortError is expected — thrown when the 15 s timeout fires or the
    // request is cancelled during app teardown. Skip logging it to avoid
    // a spurious LogBox red overlay in dev builds.
    if (__DEV__ && (error as Error)?.name !== 'AbortError') {
      // eslint-disable-next-line no-console
      console.error('preloaded onboarding state error', error);
    }
  }

  return undefined;
})();
