import { Notification } from 'expo-notifications';

import {
  getNotificationInstanceId,
  rememberNotificationInstance,
} from '../PushNotificationUtils';

// Every direct-cast push carries this same payload id, which is exactly why
// de-duplicating on the payload id (instead of the per-notification request
// identifier) swallowed every DC tap after the first — on iOS and Android
// alike. See NEYN-12345 / PR #10495.
const SHARED_DC_PAYLOAD_ID = 'unread-direct-casts:1';

const makeNotification = (identifier: string | undefined): Notification =>
  ({
    request: identifier === undefined ? undefined : { identifier },
    // The rest of the Notification shape is irrelevant to the dedup key.
  }) as unknown as Notification;

describe('getNotificationInstanceId', () => {
  it('keeps distinct pushes distinct even when they share a payload id (NEYN-12345)', () => {
    // Two different DC notifications that share the same payload id must not
    // collapse into a single instance id, or the second tap is silently
    // dropped by the dedup gate.
    const first = getNotificationInstanceId(
      makeNotification('dc-request-1'),
      SHARED_DC_PAYLOAD_ID,
    );
    const second = getNotificationInstanceId(
      makeNotification('dc-request-2'),
      SHARED_DC_PAYLOAD_ID,
    );

    expect(first).toBe('dc-request-1');
    expect(second).toBe('dc-request-2');
    expect(first).not.toBe(second);
  });

  it('is stable for the same notification instance so a true duplicate is deduped', () => {
    const notification = makeNotification('dc-request-1');

    expect(getNotificationInstanceId(notification, SHARED_DC_PAYLOAD_ID)).toBe(
      getNotificationInstanceId(notification, SHARED_DC_PAYLOAD_ID),
    );
  });

  it('falls back to the payload id only when there is no request identifier', () => {
    expect(
      getNotificationInstanceId(makeNotification(undefined), 'fallback-id'),
    ).toBe('fallback-id');
  });
});

describe('rememberNotificationInstance', () => {
  it('allows one event for duplicate listener and cold-start responses', () => {
    const handled = new Set<string>();

    expect(rememberNotificationInstance(handled, 'request-1')).toBe(true);
    expect(rememberNotificationInstance(handled, 'request-1')).toBe(false);
  });

  it('does not collapse distinct responses that share a payload id', () => {
    const handled = new Set<string>();

    expect(rememberNotificationInstance(handled, 'request-1')).toBe(true);
    expect(rememberNotificationInstance(handled, 'request-2')).toBe(true);
  });

  it('evicts by iterator state even when the oldest identifier is empty', () => {
    const handled = new Set<string>([
      '',
      ...Array.from({ length: 100 }, (_, index) => `request-${index}`),
    ]);

    expect(rememberNotificationInstance(handled, 'new-request')).toBe(true);
    expect(handled.size).toBe(100);
    expect(handled.has('')).toBe(false);
    expect(handled.has('new-request')).toBe(true);
  });
});
