import { ApiTokenLink, ApiUserMinimal } from 'farcaster-client-data';
import { resolveUsernameShort } from 'farcaster-client-hooks';
import React from 'react';
import { View } from 'react-native';

import { Avatar, FarcasterProBadge, TokenIcon } from '../../../components';
import { AnimatedPressable, Text2 } from '../../../components/design-system';
import { useTheme } from '../../../contexts';
import { useHaptics, useUserLevel } from '../../../hooks';

export function TraderBottomSheetHeader({
  user,
  onUserPress,
  token,
  onTokenPress,
}: {
  user: ApiUserMinimal;
  onUserPress?: (user: ApiUserMinimal) => void;
  token?: Pick<ApiTokenLink, 'name' | 'ticker' | 'imageUrl'>;
  onTokenPress?: () => void;
}) {
  const t = useTheme();
  const { triggerImpactAsync } = useHaptics();
  const userLevel = useUserLevel(user);

  return (
    <View style={[t.flexRow, t.flexShrink, t.itemsCenter, t.p3, { gap: 8 }]}>
      {(() => {
        const userComponent = (
          <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
            <Avatar pfpUrl={user.pfp?.url} diameter={24} />
            <Text2 size="lg" weight="semibold" color="tertiary">
              {resolveUsernameShort(user)}
            </Text2>
            {userLevel === 'pro' && <FarcasterProBadge size={18} />}
          </View>
        );

        if (onUserPress) {
          return (
            <AnimatedPressable
              onPress={() => {
                triggerImpactAsync();
                onUserPress(user);
              }}
            >
              {userComponent}
            </AnimatedPressable>
          );
        }

        return userComponent;
      })()}
      {!!token && (
        <View style={[t.flex1, t.flexRow, t.itemsCenter, { gap: 8 }]}>
          <Text2 size="lg" weight="semibold" color="tertiary">
            /
          </Text2>
          <AnimatedPressable
            style={[t.flex1, t.flexRow, t.itemsCenter, { gap: 8 }]}
            onPress={onTokenPress}
          >
            <TokenIcon iconUrl={token.imageUrl} diameter={24} />
            <Text2
              size="lg"
              weight="medium"
              color="primary"
              numberOfLines={1}
              style={[t.flex1]}
            >
              {token.name ?? token.ticker}
            </Text2>
          </AnimatedPressable>
        </View>
      )}
    </View>
  );
}
