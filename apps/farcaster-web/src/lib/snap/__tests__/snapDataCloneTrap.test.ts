// @vitest-environment jsdom
import { AnalyticsEvent } from 'farcaster-analytics';

import {
  _resetWindowListenerForTests,
  classifyParseError,
  extractSnapIdFromUrl,
  installSnapWindowErrorListener,
  isDataCloneLikeError,
  logSnapParseError,
  logSnapResponseError,
  redactForTelemetry,
  safeStringify,
} from '~/lib/snap/snapDataCloneTrap';

describe('isDataCloneLikeError', () => {
  it('matches DOMException with name DataCloneError', () => {
    const err = { name: 'DataCloneError', message: 'whatever' };
    expect(isDataCloneLikeError(err)).toBe(true);
  });

  it('matches the V8 deserialize-cloned-data phrase regardless of name', () => {
    const err = new Error(
      'Unable to deserialize cloned data due to invalid or unsupported version.',
    );
    expect(isDataCloneLikeError(err)).toBe(true);
  });

  it('matches the "could not be cloned" serialize phrase', () => {
    const err = new Error('An object could not be cloned.');
    expect(isDataCloneLikeError(err)).toBe(true);
  });

  it('does not match unrelated errors', () => {
    expect(isDataCloneLikeError(new Error('HTTP 500'))).toBe(false);
    expect(isDataCloneLikeError(new SyntaxError('Unexpected token'))).toBe(
      false,
    );
    expect(isDataCloneLikeError(null)).toBe(false);
    expect(isDataCloneLikeError(undefined)).toBe(false);
    expect(isDataCloneLikeError('string')).toBe(false);
    expect(isDataCloneLikeError({})).toBe(false);
  });
});

describe('extractSnapIdFromUrl', () => {
  it('returns the UUID for a canonical snap-host URL', () => {
    expect(
      extractSnapIdFromUrl(
        'https://snap-host.farcaster.xyz/fa05683d-4ac9-4388-b6f8-505334c49e8c/',
      ),
    ).toBe('fa05683d-4ac9-4388-b6f8-505334c49e8c');
  });

  it('returns the UUID when followed by an action path', () => {
    expect(
      extractSnapIdFromUrl(
        'https://snap-host.farcaster.xyz/FA05683D-4AC9-4388-B6F8-505334C49E8C/next',
      ),
    ).toBe('fa05683d-4ac9-4388-b6f8-505334c49e8c');
  });

  it('returns undefined for non-snap-host URLs', () => {
    expect(extractSnapIdFromUrl('https://example.com/abc/')).toBeUndefined();
  });

  it('returns undefined when the first segment is not a UUID', () => {
    expect(
      extractSnapIdFromUrl('https://snap-host.farcaster.xyz/notauuid/foo'),
    ).toBeUndefined();
  });

  it('returns undefined for null / undefined / unparseable input', () => {
    expect(extractSnapIdFromUrl(null)).toBeUndefined();
    expect(extractSnapIdFromUrl(undefined)).toBeUndefined();
    expect(extractSnapIdFromUrl('not a url')).toBeUndefined();
  });
});

describe('safeStringify', () => {
  it('serializes plain objects', () => {
    expect(safeStringify({ a: 1 })).toBe('{"a":1}');
  });

  it('returns null for undefined', () => {
    expect(safeStringify(undefined)).toBeNull();
  });

  it('returns null for circular structures instead of throwing', () => {
    const obj: Record<string, unknown> = {};
    obj.self = obj;
    expect(safeStringify(obj)).toBeNull();
  });
});

