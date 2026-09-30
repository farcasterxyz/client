import { ApiNotificationGroup } from 'farcaster-client-data';
import React, { FC, memo, useMemo } from 'react';

type NotificationGroupProps = {
  group: ApiNotificationGroup;
};

import { EventingProvider } from 'farcaster-client-hooks';

import { NudgeAdvancedProtectionNotificationGroup } from '~/components/NotificationGroup/NudgeAdvancedProtectionNotificationGroup';
import { WarpsRedemptionOfferNotificationGroup } from '~/components/NotificationGroup/WarpsRedemptionOfferNotificationGroup';

import { AudioRoomScheduledStartNotificationGroup } from './AudioRoomScheduledStartNotificationGroup';
import { CastMentionNotificationGroup } from './CastMentionNotificationGroup';
import { CastQuoteNotificationGroup } from './CastQuoteNotificationGroup';
import { CastReactionNotificationGroup } from './CastReactionNotificationGroup';
import { CastReplyNotificationGroup } from './CastReplyNotificationGroup';
import { ChannelPinnedCastNotificationGroup } from './ChannelPinnedCastNotificationGroup';
import { ChannelRoleAcceptNotificationGroup } from './ChannelRoleAcceptNotificationGroup';
import { ChannelRoleInviteNotificationGroup } from './ChannelRoleInviteNotificationGroup';
import { ChannelStreakEndedNotificationGroup } from './ChannelStreakEndedNotificationGroup';
import { ChannelStreakNotificationGroup } from './ChannelStreakNotificationGroup';
import { ChannelStreakUpdateNotificationGroup } from './ChannelStreakUpdateNotificationGroup';
import { ChannelWarningNotificationGroup } from './ChannelWarningNotificationGroup';
import { CollectibleCastNotificationGroup } from './CollectibleCastNotificationGroup';
import { ConnectAccountNotificationGroup } from './ConnectAccountNotificationGroup';
import { CreatorRewardNotificationGroup } from './CreatorRewardNotificationGroup';
import { DepositBonusesIneligibleNotificationGroup } from './DepositBonusesIneligibleNotificationGroup';
import { DepositBonusesLaunchNotificationGroup } from './DepositBonusesLaunchNotificationGroup';
import { DormantUserNewCastNotificationGroup } from './DormantUserNewCastNotificationGroup';
import { FarcasterProNotificationGroup } from './FarcasterProNotificationGroup';
import { FollowNotificationGroup } from './FollowNotificationGroup';
import { FrameGenericNotificationGroup } from './FrameGenericNotificationGroup';
import { GenericNotificationGroup } from './GenericNotificationGroup';
import { LimitOrderMatchedNotificationGroup } from './LimitOrderMatchedNotificationGroup';
import { MiniAppNotificationGroup } from './MiniAppNotificationGroup';
import { NearbyNotificationGroup } from './NearbyNotificationGroup';
import { NewArticleNotificationGroup } from './NewArticleNotificationGroup';
import { NewCampaignNotificationGroup } from './NewCampaignNotificationGroup';
import { NewCastInChannelNotificationGroup } from './NewCastInChannelNotificationGroup';
import { NewCastNotificationGroup } from './NewCastNotificationGroup';
import { PaymentReceivedNotificationGroup } from './PaymentReceivedNotificationGroup';
import { RecastNotificationGroup } from './RecastNotificationGroup';
import { RecoveryInitiatedNotificationGroup } from './RecoveryInitiatedNotificationGroup';
import { ReferralCodeClaimedNotificationGroup } from './ReferralCodeClaimedNotificationGroup';
import { ReferralLaunchNotificationGroup } from './ReferralLaunchNotificationGroup';
import { ReferralReminderNotificationGroup } from './ReferralReminderNotificationGroup';
import { ReportActionNotificationGroup } from './ReportActionNotificationGroup';
import { SetLocationNotificationGroup } from './SetLocationNotificationGroup';
import { SpammyRepliesNotificationGroup } from './SpammyRepliesNotificationGroup';
import { SwapFailedNotificationGroup } from './SwapFailedNotificationGroup';
import { TokenAlertNotificationGroup } from './TokenAlertNotificationGroup';
import { TraderAlertNotificationGroup } from './TraderAlertNotificationGroup';
import { TrendingCastNotificationGroup } from './TrendingCastNotificationGroup';
import { TrendingFollowRecommendationNotificationGroup } from './TrendingFollowRecommendationNotificationGroup';
import { TrendingTokenNotificationGroup } from './TrendingTokenNotificationGroup';
import { USDCLendingNotificationGroup } from './USDCLendingNotificationGroup';
import { VerifyNotificationGroup } from './VerifyNotificationGroup';
import { ViewOnRampUpdateNotificationGroup } from './ViewOnRampUpdateNotificationGroup';
import { WalletActivityNotificationGroup } from './WalletActivityNotificationGroup';
import { WereYouReferredNotificationGroup } from './WereYouReferredNotificationGroup';
import { XPClaimReminderNotificationGroup } from './XPClaimReminderNotificationGroup';
import { XPRewardExpireNotificationGroup } from './XPRewardExpireNotificationGroup';

