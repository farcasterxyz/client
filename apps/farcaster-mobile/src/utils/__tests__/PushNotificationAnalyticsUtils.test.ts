import { resolveAnalyticsEventName } from '../../constants/AnalyticsEventMap';
import {
  getPushNotificationOpenedProperties,
  getPushProviderPlatform,
  getPushTokenProviderPlatform,
  getPushTokenRecoveryResultProperties,
} from '../PushNotificationAnalyticsUtils';

describe('PushNotificationAnalyticsUtils', () => {
  it('maps the existing open signal to one canonical PostHog event', () => {
    expect(resolveAnalyticsEventName('open push notification')).toBe(
      'push_notification.opened',
    );
  });

  it.each([
    ['ios', 'apns'],
    ['android', 'fcm'],
    ['web', 'unknown'],
  ] as const)('maps %s to provider platform %s', (platform, expected) => {
    expect(getPushProviderPlatform(platform)).toBe(expected);
  });

  it('prefers the native push token provider when available', () => {
    expect(getPushTokenProviderPlatform('fcm', 'ios')).toBe('fcm');
    expect(getPushTokenProviderPlatform('apns', 'android')).toBe('apns');
  });

  it('builds the canonical correlated open properties', () => {
    expect(
      getPushNotificationOpenedProperties({
        data: {
          id: 'notification-1',
          type: 'view_cast',
          analyticsNotificationId: 'logical-1',
          variant: 'trending-reengagement',
        },
        fid: 123,
        platform: 'android',
      }),
    ).toEqual({
      fid: 123,
      analyticsNotificationId: 'logical-1',
      notificationId: 'notification-1',
      notificationType: 'view_cast',
      providerPlatform: 'fcm',
      outcome: 'opened',
      handled: true,
      variant: 'trending-reengagement',
    });
  });

  it('safely reports unknown legacy payloads without inventing correlation', () => {
    expect(
      getPushNotificationOpenedProperties({
        data: undefined,
        fid: undefined,
        platform: 'ios',
      }),
    ).toEqual({
      notificationId: 'unknown',
      notificationType: 'unknown',
      providerPlatform: 'apns',
      outcome: 'opened',
      handled: false,
    });
  });

  it.each([
    ['view_cast', true],
    ['view-highlights', false],
    ['future-notification-type', false],
  ] as const)(
    'marks notification type %s handled=%s',
    (notificationType, handled) => {
      expect(
        getPushNotificationOpenedProperties({
          data: { id: 'notification-1', type: notificationType },
          fid: 123,
          platform: 'ios',
        }),
      ).toEqual(
        expect.objectContaining({
          notificationType,
          handled,
        }),
      );
    },
  );

  it.each([
    ['success', true, undefined],
    ['cooldown', true, 'cooldown'],
    ['failure', false, 'failure'],
    ['native-module-unavailable', false, 'native-module-unavailable'],
    ['not-applicable', false, 'not-applicable'],
  ] as const)(
    'maps FIS recovery outcome %s to canonical properties',
    (outcome, handled, failureReason) => {
      expect(
        getPushTokenRecoveryResultProperties({
          fid: 123,
          platform: 'android',
          outcome,
        }),
      ).toEqual({
        fid: 123,
        providerPlatform: 'fcm',
        outcome,
        ...(failureReason
          ? {
              failureStage: 'firebase_installation_recovery',
              failureReason,
            }
          : {}),
        handled,
      });
    },
  );
});
