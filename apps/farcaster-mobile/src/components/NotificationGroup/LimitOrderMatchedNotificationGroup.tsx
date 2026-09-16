import { ApiLimitOrderMatchedNotificationGroup } from 'farcaster-client-data';
import {
  formatLimitOrderMatchedNotificationCopy,
  formatTimeAgo,
  getLimitOrderMatchedNotificationToken,
  resolveLimitOrderKind,
} from 'farcaster-client-hooks';
import { TokenIcon, useShowWalletOrdersTab } from 'farcaster-expo';
import { Check } from 'lucide-react-native';
import React, { FC, memo, useCallback } from 'react';
import { View } from 'react-native';

import { NotificationGraphic } from '~/components/NotificationGroup/shared/NotificationGraphic';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { navigateToWalletOrdersTab } from '~/hooks/navigation/navigateToWalletOrdersTab';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';

type LimitOrderMatchedNotificationGroupProps = {
  group: ApiLimitOrderMatchedNotificationGroup;
};

const LimitOrderMatchedNotificationGroup: FC<LimitOrderMatchedNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();
    const { showWalletOrdersTab } = useShowWalletOrdersTab();

    const notif = group.previewItems[0];
    const limitOrderId = notif?.content.limitOrderId;

    const handlePress = useCallback(() => {
      if (!limitOrderId) {
        return;
      }

      navigateToWalletOrdersTab({
        showOrdersTab: showWalletOrdersTab,
        limitOrderId,
      });
    }, [limitOrderId, showWalletOrdersTab]);

    if (!notif) {
      return null;
    }

    const { kind, sellToken, buyToken, sellAmount, buyAmount, isPartialFill } =
      notif.content;

    const resolvedKind = resolveLimitOrderKind({
      kind,
      sellToken,
      buyToken,
    });
    const token = getLimitOrderMatchedNotificationToken({
      kind: resolvedKind,
      sellToken,
      buyToken,
    });
    const { title, body } = formatLimitOrderMatchedNotificationCopy({
      kind: resolvedKind,
      sellToken,
      buyToken,
      sellAmount,
      buyAmount,
      isPartialFill,
    });

    return (
      <NotificationGroupOuterContainer group={group} onPress={handlePress}>
        <NotificationGraphic>
          <TokenIcon
            iconUrl={token.imageUrl}
            diameter={48}
            symbol={token.symbol}
            badgeOffset={{ top: -3, right: -3 }}
            badge={<LimitOrderMatchedBadge />}
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
  });

const LimitOrderMatchedBadge = () => {
  const t = useTheme();
  return (
    <View
      style={[
        t.bgDefault,
        t.itemsCenter,
        t.justifyCenter,
        t.roundedFull,
        {
          width: 20,
          height: 20,
          overflow: 'hidden',
        },
      ]}
    >
      <View
        style={[
          t.itemsCenter,
          t.justifyCenter,
          t.roundedFull,
          {
            backgroundColor: t.colors.green500,
            width: 16,
            height: 16,
            overflow: 'hidden',
          },
        ]}
      >
        <Check color="white" size={12} strokeWidth={3} />
      </View>
    </View>
  );
};

LimitOrderMatchedNotificationGroup.displayName =
  'LimitOrderMatchedNotificationGroup';

export { LimitOrderMatchedNotificationGroup };
