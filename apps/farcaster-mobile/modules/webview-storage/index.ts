import { requireNativeModule } from 'expo-modules-core';

type FarcasterWebViewStorageModule = {
  /**
   * Wipes WebView storage natively and resolves whether the wipe was
   * *complete*. Android returns false on old system WebViews that lack
   * DELETE_BROWSING_DATA (its fallback cannot guarantee IndexedDB /
   * CacheStorage); iOS always returns true.
   */
  clearAll(): Promise<boolean>;
};

/** Result of {@link clearAllWebViewStorage}. */
type WebViewWipeResult = {
  /**
   * True only when every WebView-backed store was cleared. False means a
   * partial wipe (an old Android system WebView) — callers must treat this as a
   * failed account-isolation boundary, not a success.
   */
  complete: boolean;
};

const CLEAR_TIMEOUT_MS = 10_000;
// Retries cover a transient native failure or a timeout — not a partial wipe,
// which is a settled capability of the installed WebView and will not change on
// retry.
const CLEAR_MAX_ATTEMPTS = 3;
const TIMEOUT_ERROR_NAME = 'WebViewStorageTimeoutError';

let FarcasterWebViewStorage: FarcasterWebViewStorageModule | null = null;

try {
  FarcasterWebViewStorage = requireNativeModule<FarcasterWebViewStorageModule>(
    'FarcasterWebViewStorage',
  );
} catch {
  FarcasterWebViewStorage = null;
}

/**
 * Whether the native module is present in this binary. False when newer JS is
 * running over a native build that predates the module (i.e. an OTA update).
 */
function isWebViewStorageClearingSupported(): boolean {
  return FarcasterWebViewStorage !== null;
}

// One native clearAll attempt, bounded by a timeout. The native clear is not
// cancellable, so on timeout it is orphaned, not stopped. That is safe: a late
// completion can only *remove* data, so the worst case is that a mini app the
// next account already reopened gets re-wiped and re-authenticates — it can
// never leak one account's session to another.
async function clearAllOnce(
  mod: FarcasterWebViewStorageModule,
): Promise<boolean> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(
        `Timed out clearing WebView storage after ${CLEAR_TIMEOUT_MS}ms`,
      );
      error.name = TIMEOUT_ERROR_NAME;
      reject(error);
    }, CLEAR_TIMEOUT_MS);
  });

  try {
    return await Promise.race([mod.clearAll(), timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Wipes every WebView-backed data store — cookies, local storage, session
 * storage, IndexedDB, CacheStorage, service workers and the HTTP cache.
 *
 * Mini apps persist their own auth (SIWF / Quick Auth tokens and backend
 * session cookies) in WebView storage, none of it keyed by FID, so this must
 * run whenever the active Farcaster account changes. Returns whether the wipe
 * was complete; the caller must gate account switching on `complete === true`
 * rather than treating a partial wipe as success. Retries a transient native
 * failure / timeout, then throws — never resolves quietly on failure, since a
 * silent no-op would leave the previous FID's credentials readable.
 */
async function clearAllWebViewStorage(): Promise<WebViewWipeResult> {
  if (!FarcasterWebViewStorage) {
    throw new Error(
      'FarcasterWebViewStorage native module is unavailable in this binary',
    );
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= CLEAR_MAX_ATTEMPTS; attempt += 1) {
    try {
      const complete = await clearAllOnce(FarcasterWebViewStorage);
      // A partial result is terminal — retrying cannot upgrade the installed
      // WebView's capability — so return it rather than burning attempts.
      return { complete };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/**
 * Maps a {@link clearAllWebViewStorage} rejection to a distinct tracked-error
 * name, so error monitoring separates the failure modes: JS shipped over a
 * binary without the native module (OTA mismatch), the native clear timing out
 * / being abandoned, and a genuine native failure. Shared by every caller so
 * the buckets stay consistent.
 */
function webViewStorageClearErrorName(error: unknown): string {
  // Checked first: an absent module rejects synchronously, before any timeout.
  if (!isWebViewStorageClearingSupported()) {
    return 'ClearWebViewStorageUnsupportedError';
  }
  if (error instanceof Error && error.name === TIMEOUT_ERROR_NAME) {
    return 'ClearWebViewStorageTimeoutError';
  }
  return 'ClearWebViewStorageError';
}

export {
  clearAllWebViewStorage,
  isWebViewStorageClearingSupported,
  webViewStorageClearErrorName,
};
export type { WebViewWipeResult };
