import { act, renderHook } from '@testing-library/react-native';
import { useRef } from 'react';

import { createRevokedTokenGraceGuard } from '../revokedTokenGrace';
import { useRevokedTokenSignOutHandler } from '../useRevokedTokenSignOutHandler';

jest.mock('../revokedTokenGrace', () => {
  const shouldSignOut = jest.fn();
  const dispose = jest.fn();
  return {
    createRevokedTokenGraceGuard: jest.fn(() => ({ shouldSignOut, dispose })),
  };
});

const mockedCreateGuard = createRevokedTokenGraceGuard as jest.Mock;

// The single guard instance the mocked factory always returns.
const guard = { shouldSignOut: jest.fn(), dispose: jest.fn() };

type OnError = (params: {
  responseStatus: number | undefined;
  requestInfo: { endpointName: string | undefined };
}) => void;

function createApiClientMock() {
  let currentOnError: OnError | undefined;
  const updateOptions = jest.fn((opts: { onError?: OnError }) => {
    if ('onError' in opts) {
      currentOnError = opts.onError;
    }
  });
  return {
    apiClient: { updateOptions } as never,
    updateOptions,
    getOnError: () => currentOnError,
  };
}

type HookProps = {
  isInitialized: boolean;
  isSignedIn: boolean | undefined;
  maybeSignOutAfterRevalidation: (trigger: unknown) => unknown;
  apiClient: never;
};

function renderHandler(initialProps: HookProps) {
  return renderHook(
    (props: HookProps) => {
      const hasRestoredPersistedAuthTokenRef = useRef(false);
      useRevokedTokenSignOutHandler({
        apiClient: props.apiClient,
        isInitialized: props.isInitialized,
        isSignedIn: props.isSignedIn,
        hasRestoredPersistedAuthTokenRef,
        maybeSignOutAfterRevalidation: props.maybeSignOutAfterRevalidation,
      });
    },
    { initialProps },
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedCreateGuard.mockImplementation(() => guard);
  guard.shouldSignOut.mockReturnValue(false);
});

describe('useRevokedTokenSignOutHandler', () => {
  it('does NOT recreate the grace guard when maybeSignOutAfterRevalidation changes (navigation)', () => {
    // Regression: maybeSignOutAfterRevalidation is recreated on every
    // navigation (its trackEvent dep closes over the current path). If the
    // effect depended on it, each screen change would dispose + recreate the
    // guard, restarting the 10s/5s grace timers and suppressing post-grace
    // 401s indefinitely.
    const { apiClient } = createApiClientMock();

    const { rerender } = renderHandler({
      apiClient,
      isInitialized: true,
      isSignedIn: true,
      maybeSignOutAfterRevalidation: jest.fn(),
    });

    expect(mockedCreateGuard).toHaveBeenCalledTimes(1);

    // Simulate several navigations, each producing a fresh callback identity.
    rerender({
      apiClient,
      isInitialized: true,
      isSignedIn: true,
      maybeSignOutAfterRevalidation: jest.fn(),
    });
    rerender({
      apiClient,
      isInitialized: true,
      isSignedIn: true,
      maybeSignOutAfterRevalidation: jest.fn(),
    });

    expect(mockedCreateGuard).toHaveBeenCalledTimes(1);
    expect(guard.dispose).not.toHaveBeenCalled();
  });

  it('always invokes the LATEST callback through the ref after a navigation change', () => {
    const first = jest.fn();
    const second = jest.fn();
    const { apiClient, getOnError } = createApiClientMock();

    const { rerender } = renderHandler({
      apiClient,
      isInitialized: true,
      isSignedIn: true,
      maybeSignOutAfterRevalidation: first,
    });

    rerender({
      apiClient,
      isInitialized: true,
      isSignedIn: true,
      maybeSignOutAfterRevalidation: second,
    });

    guard.shouldSignOut.mockReturnValue(true);

    act(() => {
      getOnError()?.({
        responseStatus: 401,
        requestInfo: { endpointName: 'onboardingState' },
      });
    });

    expect(second).toHaveBeenCalledWith({
      source: 'global_handler',
      endpointName: 'onboardingState',
      responseStatus: 401,
    });
    expect(first).not.toHaveBeenCalled();
  });

  it('does not wire the handler until initialized and signed in, and recreates it when sign-in state toggles', () => {
    const { apiClient } = createApiClientMock();

    const { rerender } = renderHandler({
      apiClient,
      isInitialized: false,
      isSignedIn: undefined,
      maybeSignOutAfterRevalidation: jest.fn(),
    });

    expect(mockedCreateGuard).not.toHaveBeenCalled();

    rerender({
      apiClient,
      isInitialized: true,
      isSignedIn: true,
      maybeSignOutAfterRevalidation: jest.fn(),
    });
    expect(mockedCreateGuard).toHaveBeenCalledTimes(1);

    // A genuine sign-in-state change SHOULD tear down and rebuild the handler.
    rerender({
      apiClient,
      isInitialized: true,
      isSignedIn: false,
      maybeSignOutAfterRevalidation: jest.fn(),
    });
    expect(guard.dispose).toHaveBeenCalledTimes(1);

    rerender({
      apiClient,
      isInitialized: true,
      isSignedIn: true,
      maybeSignOutAfterRevalidation: jest.fn(),
    });
    expect(mockedCreateGuard).toHaveBeenCalledTimes(2);
  });

  it('disposes the guard and clears onError on unmount', () => {
    const { apiClient, updateOptions, getOnError } = createApiClientMock();

    const { unmount } = renderHandler({
      apiClient,
      isInitialized: true,
      isSignedIn: true,
      maybeSignOutAfterRevalidation: jest.fn(),
    });

    expect(getOnError()).toBeDefined();

    unmount();

    expect(guard.dispose).toHaveBeenCalledTimes(1);
    expect(updateOptions).toHaveBeenLastCalledWith({ onError: undefined });
  });
});
