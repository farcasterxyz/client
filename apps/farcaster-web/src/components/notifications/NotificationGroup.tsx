import { ApiNotificationGroup } from 'farcaster-client-data';
import { EventingProvider } from 'farcaster-client-hooks';
import { FC, memo, useMemo } from 'react';

import { CastMentionNotificationGroup } from '~/components/notifications/CastMentionNotificationGroup';
import { CastReactionNotificationGroup } from '~/components/notifications/CastReactionNotificationGroup';
import { CastReplyNotificationGroup } from '~/components/notifications/CastReplyNotificationGroup';
import { ChannelPinnedCastNotificationGroup } from '~/components/notifications/ChannelPinnedCastNotificationGroup';
import { ChannelRoleAcceptNotificationGroup } from '~/components/notifications/ChannelRoleAcceptNotificationGroup';
import { ChannelRoleInviteNotificationGroup } from '~/components/notifications/ChannelRoleInviteNotificationGroup';
import { ChannelWarningNotificationGroup } from '~/components/notifications/ChannelWarningNotificationGroup';
import { CreatorRewardNotificationGroup } from '~/components/notifications/CreatorRewardNotificationGroup';
import { DepositBonusesIneligibleNotificationGroup } from '~/components/notifications/DepositBonusesIneligibleNotificationGroup';
import { DepositBonusesLaunchNotificationGroup } from '~/components/notifications/DepositBonusesLaunchNotificationGroup';
import { FarcasterProNotificationGroup } from '~/components/notifications/FarcasterProNotificationGroup';
import { FeaturedFrameNotificationGroup } from '~/components/notifications/FeaturedFrameNotificationGroup';
import { FollowNotificationGroup } from '~/components/notifications/FollowNotificationGroup';
import { FrameGenericNotificationGroup } from '~/components/notifications/FrameGenericNotificationGroup';
import { GenericNotificationGroup } from '~/components/notifications/GenericNotificationGroup';
import { NearbywNotificationGroup } from '~/components/notifications/NearbyNotificationGroup';
import { NewCastInChannelNotificationGroup } from '~/components/notifications/NewCastInChannelNotificationGroup';
import { NewCastNotificationGroup } from '~/components/notifications/NewCastNotificationGroup';
import { PaymentReceivedNotificationGroup } from '~/components/notifications/PaymentReceivedNotificationGroup';
import { RecastNotificationGroup } from '~/components/notifications/RecastNotificationGroup';
import { ReferralCodeClaimedNotificationGroup } from '~/components/notifications/ReferralCodeClaimedNotificationGroup';
import { ReferralLaunchNotificationGroup } from '~/components/notifications/ReferralLaunchNotificationGroup';
import { ReferralReminderNotificationGroup } from '~/components/notifications/ReferralReminderNotificationGroup';
import { ReportActionNotificationGroup } from '~/components/notifications/ReportActionNotificationGroup';
import { SetLocationNotificationGroup } from '~/components/notifications/SetLocationNotificationGroup';
import { SpammyRepliesNotificationGroup } from '~/components/notifications/SpammyRepliesNotificationGroup';
import { UserBoostNotificationGroup } from '~/components/notifications/UserBoostNotificationGroup';
import { VerifyNotificationGroup } from '~/components/notifications/VerifyNotificationGroup';
import { WereYouReferredNotificationGroup } from '~/components/notifications/WereYouReferredNotificationGroup';
import { XPClaimReminderNotificationGroup } from '~/components/notifications/XPClaimReminderNotificationGroup';
import { XPRewardExpireNotificationGroup } from '~/components/notifications/XPRewardExpireNotificationGroup';
import { logError } from '~/utils/logUtils';

