type MockStorage = {
  delete: jest.Mock<void, [string]>;
  getString: jest.Mock<string | undefined, [string]>;
  set: jest.Mock<void, [string, string]>;
  values: Map<string, string>;
};

const buildMockStorage = (): MockStorage => {
  const values = new Map<string, string>();

  return {
    delete: jest.fn((key: string) => {
      values.delete(key);
    }),
    getString: jest.fn((key: string) => values.get(key)),
    set: jest.fn((key: string, value: string) => {
      values.set(key, value);
    }),
    values,
  };
};

const loadFollowingFeedSessionTracking = (mockStorage: MockStorage) => {
  jest.resetModules();
  jest.doMock('farcaster-analytics', () => ({
    AnalyticsEvent: {
      FollowingFeedClose: 'following_feed.close',
      FollowingFeedFirstInteraction: 'following_feed.first_interaction',
      FollowingFeedOpen: 'following_feed.open',
    },
  }));
  jest.doMock('../FastStorageUtils', () => ({
    getStorage: () => mockStorage,
  }));

  return require('../FollowingFeedSessionTracking') as typeof import('../FollowingFeedSessionTracking');
};

describe('FollowingFeedSessionTracking', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('closes an active soft-exited session after the grace period', () => {
    const storage = buildMockStorage();
    const tracking = loadFollowingFeedSessionTracking(storage);
    const trackEvent = jest.fn();

    tracking.openFollowingFeedSession({ trackEvent });
    jest.advanceTimersByTime(10_000);

    tracking.scheduleFollowingFeedSessionClose({ trackEvent });
    jest.advanceTimersByTime(29_999);

    expect(trackEvent).not.toHaveBeenCalledWith(
      'following_feed.close',
      expect.anything(),
    );

    jest.advanceTimersByTime(1);

    expect(trackEvent).toHaveBeenCalledWith('following_feed.close', {
      duration_seconds: 40,
      followingFeedSessionId: expect.any(String),
    });
  });

  it('recovers an expired pending background close before opening a new session', () => {
    const storage = buildMockStorage();
    const trackEvent = jest.fn();
    let tracking = loadFollowingFeedSessionTracking(storage);

    tracking.openFollowingFeedSession({ trackEvent });
    const firstSessionId = trackEvent.mock.calls[0][1].followingFeedSessionId;

    jest.advanceTimersByTime(120_000);
    tracking.scheduleBackgroundFollowingFeedSessionClose({ trackEvent });

    tracking = loadFollowingFeedSessionTracking(storage);
    jest.setSystemTime(10 * 60 * 1000);

    tracking.openFollowingFeedSession({ trackEvent });

    expect(trackEvent).toHaveBeenCalledWith('following_feed.close', {
      duration_seconds: 120,
      followingFeedSessionId: firstSessionId,
    });
    expect(trackEvent).toHaveBeenLastCalledWith('following_feed.open', {
      followingFeedSessionId: expect.any(String),
    });
  });

  it('resumes an unexpired pending background close without fragmenting the session', () => {
    const storage = buildMockStorage();
    const trackEvent = jest.fn();
    let tracking = loadFollowingFeedSessionTracking(storage);

    tracking.openFollowingFeedSession({ trackEvent });
    const firstSessionId = trackEvent.mock.calls[0][1].followingFeedSessionId;

    jest.advanceTimersByTime(45_000);
    tracking.scheduleBackgroundFollowingFeedSessionClose({ trackEvent });

    tracking = loadFollowingFeedSessionTracking(storage);
    jest.setSystemTime(2 * 60 * 1000);

    tracking.openFollowingFeedSession({ trackEvent });

    const openCalls = trackEvent.mock.calls.filter(
      ([event]) => event === 'following_feed.open',
    );

    expect(openCalls).toHaveLength(1);
    expect(openCalls[0][1].followingFeedSessionId).toBe(firstSessionId);
    expect(trackEvent).not.toHaveBeenCalledWith(
      'following_feed.close',
      expect.anything(),
    );
  });
});
