import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiTraderAlertNotificationGroup,
  isUsdc,
  isWrappedNativeAsset,
} from 'farcaster-client-data';
import {
  formatPrice,
  formatTimeAgo,
  formatTokenStat,
  useTrackEvent,
} from 'farcaster-client-hooks';
import {
  Avatar,
  FarcasterProBadge,
  isNativeAsset,
  TokenIcon,
  useUserLevel,
} from 'farcaster-expo';
import React, { FC, memo } from 'react';
import { Pressable, View } from 'react-native';

import { NotificationGraphic } from '~/components/NotificationGroup/shared/NotificationGraphic';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';

type TraderAlertNotificationGroupProps = {
  group: ApiTraderAlertNotificationGroup;
};

const TraderAlertNotificationGroup: FC<TraderAlertNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();

    const push = usePush();

    const { trackEvent } = useTrackEvent();

    const notif = group.previewItems[0];
    const { sentToken, sentAmount, receivedToken, receivedAmount } =
      notif.content.metadata;

    const isReceivedNative =
      isNativeAsset(receivedToken.ca) || isWrappedNativeAsset(receivedToken.ca);
    const isSentNative =
      isNativeAsset(sentToken.ca) || isWrappedNativeAsset(sentToken.ca);
    const isReceivedUsdc = isUsdc(receivedToken.ca);
    const isSentUsdc = isUsdc(sentToken.ca);

    const sentValue = (sentToken.priceUsd ?? 0) * sentAmount;
    const receivedValue = (receivedToken.priceUsd ?? 0) * receivedAmount;

    const sentValueDisplay = formatPrice(sentValue || receivedValue);
    const receivedValueDisplay = formatPrice(receivedValue || sentValue);

    const sentMarketCapDisplay = sentToken.marketCap
      ? formatTokenStat(sentToken.marketCap)
      : undefined;
    const receivedMarketCapDisplay = receivedToken.marketCap
      ? formatTokenStat(receivedToken.marketCap)
      : undefined;

    const username = notif.content.targetUser.username;
    let verb = 'Bought';
    let body = `${sentValueDisplay} ${receivedToken.symbol}${receivedMarketCapDisplay ? ` at ${receivedMarketCapDisplay} MC` : ''}`;
    let token = receivedToken;
    if (
      isSentUsdc &&
      ['token-bought', 'token-swapped'].includes(notif.content.type)
    ) {
      verb = 'Bought';
      body = `${sentValueDisplay} of ${receivedToken.symbol}${receivedMarketCapDisplay ? ` at ${receivedMarketCapDisplay} MC` : ''}`;
      token = receivedToken;
    } else if (
      isReceivedUsdc &&
      ['token-sold', 'token-swapped'].includes(notif.content.type)
    ) {
      verb = 'Sold';
      body = `${receivedValueDisplay} of ${sentToken.symbol}${sentMarketCapDisplay ? ` at ${sentMarketCapDisplay} MC` : ''}`;
      token = sentToken;
    } else if (
      isSentNative &&
      ['token-bought', 'token-swapped'].includes(notif.content.type)
    ) {
      verb = 'Bought';
      body = `${sentValueDisplay} of ${receivedToken.symbol}${receivedMarketCapDisplay ? ` at ${receivedMarketCapDisplay} MC` : ''}`;
      token = receivedToken;
    } else if (
      isReceivedNative &&
      ['token-sold', 'token-swapped'].includes(notif.content.type)
    ) {
      verb = 'Sold';
      body = `${receivedValueDisplay} of ${sentToken.symbol}${sentMarketCapDisplay ? ` at ${sentMarketCapDisplay} MC` : ''}`;
      token = sentToken;
    }

    const isPro = useUserLevel(notif.content.targetUser) === 'pro';

    const onAvatarPress = React.useCallback(() => {
      trackEvent(AnalyticsEvent.ClickNotification, { type: group.type });

      push('UserV2', { fid: notif.content.targetUser.fid });
    }, [group.type, notif.content.targetUser.fid, push, trackEvent]);

    return (
      <NotificationGroupOuterContainer
        group={group}
        onPress={() => {
          push('Token', {
            chain: token.chain,
            ca: token.ca,
            via: 'notification_trader_alert_inapp',
          });
        }}
      >
        <NotificationGraphic>
          <Pressable onPress={onAvatarPress}>
            <Avatar
              diameter={48}
              pfpUrl={notif.content.targetUser.pfp?.url}
              allowFollowingUser={undefined}
            />
          </Pressable>
          <View style={[t.absolute, { bottom: -3, right: -3 }]}>
            <TokenIcon
              iconUrl={token.imageUrl}
              diameter={20}
              symbol={token.symbol}
              imageBordered
            />
          </View>
        </NotificationGraphic>
        <NotificationGroupInnerContainer>
          <View style={[t.flexCol, t.flex1, { gap: 2 }]}>
            <View style={[t.flexRow, t.justifyBetween, t.itemsStart, t.wFull]}>
              <View style={[t.flexRow, t.itemsCenter, { gap: 2 }]}>
                <Text2 weight="semibold">{username}</Text2>
                {isPro && (
                  <FarcasterProBadge size={18} color={t.colors.text.brand} />
                )}
              </View>
              <Text2 color="tertiary">
                {formatTimeAgo(notif.timestamp, 'floor')}
              </Text2>
            </View>
            <Text2 color="secondary">{`${verb} ${body}`}</Text2>
          </View>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

TraderAlertNotificationGroup.displayName = 'TraderAlertNotificationGroup';

export { TraderAlertNotificationGroup };
