import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiCollectibleCastBidderCancelledNotificationGroup,
  ApiCollectibleCastBidderOutbidNotificationGroup,
  ApiCollectibleCastBidderSettledNotificationGroup,
  ApiCollectibleCastBidderTimeLeftNotificationGroup,
  ApiCollectibleCastCreatorBidNotificationGroup,
  ApiCollectibleCastCreatorSettledNotificationGroup,
  ApiNotificationCollectibleCastBidderCancelled,
  ApiNotificationCollectibleCastBidderOutbid,
  ApiNotificationCollectibleCastBidderSettled,
  ApiNotificationCollectibleCastBidderTimeLeft,
  ApiNotificationCollectibleCastCreatorBid,
  ApiNotificationCollectibleCastCreatorSettled,
  CastHashPrefix,
} from 'farcaster-client-data';
import {
  formatTimeAgo,
  resolveUsernameShort,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { Sparkle } from 'lucide-react';
import React, { FC, memo, useCallback, useMemo } from 'react';
import { formatUnits } from 'viem';

import { LinkToProfileWithSummaryTooltip } from '~/components/links/LinkToProfileWithSummaryTooltip';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useNavigate } from '~/hooks/navigation/useNavigate';

import { NOTIFICATION_ICON_SIZE } from './NotificationConstants';
import { NotificationAvatarsMinimal } from './shared/NotificationAvatars';
import { NotificationGroupCastText } from './shared/NotificationGroupCastText';
import { NotificationGroupContainer } from './shared/NotificationGroupContainer';
import { NotificationIcon } from './shared/NotificationIcon';

type CollectibleCastNotificationGroupProps = {
  group:
    | ApiCollectibleCastCreatorBidNotificationGroup
    | ApiCollectibleCastCreatorSettledNotificationGroup
    | ApiCollectibleCastBidderOutbidNotificationGroup
    | ApiCollectibleCastBidderSettledNotificationGroup
    | ApiCollectibleCastBidderTimeLeftNotificationGroup
    | ApiCollectibleCastBidderCancelledNotificationGroup;
};

const formatBidAmount = (amount: string | bigint): number => {
  if (typeof amount === 'string') {
    amount = BigInt(amount);
  }
  return parseFloat(formatUnits(amount, 6));
};

