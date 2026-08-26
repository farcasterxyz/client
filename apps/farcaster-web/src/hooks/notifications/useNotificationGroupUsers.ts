import { ApiNotificationGroup, ApiUser } from 'farcaster-client-data';
import { useMemo } from 'react';

type NotificationGroupUsersReturnValue = {
  users: ApiUser[];
  totalCount: number;
};

const useNotificationGroupUsers = ({
  notificationGroup,
}: {
  notificationGroup: ApiNotificationGroup;
}): NotificationGroupUsersReturnValue => {
  const users = useMemo(() => {
    switch (notificationGroup.type) {
      case 'channel-warning':
      case 'active-badge':
      case 'sync-contacts':
      case 'report-action':
      case 'user-boost':
      case 'channel-role-invite':
      case 'spammy-replies':
      case 'channel-pinned-cast':
      case 'connect-account':
      case 'frame-generic':
      case 'featured-frame':
      case 'recovery-initiated':
      case 'nudge-advanced-protection':
      case 'trending-follow-recommendation':
      case 'warps-redemption-offer':
      case 'new-campaign':
      case 'farcaster-tips-summary':
      case 'tip-received':
      case 'mini-app':
      case 'collectible-cast-creator-bid':
      case 'collectible-cast-bidder-time-left':
      case 'collectible-cast-bidder-outbid':
      case 'collectible-cast-bidder-settled':
      case 'collectible-cast-creator-settled':
      case 'collectible-cast-bidder-cancelled':
      case 'collectible-cast-watch-available':
      case 'trending-token':
      case 'token-alert':
      case 'trader-alert':
      case 'xp-claim-reminder':
      case 'xp-reward-expire-soon':
      case 'xp-reward-expire-imminent':
      case 'were-you-referred':
      case 'referral-reminder':
      case 'referral-launch':
      case 'deposit-bonuses-launch':
      case 'deposit-bonuses-ineligible':
      case 'view-onramp-update':
      case 'new-article':
      case 'swap-failed':
      case 'limit-order-matched':
      case 'usdc-lending':
        return [];
      case 'wallet-activity':
        if (
          notificationGroup.previewItems[0].content.type === 'receive' &&
          notificationGroup.previewItems[0].content.fromUser
        ) {
          return [notificationGroup.previewItems[0].content.fromUser];
        }
        return [];
      default:
        return notificationGroup.previewItems.map(({ actor }) => actor);
    }
  }, [notificationGroup.previewItems, notificationGroup.type]);

  const totalCount = useMemo(() => {
    switch (notificationGroup.type) {
      case 'new-cast':
      case 'new-cast-in-channel':
      case 'dormant-user-new-cast':
        return Array.from(
          new Set(notificationGroup.previewItems.map(({ actor }) => actor.fid)),
        ).length;
      case 'channel-warning':
        return notificationGroup.totalItemCount;
      case 'active-badge':
        return notificationGroup.totalItemCount;
      default:
        return notificationGroup.totalItemCount;
    }
  }, [
    notificationGroup.previewItems,
    notificationGroup.totalItemCount,
    notificationGroup.type,
  ]);

  return {
    users,
    totalCount,
  };
};

export { useNotificationGroupUsers };
