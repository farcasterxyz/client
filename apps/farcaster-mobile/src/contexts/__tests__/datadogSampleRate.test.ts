import { posthogClient } from '~/analyticsClient/providers/posthogProvider';
import {
  FALLBACK_CONFIG,
  parsePayload,
  resolveRumSamplingConfig,
} from '~/contexts/datadogSampleRate';
import { getStorage } from '~/utils/FastStorageUtils';

jest.mock('~/analyticsClient/providers/posthogProvider', () => ({
  posthogClient: {
    getFeatureFlagPayload: jest.fn(),
    onFeatureFlags: jest.fn(),
    isFeatureEnabled: jest.fn(),
  },
}));

jest.mock('~/utils/ErrorUtils', () => ({
  trackError: jest.fn(),
}));

jest.mock('~/utils/FastStorageUtils', () => ({
  getStorage: jest.fn(),
}));

const onFeatureFlags = posthogClient.onFeatureFlags as jest.Mock;
const mockGetStorage = getStorage as jest.Mock;

function mockStorage(cached: string | undefined) {
  const setMock = jest.fn();
  const deleteMock = jest.fn();
  mockGetStorage.mockReturnValue({
    getString: jest.fn().mockReturnValue(cached),
    set: setMock,
    delete: deleteMock,
  });
  return { setMock, deleteMock };
}

describe('parsePayload', () => {
  test('returns null for non-object inputs', () => {
    expect(parsePayload(undefined)).toBeNull();
    expect(parsePayload(null)).toBeNull();
    expect(parsePayload(5)).toBeNull();
    expect(parsePayload('5')).toBeNull();
    expect(parsePayload(true)).toBeNull();
    expect(parsePayload([5, 20])).toBeNull();
  });

  test('returns null when fields are missing', () => {
    expect(parsePayload({ sessionSampleRate: 5 })).toBeNull();
    expect(parsePayload({ resourceTraceSampleRate: 5 })).toBeNull();
    expect(parsePayload({})).toBeNull();
  });

  test('returns null for out-of-range rates', () => {
    expect(
      parsePayload({ sessionSampleRate: -1, resourceTraceSampleRate: 5 }),
    ).toBeNull();
    expect(
      parsePayload({ sessionSampleRate: 150, resourceTraceSampleRate: 5 }),
    ).toBeNull();
    expect(
      parsePayload({ sessionSampleRate: 5, resourceTraceSampleRate: -1 }),
    ).toBeNull();
    expect(
      parsePayload({ sessionSampleRate: 5, resourceTraceSampleRate: 150 }),
    ).toBeNull();
  });

  test('returns null for NaN', () => {
    expect(
      parsePayload({
        sessionSampleRate: Number.NaN,
        resourceTraceSampleRate: 5,
      }),
    ).toBeNull();
  });

  test('returns null for string-typed rates', () => {
    expect(
      parsePayload({ sessionSampleRate: '5', resourceTraceSampleRate: 5 }),
    ).toBeNull();
  });

  test('returns config for valid payload', () => {
    expect(
      parsePayload({ sessionSampleRate: 5, resourceTraceSampleRate: 20 }),
    ).toEqual({ sessionSampleRate: 5, resourceTraceSampleRate: 20 });
  });

  test('accepts 0/0', () => {
    expect(
      parsePayload({ sessionSampleRate: 0, resourceTraceSampleRate: 0 }),
    ).toEqual({ sessionSampleRate: 0, resourceTraceSampleRate: 0 });
  });

  test('accepts 100/100', () => {
    expect(
      parsePayload({ sessionSampleRate: 100, resourceTraceSampleRate: 100 }),
    ).toEqual({ sessionSampleRate: 100, resourceTraceSampleRate: 100 });
  });

  test('ignores extra fields', () => {
    expect(
      parsePayload({
        sessionSampleRate: 5,
        resourceTraceSampleRate: 20,
        unrelated: 'x',
      }),
    ).toEqual({ sessionSampleRate: 5, resourceTraceSampleRate: 20 });
  });
});

