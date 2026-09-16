import appCheck from '@react-native-firebase/app-check';
import { Platform } from 'react-native';

import { logErrorInDevOnly } from '~/utils/LogUtils';

const FIREBASE_APP_CHECK_HEADER = 'X-Firebase-AppCheck';
// Register this token in Firebase App Check before using debug builds for local API testing.
const DEBUG_TOKEN = process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN;

const TOKEN_REFRESH_GRACE_MS = 2 * 60_000;
const TOKEN_FETCH_TIMEOUT_MS = 1_500;
// Backoff doubles per consecutive failure so a permanently-broken Play
// Integrity attestation stops hammering after a few rounds.
const TOKEN_FAILURE_COOLDOWN_BASE_MS = 60_000;
const TOKEN_FAILURE_COOLDOWN_MAX_MS = 60 * 60_000;
const FALLBACK_TOKEN_TTL_MS = 30 * 60_000;

let initializePromise: Promise<void> | undefined;
let lastLoggedErrorAt = 0;
let cachedHeader:
  | {
      headers: Record<string, string>;
      expiresAt: number;
    }
  | undefined;
let inFlightTokenPromise:
  | Promise<Record<string, string> | undefined>
  | undefined;
let failureCooldownUntil = 0;
let consecutiveFailures = 0;
// Idempotent per in-flight attempt so a timeout caller and the underlying
// promise's .catch cannot both grow consecutiveFailures for the same failure.
let attemptHasAppliedCooldown = false;
// Once a caller gave up via the 1.5s timeout, a late success from the same
// attempt must not erase the cooldown the timeout already applied.
let attemptDidTimeOut = false;

function applyFailureCooldownOnce(): void {
  if (attemptHasAppliedCooldown) {
    return;
  }
  attemptHasAppliedCooldown = true;
  consecutiveFailures += 1;
  const backoff = Math.min(
    TOKEN_FAILURE_COOLDOWN_BASE_MS * 2 ** (consecutiveFailures - 1),
    TOKEN_FAILURE_COOLDOWN_MAX_MS,
  );
  failureCooldownUntil = Date.now() + backoff;
}

function clearFailureCooldown(): void {
  consecutiveFailures = 0;
  failureCooldownUntil = 0;
  attemptHasAppliedCooldown = false;
  attemptDidTimeOut = false;
}

function shouldUseDebugProvider(): boolean {
  return Boolean(DEBUG_TOKEN);
}

function getProvider() {
  const provider = appCheck().newReactNativeFirebaseAppCheckProvider();
  provider.configure({
    apple: {
      provider: shouldUseDebugProvider() ? 'debug' : 'appAttest',
      debugToken: DEBUG_TOKEN,
    },
    android: {
      provider: shouldUseDebugProvider() ? 'debug' : 'playIntegrity',
      debugToken: DEBUG_TOKEN,
    },
    isTokenAutoRefreshEnabled: true,
  });
  return provider;
}

function logErrorOncePerMinute(error: unknown): void {
  const now = Date.now();
  if (now - lastLoggedErrorAt < 60_000) return;

  lastLoggedErrorAt = now;
  logErrorInDevOnly(
    '[MobileClientIntegrity] Failed to get Firebase App Check token',
    error,
  );
}

function readExpiry(tokenResult: unknown): number | undefined {
  const maybe = tokenResult as { expireTimeMillis?: unknown };
  return typeof maybe.expireTimeMillis === 'number'
    ? maybe.expireTimeMillis
    : undefined;
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T | 'timed_out'> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<'timed_out'>((resolve) => {
    timeoutId = setTimeout(() => resolve('timed_out'), timeoutMs);
  });
  const settled = promise.finally(() => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  });
  return Promise.race([settled, timeoutPromise]);
}

async function fetchFreshHeader(): Promise<Record<string, string> | undefined> {
  initializePromise ??= appCheck()
    .initializeAppCheck({
      provider: getProvider(),
      isTokenAutoRefreshEnabled: true,
    })
    .catch((error) => {
      initializePromise = undefined;
      throw error;
    });

  await initializePromise;
  const tokenResult = await appCheck().getToken();

  if (!tokenResult.token) {
    return undefined;
  }

  const headers = {
    [FIREBASE_APP_CHECK_HEADER]: tokenResult.token,
  };

  cachedHeader = {
    headers,
    expiresAt: readExpiry(tokenResult) ?? Date.now() + FALLBACK_TOKEN_TTL_MS,
  };

  return headers;
}

// Records the authoritative outcome for the in-flight attempt: a timely
// success clears the cooldown; a *late* success (after a caller already
// timed out) only populates the cache and preserves the cooldown the
// timeout applied. Also swallows late rejections so they don't surface as
// unhandled promise rejections.
function startInFlightFetch(): Promise<Record<string, string> | undefined> {
  return fetchFreshHeader()
    .then((headers) => {
      if (headers) {
        if (!attemptDidTimeOut) {
          clearFailureCooldown();
        }
      } else {
        applyFailureCooldownOnce();
      }
      return headers;
    })
    .catch((error) => {
      applyFailureCooldownOnce();
      logErrorOncePerMinute(error);
      return undefined;
    })
    .finally(() => {
      inFlightTokenPromise = undefined;
    });
}

export class MobileClientIntegrityService {
  static async getRequestHeaders(): Promise<
    Record<string, string> | undefined
  > {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      return undefined;
    }

    const now = Date.now();

    if (cachedHeader && cachedHeader.expiresAt - now > TOKEN_REFRESH_GRACE_MS) {
      return cachedHeader.headers;
    }

    if (now < failureCooldownUntil) {
      return undefined;
    }

    if (!inFlightTokenPromise) {
      attemptHasAppliedCooldown = false;
      attemptDidTimeOut = false;
      inFlightTokenPromise = startInFlightFetch();
    }

    const result = await withTimeout(
      inFlightTokenPromise,
      TOKEN_FETCH_TIMEOUT_MS,
    );

    if (result === 'timed_out') {
      attemptDidTimeOut = true;
      applyFailureCooldownOnce();
      return undefined;
    }

    return result ?? undefined;
  }
}