const NotificationGroup: FC<NotificationGroupProps> = memo(({ group }) => {
  const comp = useMemo(() => {
    switch (group.type) {
      case 'cast-mention':
        return <CastMentionNotificationGroup group={group} />;
      case 'cast-reply':
        return <CastReplyNotificationGroup group={group} />;
      case 'cast-quote':
        return <CastQuoteNotificationGroup group={group} />;
      case 'recast':
        return <RecastNotificationGroup group={group} />;
      case 'cast-reaction':
        return <CastReactionNotificationGroup group={group} />;
      case 'follow':
        return <FollowNotificationGroup group={group} />;
      case 'nearby':
        return <NearbyNotificationGroup group={group} />;
      case 'generic':
        return <GenericNotificationGroup group={group} />;
      case 'audio-room-scheduled-start':
        return <AudioRoomScheduledStartNotificationGroup group={group} />;
      case 'verify':
        return <VerifyNotificationGroup group={group} />;
      case 'set-location':
        return <SetLocationNotificationGroup group={group} />;
      case 'new-cast':
        return <NewCastNotificationGroup group={group} />;
      case 'new-cast-in-channel':
        return <NewCastInChannelNotificationGroup group={group} />;
      case 'dormant-user-new-cast':
        return <DormantUserNewCastNotificationGroup group={group} />;
      case 'creator-reward':
        return <CreatorRewardNotificationGroup group={group} />;
      case 'channel-warning':
        return <ChannelWarningNotificationGroup group={group} />;
      case 'trending-cast':
        return <TrendingCastNotificationGroup group={group} />;
      case 'channel-streak':
        return <ChannelStreakNotificationGroup group={group} />;
      case 'channel-streak-ended':
        return <ChannelStreakEndedNotificationGroup group={group} />;
      case 'channel-streak-update':
        return <ChannelStreakUpdateNotificationGroup group={group} />;
      case 'report-action':
        return <ReportActionNotificationGroup group={group} />;
      case 'payment-received':
        return <PaymentReceivedNotificationGroup group={group} />;
      case 'spammy-replies':
        return <SpammyRepliesNotificationGroup group={group} />;
      case 'channel-role-invite':
        return <ChannelRoleInviteNotificationGroup group={group} />;
      case 'channel-role-accept':
        return <ChannelRoleAcceptNotificationGroup group={group} />;
      case 'channel-pinned-cast':
        return <ChannelPinnedCastNotificationGroup group={group} />;
      case 'connect-account':
        return <ConnectAccountNotificationGroup group={group} />;
      case 'frame-generic':
        return <FrameGenericNotificationGroup group={group} />;
      case 'mini-app':
        return <MiniAppNotificationGroup group={group} />;
      case 'recovery-initiated':
        return <RecoveryInitiatedNotificationGroup group={group} />;
      case 'nudge-advanced-protection':
        return <NudgeAdvancedProtectionNotificationGroup group={group} />;
      case 'trending-follow-recommendation':
        return <TrendingFollowRecommendationNotificationGroup group={group} />;
      case 'warps-redemption-offer':
        return <WarpsRedemptionOfferNotificationGroup group={group} />;
      case 'wallet-activity':
        return <WalletActivityNotificationGroup group={group} />;
      case 'new-campaign':
        return <NewCampaignNotificationGroup group={group} />;
      case 'farcaster-pro':
        return <FarcasterProNotificationGroup group={group} />;
      case 'view-onramp-update':
        return <ViewOnRampUpdateNotificationGroup group={group} />;
      case 'collectible-cast-creator-bid':
      case 'collectible-cast-creator-settled':
      case 'collectible-cast-bidder-outbid':
      case 'collectible-cast-bidder-settled':
      case 'collectible-cast-bidder-time-left':
      case 'collectible-cast-bidder-cancelled':
      case 'collectible-cast-watch-available':
        return <CollectibleCastNotificationGroup group={group} />;
      case 'trending-token':
        return <TrendingTokenNotificationGroup group={group} />;
      case 'token-alert':
        return <TokenAlertNotificationGroup group={group} />;
      case 'trader-alert':
        return <TraderAlertNotificationGroup group={group} />;
      case 'referral-code-claimed':
        return <ReferralCodeClaimedNotificationGroup group={group} />;
      case 'xp-claim-reminder':
        return <XPClaimReminderNotificationGroup group={group} />;
      case 'xp-reward-expire-soon':
      case 'xp-reward-expire-imminent':
        return <XPRewardExpireNotificationGroup group={group} />;
      case 'were-you-referred':
        return <WereYouReferredNotificationGroup group={group} />;
      case 'referral-reminder':
        return <ReferralReminderNotificationGroup group={group} />;
      case 'referral-launch':
        return <ReferralLaunchNotificationGroup group={group} />;
      case 'deposit-bonuses-launch':
        return <DepositBonusesLaunchNotificationGroup group={group} />;
      case 'deposit-bonuses-ineligible':
        return <DepositBonusesIneligibleNotificationGroup group={group} />;
      case 'new-article':
        return <NewArticleNotificationGroup group={group} />;
      case 'swap-failed':
        return <SwapFailedNotificationGroup group={group} />;
      case 'limit-order-matched':
        return <LimitOrderMatchedNotificationGroup group={group} />;
      case 'usdc-lending':
        return <USDCLendingNotificationGroup group={group} />;
      default:
        return null;
    }
  }, [group]);

  return useMemo(
    () => (
      <EventingProvider notificationType={group.type}>{comp}</EventingProvider>
    ),
    [comp, group.type],
  );
});

NotificationGroup.displayName = 'NotificationGroup';

export { NotificationGroup };
