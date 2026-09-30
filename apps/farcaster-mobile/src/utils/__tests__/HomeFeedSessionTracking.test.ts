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

const loadHomeFeedSessionTracking = (mockStorage: MockStorage) => {
  jest.resetModules();
  jest.doMock('farcaster-analytics', () => ({
    AnalyticsEvent: {
      HomeFeedClose: 'home_feed.close',
      HomeFeedFirstInteraction: 'home_feed.first_interaction',
      HomeFeedOpen: 'home_feed.open',
    },
  }));
  jest.doMock('../FastStorageUtils', () => ({
    getStorage: () => mockStorage,
  }));

  return require('../HomeFeedSessionTracking') as typeof import('../HomeFeedSessionTracking');
};

describe('HomeFeedSessionTracking', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('closes an active soft-exited session after the grace period', () => {
    const storage = buildMockStorage();
    const tracking = loadHomeFeedSessionTracking(storage);
    const trackEvent = jest.fn();

    tracking.openHomeFeedSession({ trackEvent });
    jest.advanceTimersByTime(10_000);

    tracking.scheduleHomeFeedSessionClose({ trackEvent });
    jest.advanceTimersByTime(29_999);

    expect(trackEvent).not.toHaveBeenCalledWith(
      'home_feed.close',
      expect.anything(),
    );

    jest.advanceTimersByTime(1);

    expect(trackEvent).toHaveBeenCalledWith('home_feed.close', {
      duration_seconds: 40,
      homeFeedSessionId: expect.any(String),
    });
  });

  it('recovers an expired pending background close before opening a new session', () => {
    const storage = buildMockStorage();
    const trackEvent = jest.fn();
    let tracking = loadHomeFeedSessionTracking(storage);

    tracking.openHomeFeedSession({ trackEvent });
    const firstSessionId = trackEvent.mock.calls[0][1].homeFeedSessionId;

    jest.advanceTimersByTime(120_000);
    tracking.scheduleBackgroundHomeFeedSessionClose({ trackEvent });

    tracking = loadHomeFeedSessionTracking(storage);
    jest.setSystemTime(10 * 60 * 1000);

    tracking.openHomeFeedSession({ trackEvent });

    expect(trackEvent).toHaveBeenCalledWith('home_feed.close', {
      duration_seconds: 120,
      homeFeedSessionId: firstSessionId,
    });
    expect(trackEvent).toHaveBeenLastCalledWith('home_feed.open', {
      homeFeedSessionId: expect.any(String),
    });
  });

  it('resumes an unexpired pending background close without fragmenting the session', () => {
    const storage = buildMockStorage();
    const trackEvent = jest.fn();
    let tracking = loadHomeFeedSessionTracking(storage);

    tracking.openHomeFeedSession({ trackEvent });
    const firstSessionId = trackEvent.mock.calls[0][1].homeFeedSessionId;

    jest.advanceTimersByTime(45_000);
    tracking.scheduleBackgroundHomeFeedSessionClose({ trackEvent });

    tracking = loadHomeFeedSessionTracking(storage);
    jest.setSystemTime(2 * 60 * 1000);

    tracking.openHomeFeedSession({ trackEvent });

    const openCalls = trackEvent.mock.calls.filter(
      ([event]) => event === 'home_feed.open',
    );

    expect(openCalls).toHaveLength(1);
    expect(openCalls[0][1].homeFeedSessionId).toBe(firstSessionId);
    expect(trackEvent).not.toHaveBeenCalledWith(
      'home_feed.close',
      expect.anything(),
    );
  });
});
