import {
  isFarcasterApiError,
  isHandledFetchError,
} from 'farcaster-client-data';
import {
  isConflictingStateError,
  isUnexpectedStateError,
} from 'farcaster-cryptography';

/** Matches `maxAgreementPolls * agreementPollIntervalMs` in createSyncChannel. */
export const SYNC_CHANNEL_HANDSHAKE_MAX_MS = 185_000;

export const SYNC_CHANNEL_AUTH_POLL_INTERVAL_MS = 1000;

/** Post-handshake auth token poll cap (web waits for mobile upload). */
export const SYNC_CHANNEL_AUTH_POLL_MAX_MS = 185_000;

/**
 * Sentinel timeout messages used by mobile handshake and web auth-poll. Kept
 * stable so {@link classifySyncChannelLoginError} can route them to the correct
 * `failureKind` without colliding with other "timed out" errors in the app.
 */
export const SYNC_CHANNEL_HANDSHAKE_TIMEOUT_MESSAGE =
  'Sync channel handshake timed out waiting for web';

export const SYNC_CHANNEL_AUTH_POLL_TIMEOUT_MESSAGE =
  'Sync channel auth message poll timed out waiting for mobile';

export type SyncChannelLoginFailureKind =
  | 'cancelled'
  | 'handshake_timeout'
  | 'fetch_failure'
  | 'network'
  | 'protocol'
  | 'auth_poll_timeout'
  | 'symmetric_key_not_found'
  | 'symmetric_key_send_failed'
  | 'symmetric_key_send_empty'
  | 'malformed_message'
  | 'unknown';

/**
 * Deepest sync-channel login step a screen entered before failing. Attached to
 * the `LoginWithMobileSyncChannelFailed` event so PostHog can answer "where is
 * the sync-channel login getting stuck?" without firing a checkpoint event per
 * step.
 */
export type SyncChannelLoginCheckpoint =
  | 'create_sync_channel_started'
  | 'confirm_key_agreement_started'
  | 'poll_for_message_started';

export type SyncChannelLoginFailureContextValue =
  | string
  | number
  | boolean
  | undefined;

export type SyncChannelLoginFailureContext = Record<
  string,
  SyncChannelLoginFailureContextValue
>;

const DIAGNOSTIC_MESSAGE_MAX_LENGTH = 2000;

const classifyUnexpectedStateMessage = (
  errorMessage: string,
): SyncChannelLoginFailureKind => {
  if (errorMessage.includes('Unable to fetch sync channel updates')) {
    return 'fetch_failure';
  }
  if (errorMessage.includes('No valid PublicKey message found')) {
    return 'handshake_timeout';
  }
  if (errorMessage.includes('No valid SymmetricKey message found')) {
    return 'symmetric_key_not_found';
  }
  if (errorMessage.includes('Failed to write SymmetricKey to sync channel')) {
    return 'symmetric_key_send_failed';
  }
  if (
    errorMessage.includes(
      'confirmKeyAgreement produced no SymmetricKey message',
    )
  ) {
    return 'symmetric_key_send_empty';
  }
  if (errorMessage.includes('Key transport rejected the agreement')) {
    return 'malformed_message';
  }
  return 'protocol';
};

/** Classifies sync-channel login failures for observability only (not user-facing copy). */
const classifySyncChannelLoginError = (
  error: unknown,
): { kind: SyncChannelLoginFailureKind } => {
  if (isConflictingStateError(error)) {
    return { kind: 'cancelled' };
  }

  if (isUnexpectedStateError(error)) {
    return { kind: classifyUnexpectedStateMessage(error.message) };
  }

  if (isFarcasterApiError(error)) {
    if (error.isNetworkError || error.hasTimedOut) {
      return { kind: 'network' };
    }
  }

  if (
    error instanceof Error &&
    error.message.includes(SYNC_CHANNEL_HANDSHAKE_TIMEOUT_MESSAGE)
  ) {
    return { kind: 'handshake_timeout' };
  }

  if (
    error instanceof Error &&
    error.message.includes(SYNC_CHANNEL_AUTH_POLL_TIMEOUT_MESSAGE)
  ) {
    return { kind: 'auth_poll_timeout' };
  }

  // Defense in depth: native `TypeError`s reaching this classifier almost
  // always come from `Buffer.from(...)` being handed an unexpected non-string
  // shape (e.g. a sync-channel message field that arrived as `object` instead
  // of a base64 string). The cryptography layer now wraps the known entry
  // points, but anything that slips past should still get a dedicated bucket
  // so it shows up in PostHog as `malformed_message` instead of `unknown`.
  if (error instanceof TypeError) {
    return { kind: 'malformed_message' };
  }

  return { kind: 'unknown' };
};

const extractDiagnosticNumber = (
  errorMessage: string,
  key: string,
): number | undefined => {
  const match = errorMessage.match(new RegExp(`${key}=(\\d+)`));
  if (!match?.[1]) {
    return undefined;
  }

  const value = Number.parseInt(match[1], 10);
  return Number.isNaN(value) ? undefined : value;
};

const getDiagnosticErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message.slice(0, DIAGNOSTIC_MESSAGE_MAX_LENGTH);
  }

  return String(error ?? 'unknown').slice(0, DIAGNOSTIC_MESSAGE_MAX_LENGTH);
};

