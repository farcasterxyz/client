import { Notification } from 'expo-notifications';

import { NotificationData } from '~/types';

const getPushNotificationData = (notification: Notification) => {
  return (notification.request.content.data ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (notification.request.trigger as any)?.payload?.aps?.data) as
    | NotificationData
    | null
    | undefined;
};

/**
 * Stable per-instance id used to de-duplicate handling of the SAME notification
 * (the response listener and getLastNotificationResponseAsync can both deliver
 * the same tap).
 *
 * This MUST key on the per-notification request identifier, NOT the payload
 * data id. Payload ids like 'unread-direct-casts:1' are shared by EVERY
 * direct-cast push, so keying on the payload id collapses all DC notifications
 * into one and makes every DC tap after the first a silent no-op — on iOS and
 * Android alike (NEYN-12345, PR #10495). The payload id is only a last-resort
 * fallback for notifications that carry no request identifier.
 *
 * If you change this, keep PushNotificationUtils.test.ts green: distinct pushes
 * that share a payload id must still produce distinct instance ids.
 */
const getNotificationInstanceId = (
  notification: Notification,
  fallbackPayloadId: string | undefined,
): string | undefined => {
  return notification.request?.identifier ?? fallbackPayloadId;
};

const rememberNotificationInstance = (
  handledNotificationIds: Set<string>,
  notificationInstanceId: string | undefined,
): boolean => {
  if (!notificationInstanceId) return true;
  if (handledNotificationIds.has(notificationInstanceId)) return false;

  handledNotificationIds.add(notificationInstanceId);
  while (handledNotificationIds.size > 100) {
    const oldest = handledNotificationIds.values().next();
    if (oldest.done) break;
    handledNotificationIds.delete(oldest.value);
  }
  return true;
};

export {
  getNotificationInstanceId,
  getPushNotificationData,
  rememberNotificationInstance,
};
