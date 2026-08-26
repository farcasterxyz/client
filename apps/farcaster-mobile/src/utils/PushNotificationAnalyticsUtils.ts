import type { NotificationData } from '~/types';

type ProviderPlatform = 'apns' | 'fcm' | 'unknown';

// Keep this aligned with the handled cases in useHandlePushNotification.
const handledPushNotificationTypes = new Set<NotificationData['type']>([
  'view_cast',
  'unread-direct-casts',
  'direct-cast-intent',
  'view-for-you-users',
  'onramp-update',
  'view-discover-assets',
  'view-user-profile',
  'view-notifications',
  'view-location',
  'farcaster-pro-subscription-communication',
  'compose-cast',
  'view-explore-channels',
  'view-connected-addresses',
  'view-muted-keywords',
  'view-edit-location',
  'remote-siwf-request',
  'view-super-follow-casts',
  'dangerously-trigger-navigate',
  'active-badge',
  'sync-contacts',
  'matched-contacts',
  'view-user-boost-info',
  'view-creator-reward',
  'open-mini-app',
  'connect-account',
  'recovery-initiated',
  'trending-token',
  'trader-alert',
  'token-alert',
  'trending-follow-recommendation',
  'wallet-activity',
  'warps-redemption-offer',
  'new-campaign',
  'referral-code-claimed',
  'referral-launch',
  'referral-reminder',
  'xp-reward-expire-soon',
  'xp-reward-expire-imminent',
  'deposit-bonuses-launch',
  'deposit-bonuses-ineligible',
  'new-article',
  'swap-failed',
  'limit-order-matched',
  'usdc-lending',
  'audio-room-live',
  'audio-room-hand-raised',
  'audio-room-invite-to-stage',
  'audio-room-scheduled-start',
]);

const getPushProviderPlatform = (platform: string): ProviderPlatform => {
  if (platform === 'ios') return 'apns';
  if (platform === 'android') return 'fcm';
  return 'unknown';
};

const getPushTokenProviderPlatform = (
  tokenType: string,
  platform: string,
): ProviderPlatform => {
  if (tokenType === 'ios' || tokenType === 'apns') return 'apns';
  if (tokenType === 'android' || tokenType === 'fcm') return 'fcm';
  return getPushProviderPlatform(platform);
};

const getPushNotificationOpenedProperties = ({
  data,
  fid,
  platform,
}: {
  data: unknown;
  fid: number | undefined;
  platform: string;
}) => {
  const payload =
    data && typeof data === 'object'
      ? (data as Record<string, unknown>)
      : undefined;
  const analyticsNotificationId =
    typeof payload?.analyticsNotificationId === 'string'
      ? payload.analyticsNotificationId
      : undefined;
  const variant =
    typeof payload?.variant === 'string' ? payload.variant : undefined;
  const notificationType =
    typeof payload?.type === 'string' ? payload.type : 'unknown';

  return {
    ...(typeof fid === 'number' ? { fid } : {}),
    ...(analyticsNotificationId ? { analyticsNotificationId } : {}),
    notificationId: typeof payload?.id === 'string' ? payload.id : 'unknown',
    notificationType,
    providerPlatform: getPushProviderPlatform(platform),
    outcome: 'opened',
    handled: handledPushNotificationTypes.has(
      notificationType as NotificationData['type'],
    ),
    ...(variant ? { variant } : {}),
  };
};

const getPushTokenRecoveryResultProperties = ({
  fid,
  platform,
  outcome,
}: {
  fid: number | undefined;
  platform: string;
  outcome:
    | 'not-applicable'
    | 'cooldown'
    | 'native-module-unavailable'
    | 'success'
    | 'failure';
}) => ({
  ...(typeof fid === 'number' ? { fid } : {}),
  providerPlatform: getPushProviderPlatform(platform),
  outcome,
  ...(outcome === 'success'
    ? {}
    : {
        failureStage: 'firebase_installation_recovery',
        failureReason: outcome,
      }),
  handled: outcome === 'success' || outcome === 'cooldown',
});

export {
  getPushNotificationOpenedProperties,
  getPushProviderPlatform,
  getPushTokenProviderPlatform,
  getPushTokenRecoveryResultProperties,
};
export type { ProviderPlatform };
