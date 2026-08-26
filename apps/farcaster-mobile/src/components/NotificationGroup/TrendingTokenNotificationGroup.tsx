import { ApiTrendingTokenNotificationGroup } from 'farcaster-client-data';
import { TokenIcon } from 'farcaster-expo';
import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { NotificationGraphic } from '~/components/NotificationGroup/shared/NotificationGraphic';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';

type TrendingTokenNotificationGroupProps = {
  group: ApiTrendingTokenNotificationGroup;
};

const TrendingTokenNotificationGroup: FC<TrendingTokenNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();
    const push = usePush();

    const notif = group.previewItems[0];
    let ticker = notif.content.token.ticker;
    if (ticker.length > 14) {
      ticker = ticker.slice(0, 14) + '...';
    }

    const title = `$${ticker} is trending!`;
    const body =
      notif.content.buyersYouKnow > 1
        ? `${notif.content.buyersYouKnow} people you know just bought it`
        : 'Someone you know just bought it';

    return (
      <NotificationGroupOuterContainer
        group={group}
        onPress={() => {
          push('Token', {
            chain: notif.content.token.chain,
            ca: notif.content.token.ca,
            via: 'notification_trending_inapp',
          });
        }}
      >
        <NotificationGraphic>
          <TokenIcon
            iconUrl={notif.content.token.imageUrl}
            diameter={48}
            chain={notif.content.token.chain}
            symbol={ticker}
            badgeOffset={{ top: -2, right: -2 }}
          />
        </NotificationGraphic>
        <NotificationGroupInnerContainer>
          <View style={[t.flexCol, t.flex1, { gap: 2 }]}>
            <Text2 weight="semibold">{title}</Text2>
            <Text2 color="secondary">{body}</Text2>
          </View>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

TrendingTokenNotificationGroup.displayName = 'TrendingTokenNotificationGroup';

export { TrendingTokenNotificationGroup };
