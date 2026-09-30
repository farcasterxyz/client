import {
  apiChainToChainIdOrThrow,
  ApiSwapFailedNotificationGroup,
  isNativeAsset,
  isUsdc,
  isWrappedNativeAsset,
} from 'farcaster-client-data';
import { formatTimeAgo } from 'farcaster-client-hooks';
import { TokenIcon } from 'farcaster-expo';
import { X } from 'lucide-react-native';
import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { NotificationGraphic } from '~/components/NotificationGroup/shared/NotificationGraphic';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';

type SwapFailedNotificationGroupProps = {
  group: ApiSwapFailedNotificationGroup;
};

const SwapFailedNotificationGroup: FC<SwapFailedNotificationGroupProps> = memo(
  ({ group }) => {
    const t = useTheme();
    const push = usePush();

    const notif = group.previewItems[0];
    const { sellToken, buyToken, sellAmount } = notif.content;

    const isBuyNative =
      isNativeAsset(buyToken.ca) || isWrappedNativeAsset(buyToken.ca);
    const isBuyUsdc = isUsdc(buyToken.ca);
    const isSellNative =
      isNativeAsset(sellToken.ca) || isWrappedNativeAsset(sellToken.ca);
    const isSellUsdc = isUsdc(sellToken.ca);

    let mode = 'buy';
    let token = buyToken;

    if (isSellUsdc) {
      mode = 'buy';
      token = buyToken;
    } else if (isBuyUsdc) {
      mode = 'sell';
      token = sellToken;
    } else if (isSellNative) {
      mode = 'buy';
      token = buyToken;
    } else if (isBuyNative) {
      mode = 'sell';
      token = sellToken;
    }

    const title = `${mode === 'buy' ? 'Buy' : 'Sell'} failed`;
    const body = `Tap to retry your ${mode === 'buy' ? 'buy' : 'sell'} of ${token.symbol}`;

    return (
      <NotificationGroupOuterContainer
        group={group}
        onPress={() => {
          push('WalletSwap', {
            platformType: 'mobile',
            swapIntent: {
              sell: {
                chainId: Number(apiChainToChainIdOrThrow(sellToken.chain)),
                address: sellToken.ca,
              },
              buy: {
                chainId: Number(apiChainToChainIdOrThrow(buyToken.chain)),
                address: buyToken.ca,
              },
              sellAmount,
            },
          });
        }}
      >
        <NotificationGraphic>
          <TokenIcon
            iconUrl={token.imageUrl}
            diameter={48}
            symbol={token.symbol}
            badgeOffset={{ top: -3, right: -3 }}
            badge={<SwapFailedBadge />}
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

const SwapFailedBadge = () => {
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
            backgroundColor: t.colors.red500,
            width: 16,
            height: 16,
            overflow: 'hidden',
          },
        ]}
      >
        <X color="white" size={12} strokeWidth={3} />
      </View>
    </View>
  );
};

SwapFailedNotificationGroup.displayName = 'SwapFailedNotificationGroup';

export { SwapFailedNotificationGroup };
