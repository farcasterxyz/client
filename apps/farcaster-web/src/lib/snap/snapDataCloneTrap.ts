/**
 * Front-end trap for snap response parse / deserialization failures.
 * NEYN-10935.
 *
 * Four events feed PostHog from this module:
 *
 *   - `SnapParseError` — fires from {@link logSnapParseError} for *any*
 *     throw during snap response parsing (HTTP body → JSON.parse → schema
 *     validation → renderer state). Carries an `errorKind` discriminator
 *     (`data_clone | json | validation | unknown`) plus the redacted shape,
 *     `snapId`, `target`, etc. Use this to triage which hosted snaps emit
 *     bad data, not just count failures.
 *
 *   - `SnapDataCloneError` — fires from the same code path whenever the
 *     thrown error matches {@link isDataCloneLikeError}. Strict subset of
 *     `SnapParseError`; kept for the targeted dashboard / alerting use that
 *     the original PR (#9941) wired up. Also fires alongside `SnapResponseError`
 *     and `ClientDataCloneError` when those classify as `data_clone`, so
 *     the dashboard sees every channel.
 *
 *   - `SnapResponseError` — fires from {@link logSnapResponseError} when the
 *     signed-action / snap-host returns `result.success: false`, or when the
 *     localhost POST path rejects on HTTP status / content-type before we
 *     try to parse. This is the gap the original parse trap couldn't see:
 *     the backend can return a DataCloneError message verbatim in
 *     `result.response.error`, and the renderer surfaces it via `onError`
 *     without ever throwing client-side.
 *
 *   - `ClientDataCloneError` — fires from window-level `error` /
 *     `unhandledrejection` listeners installed at app boot via
 *     {@link installSnapWindowErrorListener}. Catches DataCloneErrors fired
 *     outside our snap-side try/catches (wagmi/Privy IDB hydration, wallet-
 *     iframe postMessage, extension content scripts). Idempotent install,
 *     no preventDefault, listener body wrapped in best-effort try/catch.
 *
 * Console branch always logs unredacted (DevTools + local repro). Analytics
 * branch always emits redacted via {@link redactForTelemetry}: string leaves
 * become `<string:N>` sentinels so we can see structure and types without
 * leaking user-typed input. The hosted-snap UUID — also the conversation ID
 * — is allowlisted through redaction so support can correlate events.
 */

import { AnalyticsEvent } from 'farcaster-analytics';

const SNAP_HOST_HOST = 'snap-host.farcaster.xyz';
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DATA_CLONE_MESSAGE_SUBSTRINGS = [
  'Unable to deserialize cloned data',
  'could not be cloned',
  'An object could not be cloned',
];

/**
 * Strings that are safe to forward verbatim to telemetry. Two categories:
 *
 *   1. **Canonical V8 structured-clone messages** — exact-equality match
 *      only. Listed by their full verbatim text. A *substring* match would
 *      let a crafted publisher error like
 *      `"Unable to deserialize cloned data DROP TABLE …"` slip through;
 *      exact equality forces the message to be the runtime string and
 *      nothing else.
 *   2. **Strings constructed by this client itself** in
 *      {@link useSnapActionHandlers} — bounded regex match AND gated on
 *      `context.reason` so a publisher's `"Snap returned HTTP 500 … "`
 *      forgery can't masquerade as our own constructed string.
 *
 * Anything else passing through `responseError` / `responseIssueMessages`
 * is publisher-controlled and may echo user input — those get redacted to
 * a length sentinel instead. Keep this list narrow.
 */
const CANONICAL_SAFE_V8_MESSAGES = new Set<string>([
  'Unable to deserialize cloned data due to invalid or unsupported version.',
  'An object could not be cloned.',
]);

// Status code is the only variable bit. Bounded so the message is exactly
// the form `useSnapActionHandlers` constructs.
const CLIENT_HTTP_STATUS_PATTERN = /^Snap returned HTTP \d{3}$/;

// Content-type is server-controlled, so the tail is bounded both in length
// and to the chars a real Content-Type token uses. A malformed or
// suspiciously long Content-Type falls back to redaction. The two prefixes
// differ to keep the discriminators truthful: `non_json_content_type` is
// emitted when the predicate was a literal `.includes('json')` check
// (localhost POST, direct fetch), while `unexpected_content_type` is emitted
// when the predicate required the snap-specific media type
// (`application/vnd.farcaster.snap+json`) — under that check a server
// returning `application/json` is still rejected, so calling it "non-JSON"
// would be misleading (Copilot review, PR #10110).
const CLIENT_NON_JSON_PATTERN =
  /^Snap returned non-JSON content-type: [A-Za-z0-9._/+-]{1,80}(?:;\s*[A-Za-z0-9._/+-]{1,40}=[A-Za-z0-9._/+-]{1,40}){0,3}$/;
const CLIENT_UNEXPECTED_CT_PATTERN =
  /^Snap returned unexpected content-type: [A-Za-z0-9._/+-]{1,80}(?:;\s*[A-Za-z0-9._/+-]{1,40}=[A-Za-z0-9._/+-]{1,40}){0,3}$/;

// `network_error` always carries this exact phrase from the client; the
// thrown error's own name/message ride on `errorName`/`errorMessage` fields
// (length-bounded via `truncate`) rather than being inlined here.
const CLIENT_NETWORK_ERROR_PATTERN = /^Snap request failed$/;

type PassthroughReason =
  | 'result_unsuccessful'
  | 'http_status'
  | 'non_json_content_type'
  | 'unexpected_content_type'
  | 'network_error';

