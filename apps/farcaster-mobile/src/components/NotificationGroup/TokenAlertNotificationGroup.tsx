import { ApiTokenAlertNotificationGroup } from 'farcaster-client-data';
import {
  formatPrice,
  formatTimeAgo,
  formatTokenStat,
} from 'farcaster-client-hooks';
import { TokenIcon } from 'farcaster-expo';
import { TrendingDown, TrendingUp } from 'lucide-react-native';
import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { NotificationGraphic } from '~/components/NotificationGroup/shared/NotificationGraphic';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';

type TokenAlertNotificationGroupProps = {
  group: ApiTokenAlertNotificationGroup;
};

const TokenAlertNotificationGroup: FC<TokenAlertNotificationGroupProps> = memo(
  ({ group }) => {
    const t = useTheme();
    const push = usePush();

    const notif = group.previewItems[0];
    const {
      upperTargetPriceUsd,
      lowerTargetPriceUsd,
      currentPriceUsd,
      percentChange,
    } = notif.content.metadata;

    let price;
    let hit: 'upper' | 'lower' | undefined = undefined;
    if (upperTargetPriceUsd && upperTargetPriceUsd <= currentPriceUsd) {
      price = upperTargetPriceUsd;
      hit = 'upper';
    } else if (lowerTargetPriceUsd && lowerTargetPriceUsd >= currentPriceUsd) {
      price = lowerTargetPriceUsd;
      hit = 'lower';
    }

    const badge = React.useMemo(() => {
      if (hit === 'upper') {
        return (
          <View
            style={[
              t.bgDefault,
              t.itemsCenter,
              t.justifyCenter,
              {
                width: 20,
                height: 20,
                borderRadius: 6,
                overflow: 'hidden',
              },
            ]}
          >
            <View
              style={[
                t.itemsCenter,
                t.justifyCenter,
                {
                  backgroundColor: t.colors.green600,
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  overflow: 'hidden',
                },
              ]}
            >
              <TrendingUp color="white" size={12} strokeWidth={3} />
            </View>
          </View>
        );
      } else if (hit === 'lower') {
        return (
          <View
            style={[
              t.bgDefault,
              t.itemsCenter,
              t.justifyCenter,
              {
                width: 20,
                height: 20,
                borderRadius: 6,
                overflow: 'hidden',
              },
            ]}
          >
            <View
              style={[
                t.itemsCenter,
                t.justifyCenter,
                {
                  backgroundColor: t.colors.red500,
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  overflow: 'hidden',
                },
              ]}
            >
              <TrendingDown color="white" size={12} strokeWidth={3} />
            </View>
          </View>
        );
      }
      return null;
    }, [
      hit,
      t.colors.green600,
      t.colors.red500,
      t.itemsCenter,
      t.justifyCenter,
      t.bgDefault,
    ]);

    let percentage;
    if (percentChange) {
      percentage = `${(percentChange * 100).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}% `;
    }

    let ticker = notif.content.token.ticker;
    if (ticker.length > 10) {
      ticker = ticker.slice(0, 10) + '...';
    }

    let title = '';
    let body = '';
    if (notif.content.type === 'price-target') {
      title = `${ticker} at ${price ? formatPrice(price) : ''}`;
      body = `Your price target was hit`;
    } else if (notif.content.type === 'price-target-market-cap') {
      if (!notif.content.token.marketCap) {
        return null;
      }
      title = `${ticker} at ${formatTokenStat(notif.content.token.marketCap)}`;
      body = `Your market cap target was hit`;
    } else {
      if (!percentage || !currentPriceUsd || !hit) {
        return null;
      }
      if (currentPriceUsd < 0.1) {
        const priceUsd = notif.content.token.priceUsd
          ? parseFloat(notif.content.token.priceUsd)
          : 0;
        const ratio = currentPriceUsd / priceUsd;
        const marketCap = notif.content.token.marketCap ?? 0;
        const currentMarketCap = marketCap * ratio;
        title = `${ticker} is ${hit === 'upper' ? 'up' : 'down'} ${percentage}`;
        body = `Market cap at ${formatTokenStat(currentMarketCap)}`;
      } else {
        title = `${ticker} is ${hit === 'upper' ? 'up' : 'down'} ${percentage}`;
        body = `Price at ${formatPrice(currentPriceUsd)}`;
      }
    }

    return (
      <NotificationGroupOuterContainer
        group={group}
        onPress={() => {
          push('Token', {
            chain: notif.content.token.chain,
            ca: notif.content.token.ca,
            via: 'notification_token_alert_inapp',
          });
        }}
      >
        <NotificationGraphic>
          <TokenIcon
            iconUrl={notif.content.token.imageUrl}
            diameter={48}
            symbol={ticker}
            badgeOffset={{ top: -3, right: -3 }}
            badge={badge}
          />
        </NotificationGraphic>
        <NotificationGroupInnerContainer>
          <View style={[t.flexCol, t.flex1, { gap: 2 }]}>
            <View style={[t.flexRow, t.justifyBetween, t.itemsStart, t.wFull]}>
              <Text2 weight="semibold">{title}</Text2>
              <Text2 color="tertiary">
                {formatTimeAgo(notif.timestamp, 'floor')}
              </Text2>
            </View>
            <Text2 color="secondary">{body}</Text2>
          </View>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  },
);

TokenAlertNotificationGroup.displayName = 'TokenAlertNotificationGroup';

export { TokenAlertNotificationGroup };
