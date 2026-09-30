import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiCollectibleCastBidderCancelledNotificationGroup,
  ApiCollectibleCastBidderOutbidNotificationGroup,
  ApiCollectibleCastBidderSettledNotificationGroup,
  ApiCollectibleCastBidderTimeLeftNotificationGroup,
  ApiCollectibleCastCreatorBidNotificationGroup,
  ApiCollectibleCastCreatorSettledNotificationGroup,
  ApiCollectibleCastWatchAvailableNotificationGroup,
  ApiNotificationCollectibleCastBidderCancelled,
  ApiNotificationCollectibleCastBidderOutbid,
  ApiNotificationCollectibleCastBidderSettled,
  ApiNotificationCollectibleCastBidderTimeLeft,
  ApiNotificationCollectibleCastCreatorBid,
  ApiNotificationCollectibleCastCreatorSettled,
  ApiNotificationCollectibleCastWatchAvailable,
} from 'farcaster-client-data';
import {
  formatTimeAgo,
  resolveUsernameShort,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { Avatar, Text, Text2, useCurrentUserFid } from 'farcaster-expo';
import React, { FC, memo, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { formatUnits } from 'viem';

import ActionCollectibleIcon from '~/assets/icons/action-bid.svg';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { useHaptics } from '~/hooks/useHaptics';

import { NotificationDescriptionText } from './shared/NotificationDescriptionText';
import { NotificationGroupAvatarsMinimal } from './shared/NotificationGroupAvatars';
import { NotificationGroupCastText } from './shared/NotificationGroupCastText';
import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';
import {
  NotificationTitleText,
  NotificationTitleTextWithPress,
} from './shared/NotificationTitleText';

type CollectibleCastNotificationGroupProps = {
  group:
    | ApiCollectibleCastCreatorBidNotificationGroup
    | ApiCollectibleCastCreatorSettledNotificationGroup
    | ApiCollectibleCastBidderOutbidNotificationGroup
    | ApiCollectibleCastBidderSettledNotificationGroup
    | ApiCollectibleCastBidderTimeLeftNotificationGroup
    | ApiCollectibleCastBidderCancelledNotificationGroup
    | ApiCollectibleCastWatchAvailableNotificationGroup;
};

const formatBidAmount = (amount: string | bigint): number => {
  if (typeof amount === 'string') {
    amount = BigInt(amount);
  }
  return parseFloat(formatUnits(amount, 6));
};

const CollectibleCastNotificationGroup: FC<CollectibleCastNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();
    const push = usePush();
    const { triggerImpactAsync } = useHaptics();
    const pushToUserProfile = usePushToUserProfile();
    const { trackEvent } = useTrackEvent();
    const currentFid = useCurrentUserFid();

    const firstPreviewItem = group.previewItems[0] as
      | ApiNotificationCollectibleCastCreatorBid
      | ApiNotificationCollectibleCastCreatorSettled
      | ApiNotificationCollectibleCastBidderOutbid
      | ApiNotificationCollectibleCastBidderSettled
      | ApiNotificationCollectibleCastBidderTimeLeft
      | ApiNotificationCollectibleCastBidderCancelled
      | ApiNotificationCollectibleCastWatchAvailable;

    const handlePress = useCallback(() => {
      triggerImpactAsync();
      trackEvent(AnalyticsEvent.ClickNotification, {
        type: group.id,
        action: 'view_group',
      });

      // For watch-available notifications, handle aggregation
      if (firstPreviewItem.type === 'collectible-cast-watch-available') {
        if (group.totalItemCount === 1) {
          push('CollectibleCast', {
            username: firstPreviewItem.content.cast.author.username ?? '',
            castHash: firstPreviewItem.content.cast.hash,
          });
        } else {
          push('NotificationsInGroup', {
            groupId: group.id,
            type: 'collectible-cast-watch-available',
            title: 'Casts available for auction',
          });
        }
      } else {
        // All other notification types go directly to the cast
        push('CollectibleCast', {
          username: firstPreviewItem.content.cast.author.username ?? '',
          castHash: firstPreviewItem.content.cast.hash,
        });
      }
    }, [
      firstPreviewItem.content.cast.author.username,
      firstPreviewItem.content.cast.hash,
      firstPreviewItem.type,
      group.id,
      group.totalItemCount,
      push,
      trackEvent,
      triggerImpactAsync,
    ]);

    const label = useMemo(() => {
      let creatorUsername = resolveUsernameShort(
        firstPreviewItem.content.cast.author,
      );
      if (creatorUsername) {
        creatorUsername = creatorUsername.endsWith('s')
          ? `${creatorUsername}'`
          : `${creatorUsername}'s`;
      }
      if (firstPreviewItem.content.cast.author.fid === currentFid) {
        creatorUsername = 'your';
      }

      switch (firstPreviewItem.type) {
        case 'collectible-cast-watch-available':
          if (group.totalItemCount > 1) {
            return `${group.totalItemCount} casts from ${creatorUsername.replace(/('s|')$/, '')} are up for auction`;
          }
          return `${creatorUsername} cast is now up for auction`;
        case 'collectible-cast-creator-bid':
          if (
            'topBid' in firstPreviewItem.content &&
            firstPreviewItem.content.topBid
          ) {
            const bidAmount = formatBidAmount(
              firstPreviewItem.content.topBid.amount,
            );
            return `bid $${bidAmount} on your cast`;
          }
          return `bid on your cast`;
        case 'collectible-cast-creator-settled':
          if (
            'topBid' in firstPreviewItem.content &&
            firstPreviewItem.content.topBid
          ) {
            const settledAmount = formatBidAmount(
              firstPreviewItem.content.topBid.amount,
            );
            return `collected your cast for $${settledAmount}`;
          }
          return `collected your cast`;
        case 'collectible-cast-bidder-outbid':
          if (
            'topBid' in firstPreviewItem.content &&
            firstPreviewItem.content.topBid
          ) {
            const outbidAmount = formatBidAmount(
              firstPreviewItem.content.topBid.amount,
            );
            return `raised the bid to $${outbidAmount} on ${creatorUsername} cast`;
          }
          return `raised the bid on ${creatorUsername} cast`;
        case 'collectible-cast-bidder-settled':
          if (
            'topBid' in firstPreviewItem.content &&
            firstPreviewItem.content.topBid
          ) {
            const collectedAmount = formatBidAmount(
              firstPreviewItem.content.topBid.amount,
            );
            return `You collected ${creatorUsername} cast for $${collectedAmount}`;
          }
          return `You collected ${creatorUsername} cast`;
        case 'collectible-cast-bidder-time-left':
          if (
            'auction' in firstPreviewItem.content.collectible &&
            'topBid' in firstPreviewItem.content.collectible.auction
          ) {
            const topBid = firstPreviewItem.content.collectible.auction.topBid;
            if (topBid.bidder.fid === currentFid) {
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
      firstPreviewItem.content,
      firstPreviewItem.type,
      firstPreviewItem.timestamp,
      group.totalItemCount,
      currentFid,
    ]);

    const actors = useMemo(() => {
      return group.previewItems
        .map((item) => {
          if (item.type === 'collectible-cast-watch-available') {
            return item.content.cast.author;
          }
          if ('topBid' in item.content && item.content.topBid) {
            return item.content.topBid.bidder;
          }
          return null;
        })
        .filter((actor): actor is NonNullable<typeof actor> => actor !== null);
    }, [group.previewItems]);

    const showActors =
      firstPreviewItem.type !== 'collectible-cast-bidder-settled' &&
      firstPreviewItem.type !== 'collectible-cast-bidder-time-left' &&
      firstPreviewItem.type !== 'collectible-cast-bidder-cancelled' &&
      firstPreviewItem.type !== 'collectible-cast-watch-available';

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
            <NotificationTitleText> and </NotificationTitleText>
            <NotificationTitleTextWithPress
              onPress={() => {
                if (secondActor) {
                  trackEvent(AnalyticsEvent.ClickNotification, {
                    type: group.id,
                    action: 'actor',
                  });

                  pushToUserProfile({ fid: secondActor.fid });
                }
              }}
            >
              1 other{' '}
            </NotificationTitleTextWithPress>
          </>
        );
      }

      return (
        <>
          <NotificationTitleText> and </NotificationTitleText>
          <NotificationTitleText>{`${numOtherActors} others `}</NotificationTitleText>
        </>
      );
    }, [
      group.id,
      group.totalItemCount,
      secondActor,
      trackEvent,
      pushToUserProfile,
    ]);

    return (
      <NotificationGroupOuterContainer group={group} onPress={handlePress}>
        <NotificationIcon variant={'purple'}>
          {(iconColor) => (
            <ActionCollectibleIcon
              size={24}
              fill={iconColor}
              color={iconColor}
            />
          )}
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          {showActors ? (
            <>
              <View style={[t.flexRow, t.justifyBetween, t.itemsStart]}>
                <NotificationGroupAvatarsMinimal actors={actors} />
                <Text2 color="tertiary">
                  {formatTimeAgo(firstPreviewItem.timestamp, 'floor')}
                </Text2>
              </View>
              <View
                style={[
                  t.mT2,
                  t.mR1,
                  t.flex,
                  t.flexRow,
                  t.flexWrap,
                  t.texts.primary,
                  t.itemsCenter,
                  t.overflowHidden,
                ]}
              >
                <Text style={[t.flex, t.flexRow, t.itemsCenter, { gap: 2 }]}>
                  {firstActor && (
                    <NotificationTitleTextWithPress
                      onPress={() => {
                        trackEvent(AnalyticsEvent.ClickNotification, {
                          type: group.id,
                          action: 'actor',
                        });

                        pushToUserProfile({ fid: firstActor.fid });
                      }}
                    >
                      {resolveUsernameShort({
                        username: firstActor.username,
                        fid: firstActor.fid,
                      })}
                    </NotificationTitleTextWithPress>
                  )}
                  <NotificationTitleText>{othersText}</NotificationTitleText>
                  <NotificationTitleText>{label}</NotificationTitleText>
                </Text>
              </View>
            </>
          ) : firstPreviewItem.type === 'collectible-cast-watch-available' ? (
            <>
              <View style={[t.flexRow, t.justifyBetween, t.itemsStart]}>
                <Avatar
                  diameter={36}
                  pfpUrl={firstPreviewItem.content.cast.author.pfp?.url}
                />
                <NotificationDescriptionText>
                  {formatTimeAgo(firstPreviewItem.timestamp, 'floor')}
                </NotificationDescriptionText>
              </View>
              <View
                style={[
                  t.mT2,
                  t.mR1,
                  t.flex,
                  t.flexRow,
                  t.flexWrap,
                  t.texts.primary,
                  t.itemsCenter,
                  t.overflowHidden,
                ]}
              >
                <Text style={[t.flex, t.flexRow, t.itemsCenter, { gap: 2 }]}>
                  <Text style={[t.texts.primary, t.fontSemibold]}>{label}</Text>
                </Text>
              </View>
            </>
          ) : (
            <View style={[t.flexRow, t.justifyBetween, t.itemsStart]}>
              <View style={[t.w64]}>
                <NotificationTitleText>{label}</NotificationTitleText>
              </View>
              <NotificationDescriptionText>
                {formatTimeAgo(firstPreviewItem.timestamp, 'floor')}
              </NotificationDescriptionText>
            </View>
          )}
          <NotificationGroupCastText cast={firstPreviewItem.content.cast} />
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

CollectibleCastNotificationGroup.displayName =
  'CollectibleCastNotificationGroup';

export { CollectibleCastNotificationGroup };
export { ListCollectibleCastWatchAvailableNotification } from './ListCollectibleCastWatchAvailableNotification';