import { AudioRoomScheduledStartNotificationGroup } from './AudioRoomScheduledStartNotificationGroup';
import { CastQuoteNotificationGroup } from './CastQuoteNotificationGroup';
import { ChannelStreakEndedNotificationGroup } from './ChannelStreakEndedNotificationGroup';
import { ChannelStreakNotificationGroup } from './ChannelStreakNotificationGroup';
import { ChannelStreakUpdateNotificationGroup } from './ChannelStreakUpdateNotificationGroup';
import { CollectibleCastNotificationGroup } from './CollectibleCastNotificationGroup';
import { CollectibleCastWatchAvailableNotificationGroup } from './CollectibleCastWatchAvailableNotificationGroup';
import { ConnectAccountNotificationGroup } from './ConnectAccountNotificationGroup';
import { DormantUserNewCastNotificationGroup } from './DormantUserNewCastNotificationGroup';
import { LimitOrderMatchedNotificationGroup } from './LimitOrderMatchedNotificationGroup';
import { MiniAppNotificationGroup } from './MiniAppNotificationGroup';
import { NewArticleNotificationGroup } from './NewArticleNotificationGroup';
import { NewCampaignNotificationGroup } from './NewCampaignNotificationGroup';
import { SwapFailedNotificationGroup } from './SwapFailedNotificationGroup';
import { TokenAlertNotificationGroup } from './TokenAlertNotificationGroup';
import { TraderAlertNotificationGroup } from './TraderAlertNotificationGroup';
import { TrendingCastNotificationGroup } from './TrendingCastNotificationGroup';
import { TrendingFollowRecommendationNotificationGroup } from './TrendingFollowRecommendationNotification';
import { TrendingTokenNotificationGroup } from './TrendingTokenNotificationGroup';
import { WalletActivityNotificationGroup } from './WalletActivityNotificationGroup';

type NotificationGroupProps = {
  notificationGroup: ApiNotificationGroup;
};

