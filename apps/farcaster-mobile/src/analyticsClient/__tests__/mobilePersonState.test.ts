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

import {
  buildMobileAnalyticsAppMetadata,
  buildMobileAnalyticsPersonProperties,
  syncMobileAnalyticsPersonState,
} from '../mobilePersonState';

describe('buildMobileAnalyticsPersonProperties', () => {
  it('includes fid and neynar_score when present', () => {
    const properties = buildMobileAnalyticsPersonProperties({
      address: '0xabc',
      appMetadata: buildMobileAnalyticsAppMetadata(),
      onboardingState: {
        email: 'user@example.com',
        hasConfirmedEmail: true,
        user: {
          fid: 42,
          neynarScore: 0.91,
          username: 'alice',
        } as never,
      },
    });

    expect(properties).toEqual({
      address: '0xabc',
      app_version: '2.1.10 (557) (android)',
      email: 'user@example.com',
      fid: 42,
      neynar_score: 0.91,
      updates_channel: 'production',
      updates_created_at: expect.any(String),
      updates_id: 'update-123',
      updates_is_embedded_launch: false,
      username: 'alice',
      warpcast_version: '2.1.10 (557)',
    });
    expect(properties.updates_created_at).not.toBe('unknown');
  });

  it('omits undefined optional fields', () => {
    const properties = buildMobileAnalyticsPersonProperties({
      appMetadata: buildMobileAnalyticsAppMetadata(),
      onboardingState: {
        email: 'hidden@example.com',
        hasConfirmedEmail: false,
        user: {
          fid: 42,
          username: undefined,
        } as never,
      },
    });

    expect(properties).toEqual({
      app_version: '2.1.10 (557) (android)',
      fid: 42,
      updates_channel: 'production',
      updates_created_at: expect.any(String),
      updates_id: 'update-123',
      updates_is_embedded_launch: false,
      warpcast_version: '2.1.10 (557)',
    });
    expect(properties.updates_created_at).not.toBe('unknown');
    expect(properties).not.toHaveProperty('email');
    expect(properties).not.toHaveProperty('neynar_score');
    expect(properties).not.toHaveProperty('username');
  });
});

describe('syncMobileAnalyticsPersonState', () => {
  it('identifies before setting person properties when enabled', () => {
    const identify = jest.fn();
    const setPersonProperties = jest.fn();

    syncMobileAnalyticsPersonState({
      analytics: { identify, setPersonProperties },
      appMetadata: buildMobileAnalyticsAppMetadata(),
      identifyBeforeSet: true,
      onboardingState: {
        hasConfirmedEmail: false,
        user: {
          fid: 42,
          username: 'alice',
        } as never,
      },
    });

    expect(identify).toHaveBeenCalledWith({
      fid: 42,
      username: 'alice',
    });
    expect(setPersonProperties).toHaveBeenCalledTimes(1);
    expect(identify.mock.invocationCallOrder[0]).toBeLessThan(
      setPersonProperties.mock.invocationCallOrder[0],
    );
  });

  it('skips identify when disabled but still sets fid on person properties', () => {
    const identify = jest.fn();
    const setPersonProperties = jest.fn();

    syncMobileAnalyticsPersonState({
      analytics: { identify, setPersonProperties },
      appMetadata: buildMobileAnalyticsAppMetadata(),
      identifyBeforeSet: false,
      onboardingState: {
        hasConfirmedEmail: false,
        user: {
          fid: 42,
          username: 'alice',
        } as never,
      },
    });

    expect(identify).not.toHaveBeenCalled();
    expect(setPersonProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        fid: 42,
        username: 'alice',
      }),
    );
  });
});
