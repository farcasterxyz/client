import { render } from '@testing-library/react-native';
import React from 'react';

const mockUseCachedOnboardingState = jest.fn();
const mockUseAnalytics = jest.fn();
const mockUseWallet = jest.fn();

jest.mock('expo-application', () => ({
  nativeApplicationVersion: '2.1.10',
  nativeBuildVersion: '557',
}));

jest.mock('expo-updates', () => ({
  channel: 'production',
  createdAt: new Date('2026-07-08T15:00:00.000Z'),
  isEmbeddedLaunch: false,
  updateId: 'update-123',
}));

jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
  },
}));

jest.mock('farcaster-client-hooks', () => ({
  useCachedOnboardingState: () => mockUseCachedOnboardingState(),
}));

jest.mock('~/contexts/AnalyticsProvider', () => ({
  useAnalytics: () => mockUseAnalytics(),
}));

jest.mock('~/contexts/WalletProvider', () => ({
  useWallet: () => mockUseWallet(),
}));

import { SessionBreadcrumbs } from '../SessionBreadcrumbs';

describe('SessionBreadcrumbs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWallet.mockReturnValue({
      address: '0xabc',
    });
  });

  it('identifies the signed-in user and sets fid on person properties', () => {
    const identify = jest.fn();
    const reset = jest.fn();
    const setUserProperties = jest.fn();

    mockUseAnalytics.mockReturnValue({
      identify,
      reset,
      setUserProperties,
    });
    mockUseCachedOnboardingState.mockReturnValue({
      result: {
        state: {
          email: 'user@example.com',
          hasConfirmedEmail: true,
          user: {
            fid: 42,
            neynarScore: 0.91,
            username: 'alice',
          },
        },
      },
    });

    render(
      <SessionBreadcrumbs>
        <></>
      </SessionBreadcrumbs>,
    );

    expect(identify).toHaveBeenCalledWith({
      fid: 42,
      username: 'alice',
    });
    expect(reset).not.toHaveBeenCalled();
    expect(setUserProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        address: '0xabc',
        email: 'user@example.com',
        fid: 42,
        neynar_score: 0.91,
        username: 'alice',
      }),
    );
  });

  it('does not set neynar_score when the onboarding user has no score', () => {
    const identify = jest.fn();
    const reset = jest.fn();
    const setUserProperties = jest.fn();

    mockUseAnalytics.mockReturnValue({
      identify,
      reset,
      setUserProperties,
    });
    mockUseCachedOnboardingState.mockReturnValue({
      result: {
        state: {
          hasConfirmedEmail: false,
          user: {
            fid: 42,
            username: 'alice',
          },
        },
      },
    });

    render(
      <SessionBreadcrumbs>
        <></>
      </SessionBreadcrumbs>,
    );

    expect(setUserProperties).toHaveBeenCalledWith(
      expect.not.objectContaining({
        neynar_score: expect.anything(),
      }),
    );
    expect(setUserProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        fid: 42,
      }),
    );
  });

  it('does not rewrite person properties when unrelated onboarding state changes', () => {
    const identify = jest.fn();
    const reset = jest.fn();
    const setUserProperties = jest.fn();

    mockUseAnalytics.mockReturnValue({
      identify,
      reset,
      setUserProperties,
    });

    let state = {
      email: 'user@example.com',
      hasConfirmedEmail: true,
      unrelatedField: 'first',
      user: {
        fid: 42,
        neynarScore: 0.91,
        username: 'alice',
      },
    };

    mockUseCachedOnboardingState.mockImplementation(() => ({
      result: { state },
    }));

    const { rerender } = render(
      <SessionBreadcrumbs>
        <></>
      </SessionBreadcrumbs>,
    );

    expect(setUserProperties).toHaveBeenCalledTimes(1);

    state = {
      ...state,
      unrelatedField: 'second',
    };

    rerender(
      <SessionBreadcrumbs>
        <></>
      </SessionBreadcrumbs>,
    );

    expect(setUserProperties).toHaveBeenCalledTimes(1);
  });
});
