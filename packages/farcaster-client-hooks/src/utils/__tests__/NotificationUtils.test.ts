import {
  canDisableMiniAppPushNotifications,
  formatLimitOrderMatchedNotificationCopy,
  formatLimitOrderTokenDisplayAmount,
  getMiniAppNotificationPreferenceSummary,
  inferLimitOrderKindFromTokens,
  resolveLimitOrderKind,
} from '../NotificationUtils';

describe('getMiniAppNotificationPreferenceSummary', () => {
  it.each([
    [true, true, 'Both'],
    [true, false, 'In-app'],
    [false, true, 'Push'],
    [false, false, 'Off'],
  ] as const)(
    'returns %s/%s as %s',
    (inAppNotificationsEnabled, pushNotificationsEnabled, expected) => {
      expect(
        getMiniAppNotificationPreferenceSummary({
          inAppNotificationsEnabled,
          pushNotificationsEnabled,
        }),
      ).toBe(expected);
    },
  );
});

describe('canDisableMiniAppPushNotifications', () => {
  const enabledMiniApp = {
    supportsPushNotifications: true,
    viewerContext: { pushNotificationsEnabled: true },
  };

  it('allows the action for enabled, supported, rollout-eligible Mini Apps', () => {
    expect(
      canDisableMiniAppPushNotifications({
        featureEnabled: true,
        miniApp: enabledMiniApp,
      }),
    ).toBe(true);
  });

  it.each([
    { featureEnabled: false, miniApp: enabledMiniApp },
    {
      featureEnabled: true,
      miniApp: {
        supportsPushNotifications: false,
        viewerContext: { pushNotificationsEnabled: true },
      },
    },
    {
      featureEnabled: true,
      miniApp: {
        supportsPushNotifications: true,
        viewerContext: { pushNotificationsEnabled: false },
      },
    },
    {
      featureEnabled: true,
      miniApp: {
        supportsPushNotifications: true,
        viewerContext: { pushNotificationsEnabled: undefined },
      },
    },
    {
      featureEnabled: true,
      miniApp: enabledMiniApp,
      locallyDisabled: true,
    },
  ])('hides the action when push cannot be disabled', (options) => {
    expect(canDisableMiniAppPushNotifications(options)).toBe(false);
  });
});

describe('NotificationUtils limit order matched', () => {
  describe('inferLimitOrderKindFromTokens', () => {
    it('infers buy when spending USDC', () => {
      expect(
        inferLimitOrderKindFromTokens({
          sellToken: {
            ca: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          },
          buyToken: {
            ca: '0x4200000000000000000000000000000000000006',
          },
        }),
      ).toBe('buy');
    });

    it('infers sell when receiving USDC', () => {
      expect(
        inferLimitOrderKindFromTokens({
          sellToken: {
            ca: '0x4200000000000000000000000000000000000006',
          },
          buyToken: {
            ca: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          },
        }),
      ).toBe('sell');
    });
  });

  describe('formatLimitOrderTokenDisplayAmount', () => {
    it('formats valid token amounts', () => {
      expect(formatLimitOrderTokenDisplayAmount('1000000', 6, 'USDC')).toBe(
        '1 USDC',
      );
    });

    it('returns symbol fallback for invalid amounts', () => {
      expect(
        formatLimitOrderTokenDisplayAmount('not-a-number', 6, 'USDC'),
      ).toBe('USDC');
    });
  });

  describe('resolveLimitOrderKind', () => {
    it('prefers the backend kind when provided', () => {
      expect(
        resolveLimitOrderKind({
          kind: 'buy',
          sellToken: {
            ca: '0x4200000000000000000000000000000000000006',
          },
          buyToken: {
            ca: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          },
        }),
      ).toBe('buy');
    });

    it('falls back to token inference when kind is missing', () => {
      expect(
        resolveLimitOrderKind({
          kind: undefined,
          sellToken: {
            ca: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          },
          buyToken: {
            ca: '0x4200000000000000000000000000000000000006',
          },
        }),
      ).toBe('buy');
    });
  });

  describe('formatLimitOrderMatchedNotificationCopy', () => {
    it('formats matched notification copy for sell and buy orders', () => {
      expect(
        formatLimitOrderMatchedNotificationCopy({
          kind: 'sell',
          sellToken: { symbol: 'USDC', decimals: 6 },
          buyToken: { symbol: 'ETH', decimals: 18 },
          sellAmount: '1000000',
          buyAmount: '500000000000000000',
          isPartialFill: false,
        }),
      ).toEqual({
        title: 'Limit order filled',
        body: 'Sold 1 USDC for 0.5 ETH',
      });

      expect(
        formatLimitOrderMatchedNotificationCopy({
          kind: 'buy',
          sellToken: { symbol: 'USDC', decimals: 6 },
          buyToken: { symbol: 'ETH', decimals: 18 },
          sellAmount: '1000000',
          buyAmount: '500000000000000000',
          isPartialFill: true,
        }),
      ).toEqual({
        title: 'Limit order partially filled',
        body: 'Bought 0.5 ETH for 1 USDC',
      });
    });
  });
});