function isPassthroughSafe(
  msg: string,
  reason: PassthroughReason | undefined,
): boolean {
  if (CANONICAL_SAFE_V8_MESSAGES.has(msg)) {
    return true;
  }
  // Client-constructed phrases are only safe under the reason that produced
  // them. A backend echoing "Snap returned HTTP 500" inside a
  // `result_unsuccessful` response is publisher-controlled and gets
  // redacted, even if the literal text happens to match.
  if (reason === 'http_status' && CLIENT_HTTP_STATUS_PATTERN.test(msg)) {
    return true;
  }
  if (reason === 'non_json_content_type' && CLIENT_NON_JSON_PATTERN.test(msg)) {
    return true;
  }
  if (
    reason === 'unexpected_content_type' &&
    CLIENT_UNEXPECTED_CT_PATTERN.test(msg)
  ) {
    return true;
  }
  if (reason === 'network_error' && CLIENT_NETWORK_ERROR_PATTERN.test(msg)) {
    return true;
  }
  return false;
}

/**
 * Pass `msg` through verbatim (truncated) only if it matches a known-safe
 * phrase under the given `reason`. Otherwise return a length sentinel so
 * the field is still useful for sizing without leaking publisher-supplied
 * content. Used for the backend-controlled fields in `SnapResponseError`
 * (NEYN-10935 PR feedback rounds).
 */
function passthroughOrSentinel(
  msg: string | undefined,
  max: number,
  reason: PassthroughReason | undefined,
): string | undefined {
  if (msg === undefined) {
    return undefined;
  }
  if (isPassthroughSafe(msg, reason)) {
    return truncate(msg, max);
  }
  return `<string:${msg.length}>`;
}

/**
 * Identify the symptom — V8 structured-clone deserialization failure. Matches:
 *   - `DOMException` with `name === 'DataCloneError'` (the canonical case)
 *   - Errors whose message contains the V8 deserialization phrase, since
 *     some browsers/runtimes surface it as a plain `Error` rather than a
 *     named `DOMException`.
 */
export function isDataCloneLikeError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const maybeName = (error as { name?: unknown }).name;
  if (typeof maybeName === 'string' && maybeName === 'DataCloneError') {
    return true;
  }
  const maybeMessage = (error as { message?: unknown }).message;
  if (typeof maybeMessage !== 'string') {
    return false;
  }
  return DATA_CLONE_MESSAGE_SUBSTRINGS.some((s) => maybeMessage.includes(s));
}

/**
 * Pull the hosted-snap UUID out of a `snap-host.farcaster.xyz/<uuid>/...` URL.
 * In the current publish model `snapId === conversationId`, so this is the
 * reference users get from the in-app error fallback. Returns undefined for
 * any URL that doesn't match — including localhost dev snaps and non-snap-host
 * deployments.
 */
export function extractSnapIdFromUrl(
  url: string | null | undefined,
): string | undefined {
  if (!url) {
    return undefined;
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }
  if (parsed.host !== SNAP_HOST_HOST) {
    return undefined;
  }
  const firstSegment = parsed.pathname.split('/').filter(Boolean)[0];
  if (!firstSegment || !UUID_REGEX.test(firstSegment)) {
    return undefined;
  }
  return firstSegment.toLowerCase();
}

/**
 * `JSON.stringify` that never throws. Used to render the parsed-response
 * stand-in for the proxied POST path, where the API client has already
 * consumed the network body and we have no raw text to log.
 */
