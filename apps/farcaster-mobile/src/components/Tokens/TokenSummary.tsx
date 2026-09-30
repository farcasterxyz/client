import { Ionicons } from '@expo/vector-icons';
import { ApiTokenLink } from 'farcaster-client-data';
import { formatShorthandNumber, useTokenHolders } from 'farcaster-client-hooks';
import { TokenIcon } from 'farcaster-expo';
import React from 'react';
import { View } from 'react-native';

import { Avatar } from '~/components/Avatar';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

export function TokenSummary({ token }: { token: ApiTokenLink }) {
  const t = useTheme();

  return (
    <View
      style={[t.wFull, t.bgFaint, t.p3, { borderRadius: t.borderRadiuses.$16 }]}
    >
      <View style={[t.flex, t.flexRow, { gap: 8 }]}>
        <TokenIcon
          iconUrl={token.imageUrl}
          chain={token.chain}
          diameter={48}
          symbol={token.ticker}
        />
        <View style={[t.flex1]}>
          <View style={[t.flex1, t.flexRow, t.itemsCenter, t.justifyBetween]}>
            <View
              style={[
                t.flex,
                t.flex1,
                t.itemsStart,
                t.justifyCenter,
                { gap: 4 },
              ]}
            >
              <Text2
                color="primary"
                size="base"
                weight="semibold"
                numberOfLines={1}
              >
                ${token.ticker}
              </Text2>
              {!!token.source?.creator && (
                <View style={[t.flexRow, t.itemsCenter, { gap: 2 }]}>
                  <Text2 color="secondary" size="sm">
                    by
                  </Text2>
                  <Avatar
                    pfpUrl={token.source?.creator?.pfp?.url}
                    diameter={16}
                  />
                  <Text2 color="brand" size="sm" weight="medium">
                    {token.source?.creator?.username}
                  </Text2>
                </View>
              )}
            </View>
            <View style={[t.itemsEnd, { gap: 4 }]}>
              {!!token.marketCap && (
                <Text2 color="secondary" size="sm" weight="semibold">
                  ${formatShorthandNumber(token.marketCap)}
                </Text2>
              )}
              {!!token.holderCount && (
                <View style={[t.flexRow, t.itemsCenter, { gap: 2 }]}>
                  <Ionicons
                    name="people"
                    size={16}
                    color={t.colors.text.tertiary}
                  />
                  <Text2 color="tertiary" size="sm" weight="medium">
                    {formatShorthandNumber(token.holderCount)}
                  </Text2>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

export function TokenSummaryHolders({ token }: { token: ApiTokenLink }) {
  const t = useTheme();

  const { data } = useTokenHolders({ chain: token.chain, ca: token.ca });
  const holders = data?.holders;

  if (!holders || holders.length === 0) {
    return null;
  }

  return (
    <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 4 }]}>
      <View style={[t.flex, t.flexRow, t.itemsCenter]}>
        {holders.slice(0, 3).map((holder, index) => {
          if (!holder.user) {
            return null;
          }

          return (
            <View
              key={holder.user.fid}
              style={[
                t.roundedFull,
                t.borderHairline,
                t.borderFaint,
                index > 0 ? { marginLeft: -4 } : undefined,
              ]}
            >
              <Avatar pfpUrl={holder.user.pfp?.url} diameter={16} />
            </View>
          );
        })}
      </View>
      <View style={[t.flex1]}>
        {holders.length === 1 && (
          <Text2 color="secondary" size="sm" numberOfLines={1}>
            {holders[0].user?.username}
          </Text2>
        )}
        {holders.length === 2 && (
          <Text2 color="secondary" size="sm" numberOfLines={1}>
            {holders[0].user?.username} and {holders[1].user?.username}
          </Text2>
        )}
        {holders.length > 2 && (
          <Text2 color="secondary" size="sm" numberOfLines={1}>
            {holders[0].user?.username} and {holders.length - 1} others
          </Text2>
        )}
      </View>
    </View>
  );
}