describe('resolveRumSamplingConfig', () => {
  beforeEach(() => {
    onFeatureFlags.mockReset();
    mockGetStorage.mockReset();
  });

  test('returns FALLBACK_CONFIG on first-ever launch (no cached value)', () => {
    mockStorage(undefined);
    expect(resolveRumSamplingConfig()).toEqual(FALLBACK_CONFIG);
  });

  test('returns cached config when MMKV has valid JSON', () => {
    mockStorage(
      JSON.stringify({ sessionSampleRate: 5, resourceTraceSampleRate: 20 }),
    );
    expect(resolveRumSamplingConfig()).toEqual({
      sessionSampleRate: 5,
      resourceTraceSampleRate: 20,
    });
  });

  test('returns FALLBACK_CONFIG when cached value fails to parse as JSON', () => {
    mockStorage('not valid json {{{');
    expect(resolveRumSamplingConfig()).toEqual(FALLBACK_CONFIG);
  });

  test('returns FALLBACK_CONFIG when cached JSON has wrong shape', () => {
    mockStorage(JSON.stringify({ randomField: 5 }));
    expect(resolveRumSamplingConfig()).toEqual(FALLBACK_CONFIG);
  });

  test('returns FALLBACK_CONFIG when cached JSON has out-of-range rates', () => {
    mockStorage(
      JSON.stringify({ sessionSampleRate: 150, resourceTraceSampleRate: 20 }),
    );
    expect(resolveRumSamplingConfig()).toEqual(FALLBACK_CONFIG);
  });

  test('subscribes to PostHog onFeatureFlags to refresh cache', () => {
    mockStorage(undefined);
    resolveRumSamplingConfig();
    expect(onFeatureFlags).toHaveBeenCalledTimes(1);
  });

  test('refresh callback writes cache when flag is enabled and payload is valid', () => {
    const { setMock } = mockStorage(undefined);
    let refreshCallback: (() => void) | undefined;
    onFeatureFlags.mockImplementation((cb: () => void) => {
      refreshCallback = cb;
    });
    (posthogClient.isFeatureEnabled as jest.Mock).mockReturnValue(true);
    (posthogClient.getFeatureFlagPayload as jest.Mock).mockReturnValue({
      sessionSampleRate: 100,
      resourceTraceSampleRate: 100,
    });

    resolveRumSamplingConfig();
    refreshCallback?.();

    expect(setMock).toHaveBeenCalledWith(
      'datadog-rum-sampling-config',
      JSON.stringify({ sessionSampleRate: 100, resourceTraceSampleRate: 100 }),
    );
  });

  test('refresh callback clears cache when flag is explicitly disabled', () => {
    const { setMock, deleteMock } = mockStorage(
      JSON.stringify({ sessionSampleRate: 100, resourceTraceSampleRate: 100 }),
    );
    let refreshCallback: (() => void) | undefined;
    onFeatureFlags.mockImplementation((cb: () => void) => {
      refreshCallback = cb;
    });
    (posthogClient.isFeatureEnabled as jest.Mock).mockReturnValue(false);

    resolveRumSamplingConfig();
    refreshCallback?.();

    expect(deleteMock).toHaveBeenCalledWith('datadog-rum-sampling-config');
    expect(setMock).not.toHaveBeenCalled();
  });

  test('refresh callback does nothing when PostHog flag state is undefined (not loaded)', () => {
    const { setMock, deleteMock } = mockStorage(undefined);
    let refreshCallback: (() => void) | undefined;
    onFeatureFlags.mockImplementation((cb: () => void) => {
      refreshCallback = cb;
    });
    (posthogClient.isFeatureEnabled as jest.Mock).mockReturnValue(undefined);

    resolveRumSamplingConfig();
    refreshCallback?.();

    expect(setMock).not.toHaveBeenCalled();
    expect(deleteMock).not.toHaveBeenCalled();
  });

  test('refresh callback does not write cache when flag is enabled but payload is undefined', () => {
    const { setMock, deleteMock } = mockStorage(undefined);
    let refreshCallback: (() => void) | undefined;
    onFeatureFlags.mockImplementation((cb: () => void) => {
      refreshCallback = cb;
    });
    (posthogClient.isFeatureEnabled as jest.Mock).mockReturnValue(true);
    (posthogClient.getFeatureFlagPayload as jest.Mock).mockReturnValue(
      undefined,
    );

    resolveRumSamplingConfig();
    refreshCallback?.();

    expect(setMock).not.toHaveBeenCalled();
    expect(deleteMock).not.toHaveBeenCalled();
  });

  test('refresh callback does not write cache when flag is enabled but payload is invalid', () => {
    const { setMock, deleteMock } = mockStorage(undefined);
    let refreshCallback: (() => void) | undefined;
    onFeatureFlags.mockImplementation((cb: () => void) => {
      refreshCallback = cb;
    });
    (posthogClient.isFeatureEnabled as jest.Mock).mockReturnValue(true);
    (posthogClient.getFeatureFlagPayload as jest.Mock).mockReturnValue(5);

    resolveRumSamplingConfig();
    refreshCallback?.();

    expect(setMock).not.toHaveBeenCalled();
    expect(deleteMock).not.toHaveBeenCalled();
  });
});