const getNestedCauseMessage = (error: unknown): string | undefined => {
  if (!(error instanceof Error)) {
    return undefined;
  }

  // Errors in this monorepo use two conventions for the underlying cause:
  //   - The standard ES2022 `Error` API stores it on `.cause` (set when you
  //     do `new Error(msg, { cause })`).
  //   - `farcaster-cryptography`'s `CryptographyError` base class stores it on
  //     a custom `.error` property instead — its constructor only calls
  //     `super(name)` and assigns `this.error = error`, so `.cause` is always
  //     `undefined` even when an underlying error was passed in. The new
  //     defensive wrap in `Methods.ts` `confirmKeyAgreement` flows through
  //     this path: `new UnexpectedStateError({ message, error })`.
  // Read both so diagnostic context (e.g. the underlying `TypeError` from
  // `Buffer.from(...)` or `DOMException` from Web Crypto / IndexedDB) is
  // never silently dropped in PostHog.
  const nested =
    error.cause ?? (error as { error?: unknown }).error ?? undefined;

  if (nested === undefined || nested === null) {
    return undefined;
  }

  if (nested instanceof Error) {
    return nested.message.slice(0, 500);
  }

  return String(nested).slice(0, 500);
};

/**
 * Rich diagnostic properties for PostHog. Must not be shown to users.
 *
 * `startedAtMs` is the `Date.now()` captured immediately before the handshake
 * began. When supplied, `durationMs` (now - startedAtMs) is added so we can
 * distinguish fast-fail (e.g. ~5s) from full handshake timeout (~185s).
 */
const buildSyncChannelLoginFailureContext = ({
  channelId,
  error,
  phase,
  platform,
  loginType,
  isSyncChannelSender,
  startedAtMs,
  lastCheckpoint,
}: {
  channelId: string;
  error: unknown;
  phase: 'handshake' | 'auth';
  platform: string;
  loginType: string | undefined;
  isSyncChannelSender: boolean | undefined;
  startedAtMs?: number;
  lastCheckpoint?: SyncChannelLoginCheckpoint;
}): SyncChannelLoginFailureContext => {
  const { kind } = classifySyncChannelLoginError(error);
  const diagnosticErrorMessage = getDiagnosticErrorMessage(error);

  const context: SyncChannelLoginFailureContext = {
    channelId,
    phase,
    failureKind: kind,
    platform,
    loginType,
    isSyncChannelSender,
    diagnosticErrorMessage,
    errorName: error instanceof Error ? error.name : typeof error,
    nestedCauseMessage: getNestedCauseMessage(error),
    durationMs:
      startedAtMs !== undefined ? Date.now() - startedAtMs : undefined,
    lastCheckpoint,
  };

  if (
    kind === 'handshake_timeout' ||
    kind === 'protocol' ||
    kind === 'fetch_failure' ||
    kind === 'symmetric_key_not_found' ||
    kind === 'symmetric_key_send_failed' ||
    kind === 'malformed_message'
  ) {
    context.agreementParseFailures = extractDiagnosticNumber(
      diagnosticErrorMessage,
      'parseFailures',
    );
    context.agreementFetchFailures = extractDiagnosticNumber(
      diagnosticErrorMessage,
      'fetchFailures',
    );
    context.agreementProcessedMessages = extractDiagnosticNumber(
      diagnosticErrorMessage,
      'processedMessages',
    );
    context.agreementConsecutiveFetchFailures = extractDiagnosticNumber(
      diagnosticErrorMessage,
      'consecutiveFetchFailures',
    );
  }

  if (isFarcasterApiError(error)) {
    context.apiEndpointName = error.endpointName;
    context.apiIsNetworkError = error.isNetworkError;
    context.apiHasTimedOut = error.hasTimedOut;
    context.apiIsHandled = isHandledFetchError(error);
    context.apiStatus = error.status;
    context.apiRelativeUrl = error.relativeUrl;
    context.apiIsOffline = error.isOffline;
  }

  return context;
};

/**
 * Properties for PostHog event payloads.
 *
 * Keeps native types (numbers / booleans) so PostHog can aggregate fields like
 * `durationMs`, `apiStatus`, and `isSyncChannelSender` directly (histograms,
 * averages, breakdowns) instead of treating them as opaque strings.
 */
const buildSyncChannelLoginFailureAnalytics = ({
  channelId,
  error,
  phase,
  platform,
  loginType,
  isSyncChannelSender,
  startedAtMs,
  lastCheckpoint,
}: {
  channelId: string;
  error: unknown;
  phase: 'handshake' | 'auth';
  platform: string;
  loginType: string | undefined;
  isSyncChannelSender: boolean | undefined;
  startedAtMs?: number;
  lastCheckpoint?: SyncChannelLoginCheckpoint;
}): Record<string, string | number | boolean> => {
  const context = buildSyncChannelLoginFailureContext({
    channelId,
    error,
    phase,
    platform,
    loginType,
    isSyncChannelSender,
    startedAtMs,
    lastCheckpoint,
  });

  return Object.fromEntries(
    Object.entries(context).filter(
      (entry): entry is [string, string | number | boolean] =>
        entry[1] !== undefined,
    ),
  );
};

/**
 * Races `promise` against a timeout. On timeout, flips
 * `cancelController.cancel = true` so the underlying sync-channel loop
 * (`createSyncChannel` / `confirmKeyAgreement`) exits on its next iteration
 * instead of continuing to hit the API in the background.
 */
const withSyncChannelTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
  cancelController?: { cancel: boolean },
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      if (cancelController) {
        cancelController.cancel = true;
      }
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
};

export {
  buildSyncChannelLoginFailureAnalytics,
  classifySyncChannelLoginError,
  withSyncChannelTimeout,
};