const NotificationGroup: FC<NotificationGroupProps> = memo(
  ({ notificationGroup }) => {
    const comp = useMemo(() => {
      switch (notificationGroup.type) {
        case 'cast-mention':
          return (
            <CastMentionNotificationGroup
              notificationGroup={notificationGroup}
            />
          );
        case 'cast-reaction':
          return (
            <CastReactionNotificationGroup
              notificationGroup={notificationGroup}
            />
          );
        case 'cast-reply':
          return (
            <CastReplyNotificationGroup notificationGroup={notificationGroup} />
          );
        case 'follow':
          return (
            <FollowNotificationGroup notificationGroup={notificationGroup} />
          );
        case 'nearby':
          return (
            <NearbywNotificationGroup notificationGroup={notificationGroup} />
          );
        case 'recast':
          return (
            <RecastNotificationGroup notificationGroup={notificationGroup} />
          );
        case 'generic':
          return (
            <GenericNotificationGroup notificationGroup={notificationGroup} />
          );
        case 'audio-room-scheduled-start':
          return (
            <AudioRoomScheduledStartNotificationGroup
              group={notificationGroup}
            />
          );
        case 'verify':
          return (
            <VerifyNotificationGroup notificationGroup={notificationGroup} />
          );
        case 'set-location':
          return (
            <SetLocationNotificationGroup
              notificationGroup={notificationGroup}
            />
          );
        case 'new-cast':
          return (
            <NewCastNotificationGroup notificationGroup={notificationGroup} />
          );
        case 'new-cast-in-channel':
          return (
            <NewCastInChannelNotificationGroup
              notificationGroup={notificationGroup}
            />
          );
        case 'dormant-user-new-cast':
          return (
            <DormantUserNewCastNotificationGroup
              notificationGroup={notificationGroup}
            />
          );
        case 'cast-quote':
          return (
            <CastQuoteNotificationGroup notificationGroup={notificationGroup} />
          );
        case 'channel-warning':
          return (
            <ChannelWarningNotificationGroup
              notificationGroup={notificationGroup}
            />
          );
        case 'trending-cast':
          return (
            <TrendingCastNotificationGroup
              notificationGroup={notificationGroup}
            />
          );
        case 'channel-streak':
          return (
            <ChannelStreakNotificationGroup
              notificationGroup={notificationGroup}
            />
          );
        case 'channel-streak-ended':
          return (
            <ChannelStreakEndedNotificationGroup
              notificationGroup={notificationGroup}
            />
          );
        case 'channel-streak-update':
          return (
            <ChannelStreakUpdateNotificationGroup
              notificationGroup={notificationGroup}
            />
          );
        case 'report-action':
          return (
            <ReportActionNotificationGroup
              notificationGroup={notificationGroup}
            />
          );
        case 'spammy-replies':
          return (
            <SpammyRepliesNotificationGroup
              notificationGroup={notificationGroup}
            />
          );
        case 'payment-received':
          return (
            <PaymentReceivedNotificationGroup
              notificationGroup={notificationGroup}
            />
          );
        case 'user-boost':
          return (
            <UserBoostNotificationGroup notificationGroup={notificationGroup} />
          );
        case 'creator-reward':
          return (
            <CreatorRewardNotificationGroup
              notificationGroup={notificationGroup}
            />
          );
        case 'channel-role-invite':
          return (
            <ChannelRoleInviteNotificationGroup group={notificationGroup} />
          );
        case 'channel-role-accept':
          return (
            <ChannelRoleAcceptNotificationGroup group={notificationGroup} />
          );
        case 'channel-pinned-cast':
          return (
            <ChannelPinnedCastNotificationGroup group={notificationGroup} />
          );
        case 'connect-account':
          return (
            <ConnectAccountNotificationGroup
              notificationGroup={notificationGroup}
            />
          );
        case 'frame-generic':
          return <FrameGenericNotificationGroup group={notificationGroup} />;
        case 'mini-app':
          return <MiniAppNotificationGroup group={notificationGroup} />;
        case 'featured-frame':
          return <FeaturedFrameNotificationGroup group={notificationGroup} />;
        case 'nudge-advanced-protection':
          // We don't have the ability to adjust this setting on web at this time
          return null;
        case 'trending-follow-recommendation':
          return (
            <TrendingFollowRecommendationNotificationGroup
              group={notificationGroup}
            />
          );
        case 'wallet-activity':
          return <WalletActivityNotificationGroup group={notificationGroup} />;
        case 'new-campaign':
          return <NewCampaignNotificationGroup group={notificationGroup} />;
        case 'farcaster-pro':
          return <FarcasterProNotificationGroup group={notificationGroup} />;
        case 'collectible-cast-creator-bid':
        case 'collectible-cast-bidder-outbid':
        case 'collectible-cast-bidder-settled':
        case 'collectible-cast-creator-settled':
        case 'collectible-cast-bidder-time-left':
        case 'collectible-cast-bidder-cancelled':
          return <CollectibleCastNotificationGroup group={notificationGroup} />;
        case 'collectible-cast-watch-available':
          return (
            <CollectibleCastWatchAvailableNotificationGroup
              group={notificationGroup}
            />
          );
        case 'trending-token':
          return <TrendingTokenNotificationGroup group={notificationGroup} />;
        case 'token-alert':
          return <TokenAlertNotificationGroup group={notificationGroup} />;
        case 'trader-alert':
          return <TraderAlertNotificationGroup group={notificationGroup} />;
        case 'referral-code-claimed':
          return (
            <ReferralCodeClaimedNotificationGroup
              notificationGroup={notificationGroup}
            />
          );
        case 'xp-claim-reminder':
          return (
            <XPClaimReminderNotificationGroup
              notificationGroup={notificationGroup}
            />
          );
        case 'xp-reward-expire-soon':
        case 'xp-reward-expire-imminent':
          return (
            <XPRewardExpireNotificationGroup
              notificationGroup={notificationGroup}
            />
          );
        case 'were-you-referred':
          return (
            <WereYouReferredNotificationGroup
              notificationGroup={notificationGroup}
            />
          );
        case 'referral-reminder':
          return (
            <ReferralReminderNotificationGroup
              notificationGroup={notificationGroup}
            />
          );
        case 'referral-launch':
          return (
            <ReferralLaunchNotificationGroup
              notificationGroup={notificationGroup}
            />
          );
        case 'deposit-bonuses-launch':
          return (
            <DepositBonusesLaunchNotificationGroup
              notificationGroup={notificationGroup}
            />
          );
        case 'deposit-bonuses-ineligible':
          return (
            <DepositBonusesIneligibleNotificationGroup
              notificationGroup={notificationGroup}
            />
          );
        case 'new-article':
          return (
            <NewArticleNotificationGroup
              notificationGroup={notificationGroup}
            />
          );
        case 'swap-failed':
          return <SwapFailedNotificationGroup group={notificationGroup} />;
        case 'limit-order-matched':
          return (
            <LimitOrderMatchedNotificationGroup group={notificationGroup} />
          );
        default:
          logError(
            `Unrecognized notification group type: ${
              (notificationGroup as ApiNotificationGroup).type
            }`,
          );
          return null;
      }
    }, [notificationGroup]);

    return useMemo(
      () => (
        <EventingProvider notificationType={notificationGroup.type}>
          {comp}
        </EventingProvider>
      ),
      [comp, notificationGroup.type],
    );
  },
);

NotificationGroup.displayName = 'NotificationGroup';

export { NotificationGroup };