const CollectibleCastNotificationGroup: FC<CollectibleCastNotificationGroupProps> =
  memo(({ group }) => {
    const navigate = useNavigate();
    const { trackEvent } = useTrackEvent();
    const { fid: currentUserFid } = useCurrentUser();

    const firstPreviewItem = group.previewItems[0] as
      | ApiNotificationCollectibleCastCreatorBid
      | ApiNotificationCollectibleCastCreatorSettled
      | ApiNotificationCollectibleCastBidderOutbid
      | ApiNotificationCollectibleCastBidderSettled
      | ApiNotificationCollectibleCastBidderTimeLeft
      | ApiNotificationCollectibleCastBidderCancelled;

    const handlePress = useCallback(() => {
      navigate({
        to: 'conversationWithUsername',
        params: {
          username: firstPreviewItem.content.cast.author.username ?? '',
          castHashPrefix: firstPreviewItem.content.cast.hash.slice(
            0,
            10,
          ) as CastHashPrefix,
        },
      });
    }, [
      firstPreviewItem.content.cast.author.username,
      firstPreviewItem.content.cast.hash,
      navigate,
    ]);

    const label = useMemo(() => {
      const bidAmount = formatBidAmount(firstPreviewItem.content.topBid.amount);
      let creatorUsername = firstPreviewItem.content.cast.author.username;
      if (creatorUsername) {
        creatorUsername = creatorUsername.endsWith('s')
          ? `${creatorUsername}'`
          : `${creatorUsername}'s`;
      }
      if (firstPreviewItem.content.cast.author.fid === currentUserFid) {
        creatorUsername = 'your';
      }

      switch (firstPreviewItem.type) {
        case 'collectible-cast-creator-bid':
          return `bid $${bidAmount} on your cast`;
        case 'collectible-cast-creator-settled':
          return `collected your cast for $${bidAmount}`;
        case 'collectible-cast-bidder-outbid':
          return `raised the bid to $${bidAmount} on ${creatorUsername} cast`;
        case 'collectible-cast-bidder-settled':
          return `You collected ${creatorUsername} cast for $${bidAmount}`;
        case 'collectible-cast-bidder-time-left':
          if (
            'auction' in firstPreviewItem.content.collectible &&
            'topBid' in firstPreviewItem.content.collectible.auction
          ) {
            const topBid = firstPreviewItem.content.collectible.auction.topBid;
            if (topBid.bidder.fid === currentUserFid) {
              return `You are still the top bidder on ${creatorUsername} cast`;
            }
            const endTime = firstPreviewItem.content.collectible.auction.end;
            const secondsLeft = Math.floor(
              (endTime - firstPreviewItem.timestamp) / 1000,
            );
            const minutesLeft = Math.floor(secondsLeft / 60);
            return `${creatorUsername} cast auction ends in ${minutesLeft} minutes`;
          }
          return `${creatorUsername} cast auction ends in a few minutes`;
        case 'collectible-cast-bidder-cancelled':
          return `${creatorUsername} deleted their cast. Your bid was refunded.`;
      }
    }, [
      firstPreviewItem.content.cast.author.username,
      firstPreviewItem.content.topBid.amount,
      firstPreviewItem.type,
      firstPreviewItem.content.collectible,
      firstPreviewItem.timestamp,
      currentUserFid,
      firstPreviewItem.content.cast.author.fid,
    ]);

    const actors = useMemo(() => {
      return group.previewItems.map((item) => item.content.topBid.bidder);
    }, [group.previewItems]);

    const showActors =
      firstPreviewItem.type !== 'collectible-cast-bidder-settled' &&
      firstPreviewItem.type !== 'collectible-cast-bidder-time-left' &&
      firstPreviewItem.type !== 'collectible-cast-bidder-cancelled';

    const firstActor = actors[0];
    const secondActor = actors[1];

    const othersText = useMemo(() => {
      const numOtherActors = group.totalItemCount - 1;

      if (numOtherActors === 0) {
        return ' ';
      }

      if (numOtherActors === 1) {
        return (
          <>
            <span className="ml-1"> and </span>
            <LinkToProfileWithSummaryTooltip
              title={`1 other`}
              user={secondActor}
              className="font-semibold text-default hover:underline"
              onClick={() => {
                if (secondActor) {
                  trackEvent(AnalyticsEvent.ClickNotification, {
                    type: group.id,
                    action: 'actor',
                  });
                }
              }}
            >
              1 other{' '}
            </LinkToProfileWithSummaryTooltip>
          </>
        );
      }

      return (
        <>
          <span className="ml-1"> and </span>
          <span className="font-semibold">{`${numOtherActors} others `}</span>
        </>
      );
    }, [group.id, group.totalItemCount, secondActor, trackEvent]);

    return (
      <NotificationGroupContainer
        notificationGroup={group}
        onClick={() => handlePress()}
      >
        <NotificationIcon variant="green">
          <Sparkle size={NOTIFICATION_ICON_SIZE} className="fill-green" />
        </NotificationIcon>
        <div className="flex flex-1 flex-col gap-1">
          {showActors ? (
            <>
              <div className="flex w-full flex-row items-start justify-between gap-x-1">
                <NotificationAvatarsMinimal
                  users={actors}
                  groupType={group.type}
                />
                <div className="text-faint">
                  {formatTimeAgo(firstPreviewItem.timestamp, 'floor')}
                </div>
              </div>
              <div className="flex flex-row flex-wrap items-center text-default">
                <LinkToProfileWithSummaryTooltip
                  title={resolveUsernameShort({
                    username: firstActor.username,
                    fid: firstActor.fid,
                  })}
                  user={firstActor}
                  className="font-semibold text-default hover:underline"
                  onClick={() => {
                    trackEvent(AnalyticsEvent.ClickNotification, {
                      type: group.id,
                      action: 'actor',
                    });
                  }}
                >
                  {resolveUsernameShort({
                    username: firstActor.username,
                    fid: firstActor.fid,
                  })}
                </LinkToProfileWithSummaryTooltip>
                <span className="text-default">{othersText}</span>
                <span className="text-default">&nbsp;{label}</span>
              </div>
            </>
          ) : (
            <div className="flex w-full flex-row items-start justify-between gap-x-1">
              <div className="font-semibold text-default">{label}</div>
              <div className="text-faint">
                {formatTimeAgo(firstPreviewItem.timestamp, 'floor')}
              </div>
            </div>
          )}
          <NotificationGroupCastText cast={firstPreviewItem.content.cast} />
        </div>
      </NotificationGroupContainer>
    );
  });

CollectibleCastNotificationGroup.displayName =
  'CollectibleCastNotificationGroup';

export { CollectibleCastNotificationGroup };