export function safeStringify(value: unknown): string | null {
  if (value === undefined) {
    return null;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

/**
 * Keys whose values are public identifiers (the hosted-snap UUID is also the
 * conversation ID). When the redaction walker encounters one of these keys
 * with a primitive value, the value is passed through verbatim so support can
 * correlate the PostHog event back to the snap.
 */
const TELEMETRY_PASSTHROUGH_KEYS = new Set([
  'snapId',
  'snap_id',
  'snapID',
  'conversationId',
  'conversation_id',
  'conversationID',
]);

const DEFAULT_MAX_DEPTH = 6;
const DEFAULT_MAX_ARRAY_LENGTH = 50;
const DEFAULT_MAX_OBJECT_KEYS = 50;

type RedactOpts = {
  maxDepth?: number;
  maxArrayLength?: number;
  maxObjectKeys?: number;
  passthroughKeys?: ReadonlySet<string>;
};

/**
 * Structure-preserving redaction for telemetry. Preserves enough of the parsed
 * snap response / submitted inputs to identify the structured-clone offender
 * (which path/key, what runtime type) without leaking string contents that
 * could include user-typed input.
 *
 * Rules:
 *   - Strings become `<string:N>` sentinels, EXCEPT when the parent key is in
 *     {@link TELEMETRY_PASSTHROUGH_KEYS} (snapId / conversationId / etc).
 *   - Numbers, booleans, and `null` pass through — these are not user content
 *     and they're often the diagnostic signal (a number where a string was
 *     expected, etc.).
 *   - `undefined`, functions, and symbols become type sentinels.
 *   - Dates, RegExp, Map, Set, ArrayBuffer, and TypedArrays become typed
 *     sentinels rather than recursing. These are the kinds of values that
 *     are *most likely* to be the actual structured-clone offender (e.g. a
 *     `Date` that round-tripped through a runtime that lost the prototype),
 *     so tagging them by type is more useful than their content — and
 *     content (e.g. `Date.toISOString()`) is dropped because snaps render
 *     user-controllable timestamps.
 *   - Arrays and plain objects recurse, capped at {@link maxArrayLength},
 *     {@link maxObjectKeys}, and {@link maxDepth} to bound the event payload.
 *   - Cycles (a node referencing itself through its current ancestor chain)
 *     are short-circuited with `<cycle>`. DAG repeats — the same sub-object
 *     reached via two different parents — recurse independently, so a shared
 *     theme/palette doesn't get silently flattened.
 *
 * Non-plain object instances surface their constructor name so a class wrapper
 * that loses its prototype across structured clone is visible.
 */
export function redactForTelemetry(
  value: unknown,
  opts: RedactOpts = {},
): unknown {
  const maxDepth = opts.maxDepth ?? DEFAULT_MAX_DEPTH;
  const maxArrayLength = opts.maxArrayLength ?? DEFAULT_MAX_ARRAY_LENGTH;
  const maxObjectKeys = opts.maxObjectKeys ?? DEFAULT_MAX_OBJECT_KEYS;
  const passthroughKeys = opts.passthroughKeys ?? TELEMETRY_PASSTHROUGH_KEYS;

  // Ancestor-only cycle tracking (not a whole-traversal seen-set). A repeated
  // reference inside a DAG (e.g. the same theme object hung off two parents)
  // is legal and shouldn't be tagged as a cycle — only an actual self-reference
  // on the current path should. Push on entry, pop on exit via `try/finally`.
  const ancestors = new Set<object>();

  const visit = (
    node: unknown,
    depth: number,
    parentKey: string | undefined,
  ): unknown => {
    if (depth > maxDepth) {
      return '<max-depth>';
    }

    if (node === null) {
      return null;
    }

    const t = typeof node;
    if (t === 'string') {
      if (parentKey !== undefined && passthroughKeys.has(parentKey)) {
        return node;
      }
      return `<string:${(node as string).length}>`;
    }
    if (t === 'number' || t === 'boolean') {
      return node;
    }
    if (t === 'bigint') {
      // BigInts in snap responses are plausibly wallet balances or other
      // user-tied amounts; the literal digits could carry meaning. Tag with
      // the digit count instead — preserves the "BigInt at this path" signal
      // and the magnitude class, drops the value.
      return `<bigint:digits:${(node as bigint).toString().replace(/^-/, '').length}>`;
    }
    if (t === 'undefined') {
      return '<undefined>';
    }
    if (t === 'function') {
      return '<function>';
    }
    if (t === 'symbol') {
      return '<symbol>';
    }
    // From here on, node is a non-null object.

    if (ancestors.has(node as object)) {
      return '<cycle>';
    }
    ancestors.add(node as object);
    try {
      // `Date` carries user-controllable timestamps for any snap that puts a
      // server-rendered date in its UI tree, so the ISO string is unsafe to
      // leak. Tag validity only — the diagnostic signal is "this path was a
      // Date instance at the clone boundary", not which Date.
      if (node instanceof Date) {
        return Number.isFinite(node.getTime()) ? '<Date>' : '<Date:invalid>';
      }
      if (node instanceof RegExp) {
        return `<RegExp>`;
      }
      if (node instanceof Map) {
        return `<Map:size:${node.size}>`;
      }
      if (node instanceof Set) {
        return `<Set:size:${node.size}>`;
      }
      if (typeof ArrayBuffer !== 'undefined' && node instanceof ArrayBuffer) {
        return `<ArrayBuffer:bytes:${node.byteLength}>`;
      }
      if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(node)) {
        const view = node as ArrayBufferView & { length?: number };
        const ctor = (view.constructor as { name?: string } | undefined)?.name;
        const length =
          typeof view.length === 'number' ? view.length : view.byteLength;
        return `<${ctor ?? 'ArrayBufferView'}:length:${length}>`;
      }

      if (Array.isArray(node)) {
        const out: unknown[] = [];
        const limit = Math.min(node.length, maxArrayLength);
        for (let i = 0; i < limit; i += 1) {
          out.push(visit(node[i], depth + 1, undefined));
        }
        if (node.length > maxArrayLength) {
          out.push(`<array-truncated:${node.length - maxArrayLength}-more>`);
        }
        return out;
      }

      // Plain object or class instance. Tag class instances by constructor so
      // a wrapper that survives JSON.stringify but loses identity at the clone
      // boundary is visible.
      let ctorName: string | undefined;
      try {
        ctorName = (node as { constructor?: { name?: string } }).constructor
          ?.name;
      } catch {
        ctorName = undefined;
      }
      const isPlain = !ctorName || ctorName === 'Object';
      const out: Record<string, unknown> = {};
      if (!isPlain) {
        out.__type = ctorName;
      }
      let keys: string[];
      try {
        keys = Object.keys(node as Record<string, unknown>);
      } catch {
        return '<unenumerable>';
      }
      const limit = Math.min(keys.length, maxObjectKeys);
      for (let i = 0; i < limit; i += 1) {
        const key = keys[i] as string;
        // A throwing getter on one key shouldn't blow up the whole shape —
        // tag the offending field and keep going.
        try {
          out[key] = visit(
            (node as Record<string, unknown>)[key],
            depth + 1,
            key,
          );
        } catch {
          out[key] = '<getter-threw>';
        }
      }
      if (keys.length > maxObjectKeys) {
        out.__truncated = `${keys.length - maxObjectKeys}-more-keys`;
      }
      return out;
    } finally {
      ancestors.delete(node as object);
    }
  };

  return visit(value, 0, undefined);
}

/**
 * Discriminator for the `SnapParseError` event. Picked by inspecting the
 * thrown error's name/message; `unknown` covers everything we can't pin to
 * a specific class. Keep stable — PostHog dashboards will pivot on this.
 */
export type SnapParseErrorKind =
  | 'data_clone'
  | 'json'
  | 'validation'
  | 'unknown';

/**
 * Categorize a thrown parse error so PostHog can filter on errorKind. The
 * `validation` heuristic matches the prefix used by `validateAndParseSnap`
 * in `~/lib/snap/snapUtils.ts` — if you change that prefix, update here too.
 */
export function classifyParseError(error: unknown): SnapParseErrorKind {
  if (isDataCloneLikeError(error)) {
    return 'data_clone';
  }
  if (error instanceof SyntaxError) {
    return 'json';
  }
  if (
    error instanceof Error &&
    typeof error.message === 'string' &&
    error.message.startsWith('Invalid snap:')
  ) {
    return 'validation';
  }
  return 'unknown';
}

type SnapParseErrorContext = {
  /** Where in the flow we caught it — narrows the offending boundary. */
  phase: 'get_direct' | 'get_proxy' | 'post_remote' | 'post_localhost';
  /** Snap document URL we were rendering when the error surfaced. */
  snapDocumentUrl: string | null | undefined;
  /** Resolved POST target (`submit` only). */
  target?: string;
  /** Inputs submitted with a POST. Logged in full to console — only the redacted shape goes over the wire. */
  inputs?: Record<string, unknown>;
  /**
   * Raw HTTP response body as text. Captured before `JSON.parse` for the
   * paths where we own the fetch (`response.text()`). For the proxied
   * `/v2/snap-request` path the body has already been parsed by the API
   * client, so we pass `JSON.stringify(parsed)` as a stand-in and mark it
   * as reconstructed.
   */
  responseBody?: { kind: 'raw' | 'reconstructed'; text: string | null };
  /**
   * The object that was about to be structured-cloned at the moment of
   * failure. Often identical to `JSON.parse(responseBody)`, but the user
   * note in NEYN-10935 specifically flagged that it can be mutated between
   * parse and the clone boundary — keep both.
   */
  cloneTarget: unknown;
  /** The thrown error itself. */
  error: unknown;
  /**
   * Optional analytics emitter. When provided the trap sends a redacted
   * `AnalyticsEvent.SnapDataCloneError` event so the diagnostic actually
   * lands in PostHog — the unredacted console log alone is only
   * useful for a hand-collected repro. Wire `useAnalytics().trackEvent` in.
   */
  trackEvent?: (
    event: AnalyticsEvent,
    data: Record<string, string | boolean | number | undefined>,
  ) => void;
};

const ERROR_MESSAGE_MAX = 500;
const ERROR_STACK_MAX = 2000;
// Error names are short in practice ("Error", "TypeError", "DataCloneError").
// A custom subclass with an absurdly long `name` would otherwise blow up the
// payload — cap defensively (Copilot review, PR #10110).
const ERROR_NAME_MAX = 120;
const REDACTED_JSON_MAX = 8000;
// Bound the work in the response-error path: a publisher returning thousands
// of `responseIssues` would otherwise allocate an unbounded join string just
// to redact it. Cap the issue count and per-message preview before joining.
const MAX_RESPONSE_ISSUES_CONSIDERED = 20;
const MAX_ISSUE_MESSAGE_PREVIEW = 200;

function truncate(value: string | undefined, max: number): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max)}…<truncated:${value.length - max}>`;
}

/**
 * One-shot structured log + analytics emission for any snap response parse
 * failure (DataCloneError, JSON syntax error, schema validation error,
 * anything else thrown during the snap-renderer's parse path). Always writes
 * to `console.error` with the unredacted payload (DevTools + page-level
 * error reporter pick it up). When `context.trackEvent` is supplied, also
 * emits:
 *
 *   - `AnalyticsEvent.SnapParseError` (always) — broad event with
 *     `errorKind` discriminator and redacted shape. Use this for triage.
 *   - `AnalyticsEvent.SnapDataCloneError` (only when {@link isDataCloneLikeError}
 *     matches) — narrow event kept for the specific dashboard / alerting
 *     that PR #9941 wired up.
 *
 * Best-effort: the body is wrapped so that a thrown getter, exotic Proxy,
 * or third-party `trackEvent` failure inside the trap can never escape and
 * surface to the user. The caller is already in a parse-error path; the
 * trap must not make it worse.
 */
export function logSnapParseError(context: SnapParseErrorContext): void {
  try {
    logSnapParseErrorImpl(context);
  } catch (trapError) {
    // The full diagnostic is gone, but we can still leave a breadcrumb that
    // the trap itself failed. Wrap this in its own try so a weird console
    // implementation can't propagate either.
    try {
      // eslint-disable-next-line no-console
      console.error('[snap-parse-error:trap-failed]', {
        phase: context?.phase,
        trapError,
      });
    } catch {
      /* nothing useful left to do */
    }
  }
}

function logSnapParseErrorImpl(context: SnapParseErrorContext): void {
  const error = context.error;
  const errorInfo =
    error && typeof error === 'object'
      ? {
          name: (error as { name?: unknown }).name,
          message: (error as { message?: unknown }).message,
          stack: (error as { stack?: unknown }).stack,
        }
      : { name: undefined, message: String(error), stack: undefined };

  const nav: Navigator | undefined =
    typeof navigator === 'undefined' ? undefined : navigator;

  const snapId = extractSnapIdFromUrl(context.snapDocumentUrl);
  const errorKind = classifyParseError(context.error);

  // eslint-disable-next-line no-console
  console.error('[snap-parse-error]', {
    phase: context.phase,
    errorKind,
    snapId,
    snapDocumentUrl: context.snapDocumentUrl ?? null,
    target: context.target ?? null,
    inputs: context.inputs ?? null,
    responseBody: context.responseBody ?? null,
    cloneTarget: context.cloneTarget,
    error: errorInfo,
    client: {
      userAgent: nav?.userAgent ?? null,
      vendor: nav?.vendor ?? null,
      // `userAgentData` carries the Chromium/V8 brand+version when available.
      userAgentData:
        (nav as unknown as { userAgentData?: unknown })?.userAgentData ?? null,
    },
  });

  if (!context.trackEvent) {
    return;
  }

  // PostHog path. Event properties must be primitives, so each
  // redacted shape is serialized to its own JSON string. We send THREE
  // separate shapes when available — inputs, cloneTarget, and (when we held
  // the raw HTTP bytes) responseBody — because the user note on NEYN-10935
  // specifically called out that the parsed object can diverge from the
  // network body between `JSON.parse` and the structured-clone boundary.
  // Sizes are exposed separately so a too-big payload that gets truncated
  // is still diagnosable.
  const redactedInputs =
    context.inputs === undefined ? null : redactForTelemetry(context.inputs);
  const redactedCloneTarget = redactForTelemetry(context.cloneTarget);

  const inputsJson =
    redactedInputs === null ? undefined : safeStringify(redactedInputs);
  const cloneTargetJson = safeStringify(redactedCloneTarget);

  // Only re-parse + redact the raw response body. The 'reconstructed' kind is
  // a stringify of the same parsed payload we already redacted via
  // `cloneTarget` — sending it again would just inflate the event.
  let responseBodyShapeJson: string | undefined;
  if (
    context.responseBody?.kind === 'raw' &&
    context.responseBody.text &&
    context.responseBody.text.trim().length > 0
  ) {
    try {
      const parsedBody = JSON.parse(context.responseBody.text);
      responseBodyShapeJson =
        safeStringify(redactForTelemetry(parsedBody)) ?? undefined;
    } catch {
      // Surfacing "raw body wasn't JSON" is itself a diagnostic — a snap
      // server returning text/HTML where JSON was expected is exactly the
      // kind of bug a deserialization trap should catch.
      responseBodyShapeJson = `<unparseable-body:length:${context.responseBody.text.length}>`;
    }
  }

  const userAgentData = (nav as unknown as { userAgentData?: unknown })
    ?.userAgentData as
    | {
        brands?: Array<{ brand?: string; version?: string }>;
        mobile?: boolean;
        platform?: string;
      }
    | undefined;
  const userAgentBrands = userAgentData?.brands
    ?.map((b) => `${b.brand ?? '?'}/${b.version ?? '?'}`)
    .join(',');

  const payload: Record<string, string | boolean | number | undefined> = {
    phase: context.phase,
    errorKind,
    snapId: snapId ?? undefined,
    snapUrl: context.snapDocumentUrl
      ? snapUrlForTelemetry(context.snapDocumentUrl)
      : undefined,
    target: context.target ? snapUrlForTelemetry(context.target) : undefined,
    inputKeyCount:
      context.inputs === undefined
        ? undefined
        : Object.keys(context.inputs).length,
    inputShape: truncate(inputsJson ?? undefined, REDACTED_JSON_MAX),
    responseBodyKind: context.responseBody?.kind,
    responseBodyLength: context.responseBody?.text?.length,
    responseBodyShape: truncate(responseBodyShapeJson, REDACTED_JSON_MAX),
    cloneTargetShape: truncate(cloneTargetJson ?? undefined, REDACTED_JSON_MAX),
    errorName:
      typeof errorInfo.name === 'string'
        ? truncate(errorInfo.name, ERROR_NAME_MAX)
        : undefined,
    errorMessage:
      typeof errorInfo.message === 'string'
        ? truncate(errorInfo.message, ERROR_MESSAGE_MAX)
        : undefined,
    errorStackHead:
      typeof errorInfo.stack === 'string'
        ? truncate(errorInfo.stack, ERROR_STACK_MAX)
        : undefined,
    userAgent: nav?.userAgent,
    vendor: nav?.vendor,
    userAgentBrands,
    userAgentMobile: userAgentData?.mobile,
    userAgentPlatform: userAgentData?.platform,
  };

  context.trackEvent(AnalyticsEvent.SnapParseError, payload);
  // Strict-subset event preserved for the dashboard PR #9941 wired up.
  if (errorKind === 'data_clone') {
    context.trackEvent(AnalyticsEvent.SnapDataCloneError, payload);
  }
}

/**
 * Strip query strings from the snap URL before sending to telemetry. Snap
 * URLs themselves are public (they're the OG embed URL), but query params
 * can sometimes carry user-influenced state — strip to be safe. Matches
 * the convention used elsewhere in the snap analytics helpers.
 */
function snapUrlForTelemetry(url: string): string {
  try {
    const u = new URL(url);
    u.search = '';
    return u.href;
  } catch {
    return url;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Backend-returned / pre-parse error trap (`SnapResponseError`)
//
// The signed-action / snap-host can return `result.success: false` with an
// error string in `result.response.error`. The renderer surfaces that
// string via `onError` and it lands in the UI as `actionError` — same
// visual shape as a thrown DataCloneError, but no client-side throw, so
// the parse trap above never sees it. This helper closes that gap and is
// also useful as general triage for backend-returned errors (publishers
// returning unrecognized schemas, etc.).
//
// Also covers the load-flow's HTTP status / content-type early bails
// (phase `get_direct`) and the POST flow's network/API-client failures
// (reason `network_error`) — paths where the renderer never gets to a
// parse step but still surfaces a generic error to the user (NEYN-11447).
// ─────────────────────────────────────────────────────────────────────────

type SnapResponseErrorContext = {
  /**
   * Where in the flow we observed it. `get_direct` covers the snap-renderer
   * GET path in `loadSnapFromUrl` (pre-parse HTTP / content-type rejects);
   * `post_*` covers the submit POST flows.
   */
  phase: 'post_remote' | 'post_localhost' | 'get_direct';
  /** Snap document URL we were rendering when the error surfaced. */
  snapDocumentUrl: string | null | undefined;
  /** Resolved POST target. */
  target?: string;
  /** Inputs submitted with the POST. */
  inputs?: Record<string, unknown>;
  /**
   * Reason the response was rejected. Differentiates the pre-parse rejects
   * (status / content-type) from the signed-action `!result.success` branch,
   * and from a thrown network/API-client failure (`network_error`). All
   * surface the same generic message to the user but indicate very
   * different failure modes upstream.
   *
   * `non_json_content_type` and `unexpected_content_type` are distinct:
   * the former is emitted under a literal `.includes('json')` predicate
   * (localhost POST, direct fetch); the latter is emitted under the strict
   * snap-media-type check in `loadSnapFromUrl` — where a server returning
   * plain `application/json` is still rejected, so calling it "non-JSON"
   * would mislead operators reading the dashboard.
   */
  reason:
    | 'result_unsuccessful'
    | 'http_status'
    | 'non_json_content_type'
    | 'unexpected_content_type'
    | 'network_error';
  /** HTTP status code, when known. */
  statusCode?: number;
  /**
   * Raw technical failure content (joined for the `result_unsuccessful`
   * path, client-constructed for the others). Historically also the
   * user-visible message, but the caller now shows a generic sanitized
   * string in the UI; this field carries the raw content for telemetry
   * triage only. Still passed through `passthroughOrSentinel` below so
   * publisher-controlled strings get redacted to length sentinels before
   * emission.
   */
  displayedMessage: string;
  /** Backend-returned error string (only `result.response.error`). */
  responseError?: string;
  /** Backend-returned issues (validation failures), if any. */
  responseIssues?: Array<{ message?: string; path?: string[] }>;
  /**
   * Whole `result.response` for the signed-action path, redacted before
   * emission. Tagging this lets us see what publishers' backends are
   * actually returning when they reject a POST.
   */
  response?: unknown;
  /**
   * Underlying thrown error for the `network_error` reason. The analytics
   * payload carries its `name`, truncated `message`, and truncated `stack`
   * head — the raw object is never serialized over the wire. The
   * `console.error` diagnostic branch logs `errorInfo` unredacted for
   * DevTools / local repro, matching the convention used by
   * {@link logSnapParseError}.
   */
  error?: unknown;
  trackEvent?: (
    event: AnalyticsEvent,
    data: Record<string, string | boolean | number | undefined>,
  ) => void;
};

/**
 * One-shot structured log + analytics emission for a backend-returned snap
 * error (i.e. `result.success: false` or the localhost pre-parse rejects).
 * Always writes to `console.error` with the unredacted payload. When
 * `context.trackEvent` is supplied, also emits:
 *
 *   - `AnalyticsEvent.SnapResponseError` (always) — broad event with
 *     `errorKind` derived from the displayed message, and a redacted
 *     `response` shape.
 *   - `AnalyticsEvent.SnapDataCloneError` (only when `errorKind ===
 *     'data_clone'`, i.e. `displayedMessage` is an exact match against
 *     {@link CANONICAL_SAFE_V8_MESSAGES}) — the strict-subset dashboard
 *     event. Exact equality is required here, not the looser
 *     `isDataCloneLikeError` substring check the parse trap uses, because
 *     `displayedMessage` is publisher-controlled and a backend could
 *     otherwise spoof the strict signal by embedding the V8 phrase in
 *     an arbitrary error string.
 *
 * Best-effort: body wrapped so a thrown getter / Proxy / `trackEvent`
 * failure inside the trap cannot escape.
 */
export function logSnapResponseError(context: SnapResponseErrorContext): void {
  try {
    logSnapResponseErrorImpl(context);
  } catch (trapError) {
    try {
      // eslint-disable-next-line no-console
      console.error('[snap-response-error:trap-failed]', {
        phase: context?.phase,
        trapError,
      });
    } catch {
      /* nothing useful left to do */
    }
  }
}

function logSnapResponseErrorImpl(context: SnapResponseErrorContext): void {
  const nav: Navigator | undefined =
    typeof navigator === 'undefined' ? undefined : navigator;
  const snapId = extractSnapIdFromUrl(context.snapDocumentUrl);
  // `displayedMessage` is publisher-controlled in the `result_unsuccessful`
  // path (it's `result.response.error` joined with issue messages). The
  // substring-based `isDataCloneLikeError` we use elsewhere would let a
  // backend spoof a `data_clone` classification — and therefore the strict
  // `SnapDataCloneError` dashboard event — by embedding the V8 phrase in
  // any error string. Use exact equality against the canonical set so the
  // dashboard signal stays clean (Copilot review round 4, PR #10038). For
  // the parse and window-listener paths the data flows through a real
  // thrown Error (with `name: 'DataCloneError'` or the V8 message at the
  // start of `error.message`), so substring matching is still appropriate
  // there.
  const errorKind: SnapParseErrorKind = CANONICAL_SAFE_V8_MESSAGES.has(
    context.displayedMessage,
  )
    ? 'data_clone'
    : 'unknown';

  const errorInfo =
    context.error === undefined
      ? null
      : context.error && typeof context.error === 'object'
        ? {
            name: (context.error as { name?: unknown }).name,
            message: (context.error as { message?: unknown }).message,
            stack: (context.error as { stack?: unknown }).stack,
          }
        : { name: undefined, message: String(context.error), stack: undefined };

  // eslint-disable-next-line no-console
  console.error('[snap-response-error]', {
    phase: context.phase,
    reason: context.reason,
    errorKind,
    snapId,
    snapDocumentUrl: context.snapDocumentUrl ?? null,
    target: context.target ?? null,
    statusCode: context.statusCode ?? null,
    displayedMessage: context.displayedMessage,
    responseError: context.responseError ?? null,
    responseIssues: context.responseIssues ?? null,
    response: context.response,
    inputs: context.inputs ?? null,
    error: errorInfo,
    client: {
      userAgent: nav?.userAgent ?? null,
      vendor: nav?.vendor ?? null,
      userAgentData:
        (nav as unknown as { userAgentData?: unknown })?.userAgentData ?? null,
    },
  });

  if (!context.trackEvent) {
    return;
  }

  const redactedResponse =
    context.response === undefined
      ? null
      : redactForTelemetry(context.response);
  const responseShapeJson =
    redactedResponse === null
      ? undefined
      : (safeStringify(redactedResponse) ?? undefined);

  const redactedInputs =
    context.inputs === undefined ? null : redactForTelemetry(context.inputs);
  const inputsJson =
    redactedInputs === null
      ? undefined
      : (safeStringify(redactedInputs) ?? undefined);

  // Publisher backends control these strings and validators commonly echo
  // user input ("Invalid email: cory@example.com" etc), so we cannot send
  // them verbatim to telemetry without leaking user content
  // (Copilot review, PR #10038). Pass through only when the message matches
  // a known-safe phrase (V8 deserialize phrases, our own constructed
  // "Snap returned HTTP …"); otherwise emit a `<string:N>` length sentinel.
  // The redacted `responseShape` field below still gives general triage
  // value when the literal string is suppressed.
  //
  // Bound the intermediate allocation: a publisher returning thousands of
  // issues with long messages would otherwise build a multi-megabyte string
  // here just to throw it all away in `passthroughOrSentinel` (Copilot
  // review round 3, PR #10038). Cap to the first
  // {@link MAX_RESPONSE_ISSUES_CONSIDERED} issues, truncate each to
  // {@link MAX_ISSUE_MESSAGE_PREVIEW} chars, then join.
  let issueMessages: string | undefined;
  if (context.responseIssues && context.responseIssues.length > 0) {
    const considered = context.responseIssues.slice(
      0,
      MAX_RESPONSE_ISSUES_CONSIDERED,
    );
    const previews: string[] = [];
    for (const issue of considered) {
      const m = issue?.message;
      if (typeof m !== 'string') {
        continue;
      }
      previews.push(
        m.length > MAX_ISSUE_MESSAGE_PREVIEW
          ? m.slice(0, MAX_ISSUE_MESSAGE_PREVIEW)
          : m,
      );
    }
    const joined = previews.join(' | ');
    const overflow =
      context.responseIssues.length - MAX_RESPONSE_ISSUES_CONSIDERED;
    issueMessages =
      overflow > 0 ? `${joined} | <truncated:${overflow}-more>` : joined;
  }

  const userAgentData = (nav as unknown as { userAgentData?: unknown })
    ?.userAgentData as
    | {
        brands?: Array<{ brand?: string; version?: string }>;
        mobile?: boolean;
        platform?: string;
      }
    | undefined;
  const userAgentBrands = userAgentData?.brands
    ?.map((b) => `${b.brand ?? '?'}/${b.version ?? '?'}`)
    .join(',');

  const payload: Record<string, string | boolean | number | undefined> = {
    phase: context.phase,
    reason: context.reason,
    errorKind,
    snapId: snapId ?? undefined,
    snapUrl: context.snapDocumentUrl
      ? snapUrlForTelemetry(context.snapDocumentUrl)
      : undefined,
    target: context.target ? snapUrlForTelemetry(context.target) : undefined,
    statusCode: context.statusCode,
    displayedMessage: passthroughOrSentinel(
      context.displayedMessage,
      ERROR_MESSAGE_MAX,
      context.reason,
    ),
    responseError: passthroughOrSentinel(
      context.responseError,
      ERROR_MESSAGE_MAX,
      context.reason,
    ),
    responseIssueMessages: passthroughOrSentinel(
      issueMessages,
      ERROR_MESSAGE_MAX,
      context.reason,
    ),
    responseIssueCount: context.responseIssues?.length,
    responseShape: truncate(responseShapeJson, REDACTED_JSON_MAX),
    inputKeyCount:
      context.inputs === undefined
        ? undefined
        : Object.keys(context.inputs).length,
    inputShape: truncate(inputsJson, REDACTED_JSON_MAX),
    errorName:
      errorInfo && typeof errorInfo.name === 'string'
        ? truncate(errorInfo.name, ERROR_NAME_MAX)
        : undefined,
    errorMessage:
      errorInfo && typeof errorInfo.message === 'string'
        ? truncate(errorInfo.message, ERROR_MESSAGE_MAX)
        : undefined,
    errorStackHead:
      errorInfo && typeof errorInfo.stack === 'string'
        ? truncate(errorInfo.stack, ERROR_STACK_MAX)
        : undefined,
    userAgent: nav?.userAgent,
    vendor: nav?.vendor,
    userAgentBrands,
    userAgentMobile: userAgentData?.mobile,
    userAgentPlatform: userAgentData?.platform,
  };

  context.trackEvent(AnalyticsEvent.SnapResponseError, payload);
  if (errorKind === 'data_clone') {
    context.trackEvent(AnalyticsEvent.SnapDataCloneError, payload);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Window-level DataCloneError listener (`ClientDataCloneError`)
//
// The original NEYN-10935 reports show the error overlay AFTER the snap
// renders, which means the failure can also surface async — IndexedDB
// read by wagmi/Privy/wallet hydration, postMessage receive from the
// wallet iframe, Chrome extension. None of those propagate to the
// renderer's try/catch. This listener catches them at the page level via
// `window.onerror` and `unhandledrejection`.
//
// Idempotent: an internal guard ensures the listeners are only installed
// once per page even if `install` is called multiple times (React strict
// mode, hot reload, etc).
//
// We deliberately do *not* track which surface was rendering at the time —
// the prior prototype's active-snap mount counter was speculative
// correlation and added complexity without clear payoff. The page URL
// (`$current_url`, captured automatically by analytics) and event
// timestamp give enough context for triage.
// ─────────────────────────────────────────────────────────────────────────

type WindowTrackEvent = (
  event: AnalyticsEvent,
  data: Record<string, string | boolean | number | undefined>,
) => void;

let windowListenersInstalled = false;

/**
 * Install once-per-page `error` + `unhandledrejection` listeners that emit
 * `AnalyticsEvent.ClientDataCloneError` (and the strict-subset
 * `SnapDataCloneError`) when the captured error matches
 * {@link isDataCloneLikeError}. Passive: no `preventDefault`, no rethrow,
 * default browser behavior preserved. Safe to call multiple times.
 *
 * @returns an `uninstall` callback for tests / hot-reload teardown.
 */
export function installSnapWindowErrorListener(
  trackEvent: WindowTrackEvent,
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  if (windowListenersInstalled) {
    return () => {};
  }
  windowListenersInstalled = true;

  const onError = (event: ErrorEvent) => {
    // Cross-origin script errors and some async paths land here with
    // `event.error === null` and the actual error text only in
    // `event.message` (a raw string). `isDataCloneLikeError` requires an
    // object with a `message` property — wrap the string fallback so the
    // V8 phrase can still classify (Copilot review, PR #10038).
    const error: unknown =
      event.error ??
      (typeof event.message === 'string' && event.message.length > 0
        ? { message: event.message }
        : null);
    handleWindowDataClone({
      phase: 'window_error',
      error,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      trackEvent,
    });
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    handleWindowDataClone({
      phase: 'unhandled_rejection',
      error: event.reason,
      trackEvent,
    });
  };

  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);

  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
    windowListenersInstalled = false;
  };
}

type WindowHandlerContext = {
  phase: 'window_error' | 'unhandled_rejection';
  error: unknown;
  filename?: string;
  lineno?: number;
  colno?: number;
  trackEvent: WindowTrackEvent;
};

function handleWindowDataClone(ctx: WindowHandlerContext): void {
  // A listener that throws out into the page would be strictly worse than
  // no listener at all — wrap the whole body.
  try {
    if (!isDataCloneLikeError(ctx.error)) {
      return;
    }
    const error = ctx.error;
    const errorInfo =
      error && typeof error === 'object'
        ? {
            name: (error as { name?: unknown }).name,
            message: (error as { message?: unknown }).message,
            stack: (error as { stack?: unknown }).stack,
          }
        : { name: undefined, message: String(error), stack: undefined };

    const nav: Navigator | undefined =
      typeof navigator === 'undefined' ? undefined : navigator;
    const userAgentData = (nav as unknown as { userAgentData?: unknown })
      ?.userAgentData as
      | {
          brands?: Array<{ brand?: string; version?: string }>;
          mobile?: boolean;
          platform?: string;
        }
      | undefined;
    const userAgentBrands = userAgentData?.brands
      ?.map((b) => `${b.brand ?? '?'}/${b.version ?? '?'}`)
      .join(',');

    // eslint-disable-next-line no-console
    console.error('[client-data-clone-error]', {
      phase: ctx.phase,
      filename: ctx.filename,
      lineno: ctx.lineno,
      colno: ctx.colno,
      error: errorInfo,
    });

    const payload: Record<string, string | boolean | number | undefined> = {
      phase: ctx.phase,
      filename: ctx.filename,
      lineno: ctx.lineno,
      colno: ctx.colno,
      errorName:
        typeof errorInfo.name === 'string'
          ? truncate(errorInfo.name, ERROR_NAME_MAX)
          : undefined,
      errorMessage:
        typeof errorInfo.message === 'string'
          ? truncate(errorInfo.message, ERROR_MESSAGE_MAX)
          : undefined,
      errorStackHead:
        typeof errorInfo.stack === 'string'
          ? truncate(errorInfo.stack, ERROR_STACK_MAX)
          : undefined,
      userAgent: nav?.userAgent,
      vendor: nav?.vendor,
      userAgentBrands,
      userAgentMobile: userAgentData?.mobile,
      userAgentPlatform: userAgentData?.platform,
    };

    ctx.trackEvent(AnalyticsEvent.ClientDataCloneError, payload);
    // Keep the strict-subset dashboard consistent across all three channels.
    ctx.trackEvent(AnalyticsEvent.SnapDataCloneError, payload);
  } catch {
    /* listener must never escape */
  }
}

/**
 * Reset the install guard. Test-only — production code should call
 * {@link installSnapWindowErrorListener} once at app boot and never tear down.
 */
export function _resetWindowListenerForTests(): void {
  windowListenersInstalled = false;
}
