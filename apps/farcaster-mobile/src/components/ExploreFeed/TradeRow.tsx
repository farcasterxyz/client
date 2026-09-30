import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiRecentTrade } from 'farcaster-client-data';
import { formatTimeAgo, resolveUsernameShort } from 'farcaster-client-hooks';
import {
  Avatar,
  formatValue,
  Text2,
  TokenIcon,
  useHaptics,
} from 'farcaster-expo';
import React from 'react';
import { Pressable, View } from 'react-native';

import { ExploreFeedTopTraderAlertTrigger } from '~/components/News/ExploreFeedTraderAlertTrigger';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';

export function TradeRow({
  trade,
  via,
}: {
  trade: ApiRecentTrade;
  via: 'explore_feed_recent_trade' | 'recent_trades_screen';
}) {
  const t = useTheme();
  const push = usePush();
  const { trackEvent } = useAnalytics();
  const { triggerImpactAsync } = useHaptics();

  const onUserPress = React.useCallback(() => {
    triggerImpactAsync();
    trackEvent(AnalyticsEvent.PressExploreFeedRecentTrade, {
      fid: trade.user.fid,
      buyTokenChain: trade.buyToken.chain,
      buyTokenCa: trade.buyToken.ca,
    });

    push('UserV2', { fid: trade.user.fid });
  }, [push, trade, trackEvent, triggerImpactAsync]);

  const onTokenPress = React.useCallback(() => {
    triggerImpactAsync();
    trackEvent(AnalyticsEvent.PressExploreFeedRecentTrade, {
      fid: trade.user.fid,
      buyTokenChain: trade.buyToken.chain,
      buyTokenCa: trade.buyToken.ca,
    });

    push('Token', {
      chain: trade.buyToken.chain,
      ca: trade.buyToken.ca,
      via,
    });
  }, [push, trade, trackEvent, triggerImpactAsync, via]);

  const onRowPress = React.useCallback(() => {
    onTokenPress();
  }, [onTokenPress]);

  return (
    <Pressable
      onPress={onRowPress}
      style={[t.flexRow, t.itemsCenter, t.pX3, t.pY2]}
    >
      <Pressable onPress={onUserPress}>
        <Avatar pfpUrl={trade.user.pfp?.url} diameter={48} />
      </Pressable>
      <View style={[t.flex1, t.flexCol, t.pL3]}>
        <View style={[t.flexRow, t.itemsCenter, t.mB1]}>
          <View style={[t.flexRow, t.itemsCenter, { gap: 6 }]}>
            <Pressable onPress={onUserPress}>
              <Text2 color="primary" size="base" weight="semibold">
                {resolveUsernameShort({
                  username: trade.user.username,
                  fid: trade.user.fid,
                })}
              </Text2>
            </Pressable>
            <Text2 color="tertiary" size="base" weight="regular">
              {formatTimeAgo(trade.timestamp)}
            </Text2>
          </View>
        </View>
        <View style={[t.flexRow, t.itemsCenter, { gap: 6 }]}>
          <Text2
            // FIXME: Overriding until we have it updated everywhere
            style={{ color: t.colors.green450 }}
            size="sm"
            weight="semibold"
          >
            bought ${formatValue(trade.tradeValueUsd)}
          </Text2>
          <Pressable onPress={onTokenPress}>
            <View
              style={[
                t.flexRow,
                t.itemsCenter,
                {
                  gap: 4,
                },
              ]}
            >
              <TokenIcon
                iconUrl={trade.buyToken.imageUrl}
                diameter={16}
                symbol={trade.buyToken.symbol}
              />
              <Text2 size="sm" weight="semibold">
                {trade.buyToken.symbol}
              </Text2>
            </View>
          </Pressable>
        </View>
      </View>
      <ExploreFeedTopTraderAlertTrigger trader={trade.user} />
    </Pressable>
  );
}