describe('logSnapParseError', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('logs the full diagnostic payload', () => {
    logSnapParseError({
      phase: 'post_remote',
      snapDocumentUrl:
        'https://snap-host.farcaster.xyz/fa05683d-4ac9-4388-b6f8-505334c49e8c/next',
      target:
        'https://snap-host.farcaster.xyz/fa05683d-4ac9-4388-b6f8-505334c49e8c/vote',
      inputs: { choice: 'A' },
      responseBody: { kind: 'raw', text: '{"page":{}}' },
      cloneTarget: { page: {} },
      error: { name: 'DataCloneError', message: 'Unable to deserialize' },
    });

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const [tag, payload] = consoleSpy.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(tag).toBe('[snap-parse-error]');
    expect(payload.snapId).toBe('fa05683d-4ac9-4388-b6f8-505334c49e8c');
    expect(payload.phase).toBe('post_remote');
    expect(payload.target).toBe(
      'https://snap-host.farcaster.xyz/fa05683d-4ac9-4388-b6f8-505334c49e8c/vote',
    );
    expect(payload.inputs).toEqual({ choice: 'A' });
    expect(payload.responseBody).toEqual({
      kind: 'raw',
      text: '{"page":{}}',
    });
    expect(payload.cloneTarget).toEqual({ page: {} });
    expect((payload.error as { name?: string }).name).toBe('DataCloneError');
  });

  it('tolerates a non-Error throwable', () => {
    logSnapParseError({
      phase: 'get_direct',
      snapDocumentUrl: 'https://example.com/snap',
      responseBody: { kind: 'raw', text: null },
      cloneTarget: undefined,
      error: 'plain string error',
    });
    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });

  it('does not fire a trackEvent call when no callback is supplied', () => {
    logSnapParseError({
      phase: 'get_direct',
      snapDocumentUrl: 'https://example.com/snap',
      responseBody: { kind: 'raw', text: null },
      cloneTarget: undefined,
      error: new Error('boom'),
    });
    // Only the console.error side fires.
    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });

  it('emits both SnapParseError and SnapDataCloneError when the error is data-clone-like', () => {
    const trackEvent = vi.fn();
    logSnapParseError({
      phase: 'post_remote',
      snapDocumentUrl:
        'https://snap-host.farcaster.xyz/fa05683d-4ac9-4388-b6f8-505334c49e8c/?utm=x',
      target:
        'https://snap-host.farcaster.xyz/fa05683d-4ac9-4388-b6f8-505334c49e8c/vote',
      inputs: { choice: 'user-typed-text-that-must-not-leak' },
      responseBody: {
        kind: 'raw',
        text: '{"page":{"label":"hello world","conversationId":"fa05683d-4ac9-4388-b6f8-505334c49e8c"}}',
      },
      cloneTarget: {
        page: {
          label: 'hello world',
          conversationId: 'fa05683d-4ac9-4388-b6f8-505334c49e8c',
        },
      },
      error: new Error(
        'Unable to deserialize cloned data due to invalid or unsupported version.',
      ),
      trackEvent,
    });

    // Broad event always fires; narrow event fires only when classifier
    // matches `data_clone`. Both carry the same payload by design.
    expect(trackEvent).toHaveBeenCalledTimes(2);
    const eventNames = trackEvent.mock.calls.map((c) => c[0]);
    expect(eventNames).toContain(AnalyticsEvent.SnapParseError);
    expect(eventNames).toContain(AnalyticsEvent.SnapDataCloneError);
    const [, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    expect(props.errorKind).toBe('data_clone');
    expect(props.phase).toBe('post_remote');
    expect(props.snapId).toBe('fa05683d-4ac9-4388-b6f8-505334c49e8c');
    // snapUrl strips the query string so utm tags don't ride along.
    expect(props.snapUrl).toBe(
      'https://snap-host.farcaster.xyz/fa05683d-4ac9-4388-b6f8-505334c49e8c/',
    );
    expect(props.target).toBe(
      'https://snap-host.farcaster.xyz/fa05683d-4ac9-4388-b6f8-505334c49e8c/vote',
    );
    expect(props.inputKeyCount).toBe(1);
    // Critically: the raw input string never appears in props.
    expect(JSON.stringify(props)).not.toContain('user-typed-text');
    // Critically: the user-content "hello world" never appears either.
    expect(JSON.stringify(props)).not.toContain('hello world');
    // But the conversationId — public — must survive redaction so support
    // can correlate the event to a specific snap.
    expect(props.cloneTargetShape).toContain(
      'fa05683d-4ac9-4388-b6f8-505334c49e8c',
    );
    expect(props.responseBodyKind).toBe('raw');
    expect(props.responseBodyLength).toBeGreaterThan(0);
    expect(props.errorName).toBe('Error');
    expect(props.errorMessage).toContain('Unable to deserialize cloned data');
  });

  it('emits a redacted responseBodyShape when the raw bytes are held', () => {
    const trackEvent = vi.fn();
    logSnapParseError({
      phase: 'get_direct',
      snapDocumentUrl: 'https://snap-host.farcaster.xyz/aaa/',
      responseBody: {
        kind: 'raw',
        text: '{"page":{"label":"secret-user-text","count":3}}',
      },
      cloneTarget: { page: { label: 'mutated', count: 3 } },
      error: { name: 'DataCloneError', message: 'bad' },
      trackEvent,
    });
    const [, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    // responseBodyShape comes from re-parsing the raw text — verifies the
    // pre-clone shape independent of the (potentially mutated) cloneTarget.
    expect(typeof props.responseBodyShape).toBe('string');
    expect(props.responseBodyShape).toContain('count');
    expect(props.responseBodyShape).toContain('<string:16>'); // "secret-user-text"
    expect(props.responseBodyShape).not.toContain('secret-user-text');
    // cloneTargetShape reflects the (mutated) parsed object — distinct from
    // responseBodyShape so a divergence between them is visible.
    expect(props.cloneTargetShape).toContain('<string:7>'); // "mutated"
  });

  it('tags an unparseable raw response body rather than throwing', () => {
    const trackEvent = vi.fn();
    logSnapParseError({
      phase: 'get_direct',
      snapDocumentUrl: 'https://snap-host.farcaster.xyz/aaa/',
      responseBody: {
        kind: 'raw',
        text: '<html>oops</html>',
      },
      cloneTarget: null,
      error: { name: 'DataCloneError', message: 'bad' },
      trackEvent,
    });
    const [, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    expect(props.responseBodyShape).toMatch(/^<unparseable-body:length:\d+>$/);
  });

  it('omits responseBodyShape for the reconstructed kind', () => {
    const trackEvent = vi.fn();
    logSnapParseError({
      phase: 'post_remote',
      snapDocumentUrl: 'https://snap-host.farcaster.xyz/aaa/',
      target: 'https://snap-host.farcaster.xyz/aaa/next',
      responseBody: { kind: 'reconstructed', text: '{"page":{}}' },
      cloneTarget: { page: {} },
      error: { name: 'DataCloneError', message: 'bad' },
      trackEvent,
    });
    const [, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    // reconstructed = JSON.stringify(parsed), so its shape is identical to
    // cloneTargetShape — no need to send it twice.
    expect(props.responseBodyShape).toBeUndefined();
    expect(props.cloneTargetShape).toContain('page');
  });

  it('does not throw out of the caller when trackEvent itself throws', () => {
    const trackEvent = vi.fn(() => {
      throw new Error('posthog adapter exploded');
    });
    expect(() =>
      logSnapParseError({
        phase: 'post_remote',
        snapDocumentUrl: 'https://snap-host.farcaster.xyz/aaa/',
        responseBody: { kind: 'raw', text: '{}' },
        cloneTarget: {},
        error: new Error('boom'),
        trackEvent,
      }),
    ).not.toThrow();
    // Two console.errors: the primary diagnostic + the trap-failed breadcrumb.
    expect(consoleSpy.mock.calls.length).toBeGreaterThanOrEqual(1);
    const tags = consoleSpy.mock.calls.map((c) => c[0]);
    expect(tags).toContain('[snap-parse-error:trap-failed]');
  });

  it('does not throw when the cloneTarget has a throwing getter', () => {
    const trackEvent = vi.fn();
    const exploder = {} as Record<string, unknown>;
    Object.defineProperty(exploder, 'boom', {
      enumerable: true,
      get() {
        throw new Error('nope');
      },
    });
    exploder.fine = 'value';
    expect(() =>
      logSnapParseError({
        phase: 'post_remote',
        snapDocumentUrl: 'https://snap-host.farcaster.xyz/aaa/',
        cloneTarget: exploder,
        error: new Error('boom'),
        trackEvent,
      }),
    ).not.toThrow();
    expect(trackEvent).toHaveBeenCalledTimes(1);
    const [, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    // The throwing key is tagged; the rest of the object still redacts.
    expect(props.cloneTargetShape).toContain('<getter-threw>');
    expect(props.cloneTargetShape).toContain('fine');
  });

  it('truncates a huge error stack and a huge redacted shape', () => {
    const trackEvent = vi.fn();
    const huge = 'a'.repeat(20000);
    const err = new Error('boom');
    err.stack = huge;
    logSnapParseError({
      phase: 'get_proxy',
      snapDocumentUrl: 'https://snap-host.farcaster.xyz/aaa/',
      // Very long array forces the shape JSON to exceed the 8k cap.
      cloneTarget: Array.from({ length: 10000 }, (_, i) => `value-${i}`),
      error: err,
      trackEvent,
    });
    const [, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    // Stack head includes the truncation sentinel rather than the whole stack.
    expect(props.errorStackHead).toMatch(/<truncated:/);
    expect((props.errorStackHead as string).length).toBeLessThanOrEqual(
      2000 + '…<truncated:99999>'.length,
    );
    // Either the array-cap or the JSON-cap fires; both leave a truncation marker.
    expect(props.cloneTargetShape).toMatch(/truncated|array-truncated|more/);
  });
});

describe('redactForTelemetry', () => {
  it('replaces string leaves with length sentinels', () => {
    expect(redactForTelemetry('hello')).toBe('<string:5>');
    expect(redactForTelemetry({ a: 'abcdef' })).toEqual({ a: '<string:6>' });
  });

  it('passes numbers, booleans, and null through unchanged', () => {
    expect(redactForTelemetry({ n: 42, b: true, z: null })).toEqual({
      n: 42,
      b: true,
      z: null,
    });
  });

  it('keeps the snapId raw under the passthrough key', () => {
    expect(
      redactForTelemetry({
        snapId: 'fa05683d-4ac9-4388-b6f8-505334c49e8c',
        title: 'user title',
      }),
    ).toEqual({
      snapId: 'fa05683d-4ac9-4388-b6f8-505334c49e8c',
      title: '<string:10>',
    });
  });

  it('keeps the conversationId raw under each passthrough key variant', () => {
    expect(
      redactForTelemetry({
        conversation_id: 'abc-123',
        conversationID: 'abc-123',
        conversationId: 'abc-123',
        snap_id: 'abc-123',
        snapID: 'abc-123',
      }),
    ).toEqual({
      conversation_id: 'abc-123',
      conversationID: 'abc-123',
      conversationId: 'abc-123',
      snap_id: 'abc-123',
      snapID: 'abc-123',
    });
  });

  it('tags non-plain objects with their constructor name', () => {
    class Wallet {
      address = '0xabcdef';
    }
    const result = redactForTelemetry({ wallet: new Wallet() });
    expect(result).toEqual({
      wallet: { __type: 'Wallet', address: '<string:8>' },
    });
  });

  it('tags Dates without leaking the timestamp', () => {
    // The ISO string of a snap-supplied Date is user-controllable content,
    // so the sentinel must be value-free.
    expect(
      redactForTelemetry({
        created: new Date('2026-01-01T00:00:00.000Z'),
      }),
    ).toEqual({ created: '<Date>' });
    expect(
      JSON.stringify(redactForTelemetry(new Date('2026-01-01'))),
    ).not.toContain('2026');
    expect(redactForTelemetry(new Date(NaN))).toBe('<Date:invalid>');
  });

  it('tags ArrayBuffers and TypedArrays by type and length', () => {
    const ab = new ArrayBuffer(8);
    const result = redactForTelemetry({
      blob: ab,
      bytes: new Uint8Array([1, 2, 3]),
    });
    expect(result).toEqual({
      blob: '<ArrayBuffer:bytes:8>',
      bytes: '<Uint8Array:length:3>',
    });
  });

  it('tags Maps and Sets without enumerating contents', () => {
    expect(
      redactForTelemetry({
        m: new Map([['k', 'v']]),
        s: new Set(['x', 'y']),
      }),
    ).toEqual({
      m: '<Map:size:1>',
      s: '<Set:size:2>',
    });
  });

  it('short-circuits true ancestor-chain cycles', () => {
    const a: Record<string, unknown> = {};
    a.self = a;
    expect(redactForTelemetry(a)).toEqual({ self: '<cycle>' });
  });

  it('does not mistake DAG repeats for cycles', () => {
    // The same `shared` object reached via two siblings is a DAG repeat, not
    // a cycle — both branches should redact independently rather than the
    // second one being silently collapsed to `<cycle>`.
    const shared = { color: 'red', count: 7 };
    const result = redactForTelemetry({ left: shared, right: shared });
    expect(result).toEqual({
      left: { color: '<string:3>', count: 7 },
      right: { color: '<string:3>', count: 7 },
    });
  });

  it('caps array length and tags the overflow', () => {
    const arr = Array.from({ length: 100 }, (_, i) => i);
    const result = redactForTelemetry(arr, { maxArrayLength: 3 }) as unknown[];
    expect(result.slice(0, 3)).toEqual([0, 1, 2]);
    expect(result[3]).toMatch(/^<array-truncated:/);
  });

  it('caps object key count and tags the overflow', () => {
    const obj = Object.fromEntries(
      Array.from({ length: 100 }, (_, i) => [`k${i}`, i]),
    );
    const result = redactForTelemetry(obj, { maxObjectKeys: 3 }) as Record<
      string,
      unknown
    >;
    expect(Object.keys(result).filter((k) => !k.startsWith('__'))).toHaveLength(
      3,
    );
    expect(result.__truncated).toMatch(/97-more-keys/);
  });

  it('caps depth and tags overflow', () => {
    const deep = { a: { b: { c: { d: { e: { f: 'leaf' } } } } } };
    const result = redactForTelemetry(deep, { maxDepth: 2 });
    expect(JSON.stringify(result)).toContain('<max-depth>');
  });

  it('tags unsupported primitives', () => {
    const fn = () => {};
    const sym = Symbol('x');
    expect(redactForTelemetry({ fn, sym, u: undefined })).toEqual({
      fn: '<function>',
      sym: '<symbol>',
      u: '<undefined>',
    });
  });

  it('tags BigInts by digit count without leaking the value', () => {
    // BigInts could be wallet balances — drop the value, keep the magnitude
    // class so a "BigInt at this path" diagnostic is still useful.
    expect(redactForTelemetry({ b: 12345n })).toEqual({
      b: '<bigint:digits:5>',
    });
    // Sign is not part of the digit count.
    expect(redactForTelemetry({ b: -12345n })).toEqual({
      b: '<bigint:digits:5>',
    });
    expect(JSON.stringify(redactForTelemetry({ b: 12345n }))).not.toContain(
      '12345',
    );
  });
});

describe('classifyParseError', () => {
  it('returns "data_clone" for the V8 deserialize phrase', () => {
    expect(
      classifyParseError(
        new Error(
          'Unable to deserialize cloned data due to invalid or unsupported version.',
        ),
      ),
    ).toBe('data_clone');
    expect(
      classifyParseError({ name: 'DataCloneError', message: 'whatever' }),
    ).toBe('data_clone');
  });

  it('returns "json" for SyntaxError', () => {
    expect(classifyParseError(new SyntaxError('Unexpected token'))).toBe(
      'json',
    );
  });

  it('returns "validation" for the validateAndParseSnap prefix', () => {
    expect(classifyParseError(new Error('Invalid snap: missing field'))).toBe(
      'validation',
    );
  });

  it('returns "unknown" for anything else', () => {
    expect(classifyParseError(new Error('Network failed'))).toBe('unknown');
    expect(classifyParseError(null)).toBe('unknown');
    expect(classifyParseError('not an error')).toBe('unknown');
  });
});

describe('logSnapParseError — broad event emission', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('fires SnapParseError but NOT SnapDataCloneError for a validation error', () => {
    const trackEvent = vi.fn();
    logSnapParseError({
      phase: 'get_proxy',
      snapDocumentUrl: 'https://snap-host.farcaster.xyz/aaa/',
      cloneTarget: { not: 'a snap' },
      error: new Error('Invalid snap: missing field "page"'),
      trackEvent,
    });
    expect(trackEvent).toHaveBeenCalledTimes(1);
    const [eventName, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    expect(eventName).toBe(AnalyticsEvent.SnapParseError);
    expect(props.errorKind).toBe('validation');
  });

  it('fires SnapParseError but NOT SnapDataCloneError for a JSON syntax error', () => {
    const trackEvent = vi.fn();
    logSnapParseError({
      phase: 'get_direct',
      snapDocumentUrl: 'https://snap-host.farcaster.xyz/aaa/',
      responseBody: { kind: 'raw', text: 'not-json' },
      cloneTarget: undefined,
      error: new SyntaxError('Unexpected token'),
      trackEvent,
    });
    expect(trackEvent).toHaveBeenCalledTimes(1);
    const [eventName, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    expect(eventName).toBe(AnalyticsEvent.SnapParseError);
    expect(props.errorKind).toBe('json');
  });

  it('still fires both events for a data-clone error (strict-subset semantics)', () => {
    const trackEvent = vi.fn();
    logSnapParseError({
      phase: 'post_remote',
      snapDocumentUrl: 'https://snap-host.farcaster.xyz/aaa/',
      cloneTarget: {},
      error: { name: 'DataCloneError', message: 'bad' },
      trackEvent,
    });
    expect(trackEvent).toHaveBeenCalledTimes(2);
    const names = trackEvent.mock.calls.map((c) => c[0]);
    expect(names).toEqual([
      AnalyticsEvent.SnapParseError,
      AnalyticsEvent.SnapDataCloneError,
    ]);
  });
});

describe('logSnapResponseError', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('emits SnapResponseError + SnapDataCloneError when the backend forwards the V8 phrase', () => {
    // This is the NEYN-10935 theory the parse trap cannot observe: the
    // backend returns `result.success: false` with the deserialization
    // message in `response.error`, the renderer surfaces it via `onError`,
    // and the user sees the V8 string in the snap UI overlay — but no
    // client-side throw happens, so logSnapParseError never fires.
    const trackEvent = vi.fn();
    logSnapResponseError({
      phase: 'post_remote',
      reason: 'result_unsuccessful',
      statusCode: 200,
      snapDocumentUrl:
        'https://snap-host.farcaster.xyz/fa05683d-4ac9-4388-b6f8-505334c49e8c/',
      target:
        'https://snap-host.farcaster.xyz/fa05683d-4ac9-4388-b6f8-505334c49e8c/next',
      inputs: { choice: 'A' },
      displayedMessage:
        'Unable to deserialize cloned data due to invalid or unsupported version.',
      responseError:
        'Unable to deserialize cloned data due to invalid or unsupported version.',
      response: {
        error:
          'Unable to deserialize cloned data due to invalid or unsupported version.',
      },
      trackEvent,
    });

    expect(trackEvent).toHaveBeenCalledTimes(2);
    const names = trackEvent.mock.calls.map((c) => c[0]);
    expect(names).toEqual([
      AnalyticsEvent.SnapResponseError,
      AnalyticsEvent.SnapDataCloneError,
    ]);
    const [, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    expect(props.errorKind).toBe('data_clone');
    expect(props.reason).toBe('result_unsuccessful');
    expect(props.statusCode).toBe(200);
    expect(props.snapId).toBe('fa05683d-4ac9-4388-b6f8-505334c49e8c');
    // The two text fields here pass through verbatim only because the
    // displayed/response strings are *exact-equality* matches against the
    // canonical V8 phrase in `CANONICAL_SAFE_V8_MESSAGES`. Anything else
    // publisher-controlled gets redacted to a `<string:N>` sentinel — see
    // the next two tests for the redacted-default behavior.
    expect(props.displayedMessage).toContain('Unable to deserialize');
    expect(props.responseError).toContain('Unable to deserialize');
  });

  it('classifies as "unknown" and redacts publisher-controlled strings to length sentinels', () => {
    // Publisher backends control these fields and validators commonly echo
    // user input — Copilot review on PR #10038 flagged this as a leak risk.
    // Verify that "Invalid input" / "inputs.choice: required" etc come back
    // as `<string:N>` sentinels, not verbatim.
    const trackEvent = vi.fn();
    logSnapResponseError({
      phase: 'post_remote',
      reason: 'result_unsuccessful',
      statusCode: 200,
      snapDocumentUrl: 'https://snap-host.farcaster.xyz/aaa/',
      target: 'https://snap-host.farcaster.xyz/aaa/next',
      displayedMessage: 'Invalid input',
      responseError: 'Invalid input',
      responseIssues: [{ message: 'inputs.choice: required' }],
      response: { error: 'Invalid input', issues: [{ message: 'required' }] },
      trackEvent,
    });

    expect(trackEvent).toHaveBeenCalledTimes(1);
    const [eventName, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    expect(eventName).toBe(AnalyticsEvent.SnapResponseError);
    expect(props.errorKind).toBe('unknown');
    expect(props.responseIssueCount).toBe(1);
    // None of the publisher-controlled strings flow through verbatim.
    expect(props.displayedMessage).toBe('<string:13>'); // "Invalid input"
    expect(props.responseError).toBe('<string:13>');
    expect(props.responseIssueMessages).toBe('<string:23>'); // "inputs.choice: required"
    expect(JSON.stringify(props)).not.toContain('inputs.choice');
    expect(JSON.stringify(props)).not.toContain('Invalid input');
  });

  it('redacts a publisher message that wraps an allowlisted phrase with extra content', () => {
    // Copilot review round 2 (PR #10038): the prior `includes`-based
    // allowlist let `"Snap returned HTTP 500: cory@example.com"` slip
    // through. The tightened canonical-equality + bounded-regex check
    // must reject anything other than the exact runtime/client strings.
    const trackEvent = vi.fn();
    logSnapResponseError({
      phase: 'post_localhost',
      reason: 'http_status',
      statusCode: 500,
      snapDocumentUrl: 'http://localhost:3000/snap',
      displayedMessage: 'Snap returned HTTP 500: cory@example.com',
      responseError: 'Snap returned HTTP 500: cory@example.com',
      trackEvent,
    });
    const [, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    expect(JSON.stringify(props)).not.toContain('cory@example.com');
    expect(props.displayedMessage).toMatch(/^<string:\d+>$/);
    expect(props.responseError).toMatch(/^<string:\d+>$/);
  });

  it('redacts a client-shaped message when the reason does not match', () => {
    // Even an exact match like `"Snap returned HTTP 500"` is publisher-
    // controlled when it lands inside a `result_unsuccessful` response, so
    // the reason gate must reject it. Only the actual `http_status` /
    // `non_json_content_type` paths get to use those forms.
    const trackEvent = vi.fn();
    logSnapResponseError({
      phase: 'post_remote',
      reason: 'result_unsuccessful',
      statusCode: 200,
      snapDocumentUrl: 'https://snap-host.farcaster.xyz/aaa/',
      displayedMessage: 'Snap returned HTTP 500',
      responseError: 'Snap returned HTTP 500',
      response: { error: 'Snap returned HTTP 500' },
      trackEvent,
    });
    const [, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    expect(props.displayedMessage).toBe('<string:22>');
    expect(props.responseError).toBe('<string:22>');
  });

  it('redacts an over-long or weird content-type even on the non_json_content_type path', () => {
    const trackEvent = vi.fn();
    logSnapResponseError({
      phase: 'post_localhost',
      reason: 'non_json_content_type',
      snapDocumentUrl: 'http://localhost:3000/snap',
      // Tail goes past the bounded-regex limit; falls back to redaction.
      displayedMessage: `Snap returned non-JSON content-type: ${'x'.repeat(200)}`,
      trackEvent,
    });
    const [, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    expect(props.displayedMessage).toMatch(/^<string:\d+>$/);
  });

  it('passes a well-formed non-JSON content-type message through verbatim', () => {
    const trackEvent = vi.fn();
    logSnapResponseError({
      phase: 'post_localhost',
      reason: 'non_json_content_type',
      snapDocumentUrl: 'http://localhost:3000/snap',
      displayedMessage:
        'Snap returned non-JSON content-type: text/html; charset=utf-8',
      trackEvent,
    });
    const [, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    expect(props.displayedMessage).toBe(
      'Snap returned non-JSON content-type: text/html; charset=utf-8',
    );
  });

  it('does NOT classify a publisher-spoofed V8 substring as data_clone', () => {
    // Copilot review round 4 (PR #10038): `displayedMessage` is publisher-
    // controlled in the result_unsuccessful path. Substring classification
    // would let a backend dirty the strict `SnapDataCloneError` dashboard
    // event by embedding the V8 phrase in an arbitrary string. Response
    // trap classification uses exact equality, so this resolves to
    // `unknown` and only the broad `SnapResponseError` fires.
    const trackEvent = vi.fn();
    logSnapResponseError({
      phase: 'post_remote',
      reason: 'result_unsuccessful',
      snapDocumentUrl: 'https://snap-host.farcaster.xyz/aaa/',
      displayedMessage:
        'Custom: Unable to deserialize cloned data ATTACK_PAYLOAD',
      responseError: 'Custom: Unable to deserialize cloned data ATTACK_PAYLOAD',
      response: {},
      trackEvent,
    });
    expect(trackEvent).toHaveBeenCalledTimes(1);
    const [eventName, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    expect(eventName).toBe(AnalyticsEvent.SnapResponseError);
    expect(props.errorKind).toBe('unknown');
    // Payload's text fields are also redacted to sentinels (allowlist also
    // requires exact-equality), so the attack string never reaches telemetry.
    expect(JSON.stringify(props)).not.toContain('ATTACK_PAYLOAD');
  });

  it('caps the responseIssues join so a huge backend payload bounds client work', () => {
    // Copilot review round 3 (PR #10038): a publisher returning thousands
    // of issues with long messages would otherwise allocate a multi-MB
    // intermediate string just to throw it away in `passthroughOrSentinel`.
    // The trap caps to the first N issues, truncates each, and tags the
    // overflow.
    const trackEvent = vi.fn();
    const giantIssues = Array.from({ length: 5000 }, (_, i) => ({
      message: `issue-${i}-${'x'.repeat(2000)}`,
    }));
    logSnapResponseError({
      phase: 'post_remote',
      reason: 'result_unsuccessful',
      snapDocumentUrl: 'https://snap-host.farcaster.xyz/aaa/',
      displayedMessage: 'Invalid input',
      responseIssues: giantIssues,
      response: {},
      trackEvent,
    });
    const [, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    // The full count survives so triage can still see the magnitude…
    expect(props.responseIssueCount).toBe(5000);
    // …but the joined preview is sentinel'd (publisher-controlled), and the
    // sentinel's length is bounded by the cap, not by the raw input size.
    // 20 issues * ~207 chars + separators + overflow tag is well under 5KB.
    expect(props.responseIssueMessages).toMatch(/^<string:\d+>$/);
    const sizeMatch = (props.responseIssueMessages as string).match(
      /^<string:(\d+)>$/,
    );
    const reportedSize = sizeMatch ? Number(sizeMatch[1]) : Infinity;
    expect(reportedSize).toBeLessThan(5_000);
  });

  it('redacts user-controllable text in responseError even when it could match V8 substrings ambiguously', () => {
    // Belt-and-braces: a publisher message that *contains* an email or
    // similar PII but doesn't match a known-safe phrase must be sentinel'd.
    const trackEvent = vi.fn();
    logSnapResponseError({
      phase: 'post_remote',
      reason: 'result_unsuccessful',
      snapDocumentUrl: 'https://snap-host.farcaster.xyz/aaa/',
      displayedMessage: 'User cory@example.com is not allowed',
      responseError: 'User cory@example.com is not allowed',
      response: { error: 'User cory@example.com is not allowed' },
      trackEvent,
    });
    const [, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    expect(JSON.stringify(props)).not.toContain('cory@example.com');
    expect(props.displayedMessage).toMatch(/^<string:\d+>$/);
    expect(props.responseError).toMatch(/^<string:\d+>$/);
  });

  it('redacts the response body shape', () => {
    const trackEvent = vi.fn();
    logSnapResponseError({
      phase: 'post_remote',
      reason: 'result_unsuccessful',
      snapDocumentUrl: 'https://snap-host.farcaster.xyz/aaa/',
      displayedMessage: 'Invalid input',
      response: {
        error: 'Invalid input',
        secret: 'user-typed-text',
      },
      trackEvent,
    });
    const [, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    // responseShape goes through the redactor — the user-typed string at a
    // non-passthrough key becomes a length sentinel.
    expect(typeof props.responseShape).toBe('string');
    expect(props.responseShape).not.toContain('user-typed-text');
    expect(props.responseShape).toContain('<string:15>');
  });

  it('emits for the localhost HTTP-status pre-reject', () => {
    const trackEvent = vi.fn();
    logSnapResponseError({
      phase: 'post_localhost',
      reason: 'http_status',
      statusCode: 500,
      snapDocumentUrl: 'http://localhost:3000/snap',
      target: 'http://localhost:3000/snap/next',
      displayedMessage: 'Snap returned HTTP 500',
      trackEvent,
    });
    expect(trackEvent).toHaveBeenCalledTimes(1);
    const [, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    expect(props.phase).toBe('post_localhost');
    expect(props.reason).toBe('http_status');
    expect(props.statusCode).toBe(500);
    expect(props.errorKind).toBe('unknown');
    // "Snap returned HTTP …" is in the known-safe allowlist (it's a string
    // we construct ourselves, not a backend echo) — passes through verbatim.
    expect(props.displayedMessage).toBe('Snap returned HTTP 500');
  });

  it('emits for the get_direct HTTP-status early-bail (NEYN-11447 gap 1)', () => {
    const trackEvent = vi.fn();
    logSnapResponseError({
      phase: 'get_direct',
      reason: 'http_status',
      statusCode: 503,
      snapDocumentUrl:
        'https://snap-host.farcaster.xyz/fa05683d-4ac9-4388-b6f8-505334c49e8c/',
      displayedMessage: 'Snap returned HTTP 503',
      trackEvent,
    });
    expect(trackEvent).toHaveBeenCalledTimes(1);
    const [eventName, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    expect(eventName).toBe(AnalyticsEvent.SnapResponseError);
    expect(props.phase).toBe('get_direct');
    expect(props.reason).toBe('http_status');
    expect(props.statusCode).toBe(503);
    expect(props.snapId).toBe('fa05683d-4ac9-4388-b6f8-505334c49e8c');
    expect(props.displayedMessage).toBe('Snap returned HTTP 503');
  });

  it('emits for the get_direct content-type early-bail with a well-formed Content-Type', () => {
    // Uses `unexpected_content_type` because the GET-path predicate requires
    // the snap-specific media type (`application/vnd.farcaster.snap+json`).
    // A server returning plain `application/json` would also land here — so
    // labelling it as "non-JSON" would mislead operators reading the
    // dashboard (Copilot review, PR #10110).
    const trackEvent = vi.fn();
    logSnapResponseError({
      phase: 'get_direct',
      reason: 'unexpected_content_type',
      statusCode: 200,
      snapDocumentUrl: 'https://snap-host.farcaster.xyz/aaa/',
      displayedMessage:
        'Snap returned unexpected content-type: application/json',
      trackEvent,
    });
    const [, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    expect(props.phase).toBe('get_direct');
    expect(props.reason).toBe('unexpected_content_type');
    // Client-constructed phrase under the matching reason — passes through.
    expect(props.displayedMessage).toBe(
      'Snap returned unexpected content-type: application/json',
    );
  });

  it('redacts an `unexpected_content_type` message that does not match the bounded pattern', () => {
    // Parity with the existing `non_json_content_type` redaction test —
    // ensure the `unexpected_content_type` allowlist is just as strict.
    const trackEvent = vi.fn();
    logSnapResponseError({
      phase: 'get_direct',
      reason: 'unexpected_content_type',
      statusCode: 200,
      snapDocumentUrl: 'https://snap-host.farcaster.xyz/aaa/',
      // Tail goes past the bounded-regex limit; falls back to redaction.
      displayedMessage: `Snap returned unexpected content-type: ${'x'.repeat(200)}`,
      trackEvent,
    });
    const [, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    expect(props.displayedMessage).toMatch(/^<string:\d+>$/);
  });

  it('emits for a network_error and surfaces the thrown error info (NEYN-11447 gap 2)', () => {
    const trackEvent = vi.fn();
    const err = new TypeError('Failed to fetch');
    err.stack = 'TypeError: Failed to fetch\n    at fetch (https://...)';
    logSnapResponseError({
      phase: 'post_remote',
      reason: 'network_error',
      snapDocumentUrl:
        'https://snap-host.farcaster.xyz/fa05683d-4ac9-4388-b6f8-505334c49e8c/',
      target:
        'https://snap-host.farcaster.xyz/fa05683d-4ac9-4388-b6f8-505334c49e8c/vote',
      inputs: { choice: 'user-typed-text-that-must-not-leak' },
      displayedMessage: 'Snap request failed',
      error: err,
      trackEvent,
    });
    expect(trackEvent).toHaveBeenCalledTimes(1);
    const [eventName, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    expect(eventName).toBe(AnalyticsEvent.SnapResponseError);
    expect(props.reason).toBe('network_error');
    expect(props.snapId).toBe('fa05683d-4ac9-4388-b6f8-505334c49e8c');
    // Client-constructed sentinel phrase passes through under network_error.
    expect(props.displayedMessage).toBe('Snap request failed');
    expect(props.errorName).toBe('TypeError');
    expect(props.errorMessage).toBe('Failed to fetch');
    expect(props.errorStackHead).toContain('TypeError: Failed to fetch');
    // Inputs are still redacted to a shape — raw input text never appears.
    expect(JSON.stringify(props)).not.toContain('user-typed-text');
    expect(props.inputKeyCount).toBe(1);
  });

  it('redacts a publisher-shaped string under the network_error reason', () => {
    // Allowlist for `network_error` is `Snap request failed` exact-match
    // only — a publisher-crafted variant must still get sentinel'd.
    const trackEvent = vi.fn();
    logSnapResponseError({
      phase: 'post_remote',
      reason: 'network_error',
      snapDocumentUrl: 'https://snap-host.farcaster.xyz/aaa/',
      displayedMessage: 'Snap request failed: cory@example.com',
      error: new Error('boom'),
      trackEvent,
    });
    const [, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    expect(JSON.stringify(props)).not.toContain('cory@example.com');
    expect(props.displayedMessage).toMatch(/^<string:\d+>$/);
  });

  it('tolerates a non-object thrown error in the network_error path', () => {
    const trackEvent = vi.fn();
    logSnapResponseError({
      phase: 'post_remote',
      reason: 'network_error',
      snapDocumentUrl: 'https://snap-host.farcaster.xyz/aaa/',
      displayedMessage: 'Snap request failed',
      error: 'plain string thrown',
      trackEvent,
    });
    expect(trackEvent).toHaveBeenCalledTimes(1);
    const [, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    expect(props.errorName).toBeUndefined();
    // String body captured via String(error), truncated under cap.
    expect(props.errorMessage).toBe('plain string thrown');
  });

  it('does not throw out of the caller when trackEvent itself throws', () => {
    const trackEvent = vi.fn(() => {
      throw new Error('posthog exploded');
    });
    expect(() =>
      logSnapResponseError({
        phase: 'post_remote',
        reason: 'result_unsuccessful',
        snapDocumentUrl: 'https://snap-host.farcaster.xyz/aaa/',
        displayedMessage: 'boom',
        response: {},
        trackEvent,
      }),
    ).not.toThrow();
    const tags = consoleSpy.mock.calls.map((c) => c[0]);
    expect(tags).toContain('[snap-response-error:trap-failed]');
  });
});

describe('installSnapWindowErrorListener', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let uninstall: () => void;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    _resetWindowListenerForTests();
    uninstall = () => {};
  });

  afterEach(() => {
    uninstall();
    consoleSpy.mockRestore();
    _resetWindowListenerForTests();
  });

  it('emits ClientDataCloneError + SnapDataCloneError on a window error matching the V8 phrase', () => {
    const trackEvent = vi.fn();
    uninstall = installSnapWindowErrorListener(trackEvent);

    const errorEvent = new ErrorEvent('error', {
      error: new Error(
        'Unable to deserialize cloned data due to invalid or unsupported version.',
      ),
      message: 'caught by window',
      filename: 'https://farcaster.xyz/some-bundle.js',
      lineno: 42,
      colno: 7,
    });
    window.dispatchEvent(errorEvent);

    expect(trackEvent).toHaveBeenCalledTimes(2);
    const names = trackEvent.mock.calls.map((c) => c[0]);
    expect(names).toEqual([
      AnalyticsEvent.ClientDataCloneError,
      AnalyticsEvent.SnapDataCloneError,
    ]);
    const [, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    expect(props.phase).toBe('window_error');
    expect(props.filename).toBe('https://farcaster.xyz/some-bundle.js');
    expect(props.lineno).toBe(42);
    expect(props.errorMessage).toContain('Unable to deserialize cloned data');
  });

  it('emits on an unhandledrejection with the V8 phrase', () => {
    const trackEvent = vi.fn();
    uninstall = installSnapWindowErrorListener(trackEvent);

    // PromiseRejectionEvent is not constructable in jsdom — synthesize.
    const reason = new DOMException('serialize failed', 'DataCloneError');
    const rejectionEvent = new Event(
      'unhandledrejection',
    ) as PromiseRejectionEvent;
    Object.defineProperty(rejectionEvent, 'reason', { value: reason });
    Object.defineProperty(rejectionEvent, 'promise', {
      value: Promise.reject(reason).catch(() => {}),
    });
    window.dispatchEvent(rejectionEvent);

    expect(trackEvent).toHaveBeenCalledTimes(2);
    const [, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    expect(props.phase).toBe('unhandled_rejection');
    expect(props.errorName).toBe('DataCloneError');
  });

  it('matches the V8 phrase via event.message when event.error is null', () => {
    // Cross-origin script errors land here with `event.error === null` and
    // the message-only fallback. The listener wraps the string into
    // `{ message }` so the existing object-shape check in
    // `isDataCloneLikeError` can still classify (Copilot review, PR #10038).
    const trackEvent = vi.fn();
    uninstall = installSnapWindowErrorListener(trackEvent);

    const errorEvent = new ErrorEvent('error', {
      message:
        'Unable to deserialize cloned data due to invalid or unsupported version.',
      // No `error` field — simulates the cross-origin / sanitized case.
    });
    window.dispatchEvent(errorEvent);

    expect(trackEvent).toHaveBeenCalledTimes(2);
    const [, props] = trackEvent.mock.calls[0] as [
      AnalyticsEvent,
      Record<string, unknown>,
    ];
    expect(props.errorMessage).toContain('Unable to deserialize cloned data');
  });

  it('does NOT emit for unrelated errors', () => {
    const trackEvent = vi.fn();
    uninstall = installSnapWindowErrorListener(trackEvent);

    const errorEvent = new ErrorEvent('error', {
      error: new TypeError('Cannot read properties of undefined'),
      message: 'typeError',
    });
    window.dispatchEvent(errorEvent);

    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('is idempotent: a second install is a no-op until uninstall', () => {
    const trackEvent = vi.fn();
    const firstUninstall = installSnapWindowErrorListener(trackEvent);
    const secondUninstall = installSnapWindowErrorListener(trackEvent);
    uninstall = () => {
      firstUninstall();
      secondUninstall();
    };

    const errorEvent = new ErrorEvent('error', {
      error: new Error(
        'Unable to deserialize cloned data due to invalid or unsupported version.',
      ),
    });
    window.dispatchEvent(errorEvent);

    // If the second install had attached duplicate listeners we'd see 4
    // calls (two events × two listeners), not 2.
    expect(trackEvent).toHaveBeenCalledTimes(2);
  });

  it('does not throw if the trackEvent callback itself throws', () => {
    const trackEvent = vi.fn(() => {
      throw new Error('posthog exploded');
    });
    uninstall = installSnapWindowErrorListener(trackEvent);

    expect(() => {
      window.dispatchEvent(
        new ErrorEvent('error', {
          error: new Error(
            'Unable to deserialize cloned data due to invalid or unsupported version.',
          ),
        }),
      );
    }).not.toThrow();
  });

  it('uninstall removes both registered listeners', () => {
    // Spy on add/remove so we can assert that the same handler refs flow
    // through both — dispatching ErrorEvent post-uninstall would otherwise
    // surface as an uncaught exception in jsdom regardless of our listener
    // state, since the ErrorEvent has an `error` Error attached.
    const trackEvent = vi.fn();
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const off = installSnapWindowErrorListener(trackEvent);
    const installedHandlers = new Map<
      string,
      EventListenerOrEventListenerObject
    >();
    for (const call of addSpy.mock.calls) {
      const [type, handler] = call as [
        string,
        EventListenerOrEventListenerObject,
      ];
      if (type === 'error' || type === 'unhandledrejection') {
        installedHandlers.set(type, handler);
      }
    }
    expect(installedHandlers.size).toBe(2);

    off();
    uninstall = () => {};

    const removedHandlers = new Map<
      string,
      EventListenerOrEventListenerObject
    >();
    for (const call of removeSpy.mock.calls) {
      const [type, handler] = call as [
        string,
        EventListenerOrEventListenerObject,
      ];
      if (type === 'error' || type === 'unhandledrejection') {
        removedHandlers.set(type, handler);
      }
    }
    expect(removedHandlers.get('error')).toBe(installedHandlers.get('error'));
    expect(removedHandlers.get('unhandledrejection')).toBe(
      installedHandlers.get('unhandledrejection'),
    );

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
